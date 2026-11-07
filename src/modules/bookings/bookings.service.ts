import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { BaseRepository } from '../repository/base.repository';
import { Booking } from '../mongoose-models/schemas/booking.schema';
import { BookingStatus, RepositoryTokens } from '../../shared/enums/db.enum';
import { ApiException } from '../../exceptions/api.exception';
import { SlotsService } from '../slots/slots.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { normaliseEmail, validateCreateBooking, CreateBookingInput } from '../../common/validation';

export interface BookingView {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: BookingStatus;
  created_at: string;
}

export interface CreateResult {
  status: number;
  body: BookingView;
}

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const toView = (b: Booking): BookingView => ({
  id: b._id.toString(),
  slot_id: b.slotId,
  name: b.name,
  email: b.email,
  status: b.status,
  created_at: new Date(b.createdAt).toISOString(),
});

@Injectable()
export class BookingsService {
  constructor(
    @Inject(RepositoryTokens.BOOKING) private readonly bookings: BaseRepository<Booking>,
    private readonly slots: SlotsService,
    private readonly idempotency: IdempotencyService,
    private readonly rateLimit: RateLimitService,
  ) {}

  /**
   * POST /bookings
   * Order: idempotent replay -> rate limit (every attempt with a usable email counts, failed ones
   * included) -> body validation (400) -> slot exists (404) -> slot not started (400) ->
   * insert, where the unique index decides (409).
   */
  async create(body: unknown, idempotencyKey?: string): Promise<CreateResult> {
    if (idempotencyKey === undefined) return this.attempt(body);

    const key = idempotencyKey.trim();
    if (key === '' || key.length > 255) throw ApiException.VALIDATION('Idempotency-Key must be 1 to 255 characters');

    const claim = await this.idempotency.claim(key, this.idempotency.hashBody(body));
    if (claim.kind === 'replay') return { status: claim.status, body: claim.body as unknown as BookingView };

    try {
      const result = await this.attempt(body);
      await this.idempotency.complete(key, result.status, result.body as unknown as Record<string, unknown>);
      return result;
    } catch (err) {
      // A failed attempt creates nothing, so free the key and let the client retry.
      await this.idempotency.release(key).catch(() => undefined);
      throw err;
    }
  }

  private async attempt(body: unknown): Promise<CreateResult> {
    // "At most 5 attempts per email per minute, failed attempts included": count before validating
    // anything else. If there is no usable email there is nobody to rate-limit, and validation
    // below answers 400.
    const email = body && typeof body === 'object' ? normaliseEmail((body as Record<string, unknown>).email) : null;
    if (email) await this.rateLimit.consume(email);

    return this.createBooking(validateCreateBooking(body));
  }

  private async createBooking(input: CreateBookingInput): Promise<CreateResult> {
    const slot = await this.slots.findById(input.slotId);
    if (!slot) throw ApiException.SLOT_NOT_FOUND();
    if (slot.start.getTime() <= Date.now()) throw ApiException.SLOT_STARTED();

    try {
      const created = await this.bookings.create({
        slotId: input.slotId,
        name: input.name,
        email: input.email,
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
      });
      return { status: 201, body: toView(created) };
    } catch (err: any) {
      // The partial unique index allows one confirmed booking per slot; the loser of a race lands here.
      if (err?.code === 11000) throw ApiException.SLOT_TAKEN();
      throw err;
    }
  }

  /** GET /bookings/:id */
  async get(id: string): Promise<BookingView> {
    if (!OBJECT_ID_RE.test(id)) throw ApiException.BOOKING_NOT_FOUND();
    const booking = await this.bookings.findById(id);
    if (!booking) throw ApiException.BOOKING_NOT_FOUND();
    return toView(booking);
  }

  /** DELETE /bookings/:id: cancels a confirmed booking, which frees the slot for someone else. */
  async cancel(id: string): Promise<BookingView> {
    if (!OBJECT_ID_RE.test(id)) throw ApiException.BOOKING_NOT_FOUND();

    // One atomic update: only a still-confirmed booking can be cancelled, so two simultaneous
    // cancels cannot both succeed.
    const cancelled = await this.bookings.findOneAndUpdate(
      { _id: new Types.ObjectId(id), status: BookingStatus.CONFIRMED },
      { $set: { status: BookingStatus.CANCELLED, cancelledAt: new Date() } },
    );
    if (cancelled) return toView(cancelled);

    const existing = await this.bookings.findById(id);
    if (!existing) throw ApiException.BOOKING_NOT_FOUND();
    throw ApiException.ALREADY_CANCELLED();
  }

  /** GET /bookings?email=&limit=&cursor= : one person's bookings, oldest first, keyset-paged. */
  async listByEmail(emailParam: unknown, limitParam: unknown, cursorParam: unknown) {
    if (typeof emailParam !== 'string' || emailParam.trim() === '') throw ApiException.VALIDATION('email query parameter is required');
    const email = emailParam.trim().toLowerCase();

    let limit = DEFAULT_LIMIT;
    if (limitParam !== undefined) {
      if (typeof limitParam !== 'string' || !/^\d+$/.test(limitParam) || Number(limitParam) < 1 || Number(limitParam) > MAX_LIMIT) {
        throw ApiException.VALIDATION(`limit must be a whole number between 1 and ${MAX_LIMIT}`);
      }
      limit = Number(limitParam);
    }

    const filter: Record<string, unknown> = { email };
    if (cursorParam !== undefined) {
      if (typeof cursorParam !== 'string' || !OBJECT_ID_RE.test(cursorParam)) throw ApiException.VALIDATION('cursor is not valid');
      filter._id = { $gt: new Types.ObjectId(cursorParam) };
    }

    // Fetch one extra row to know whether another page exists.
    const rows = await this.bookings.find(filter, { sort: { _id: 1 }, limit: limit + 1 });
    const page = rows.slice(0, limit);
    return {
      bookings: page.map(toView),
      next_cursor: rows.length > limit ? page[page.length - 1]._id.toString() : null,
    };
  }
}

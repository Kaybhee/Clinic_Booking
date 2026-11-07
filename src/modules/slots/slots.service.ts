import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BaseRepository } from '../repository/base.repository';
import { Slot } from '../mongoose-models/schemas/slot.schema';
import { Booking } from '../mongoose-models/schemas/booking.schema';
import { IdempotencyRecord } from '../mongoose-models/schemas/idempotency.schema';
import { RateLimitWindow } from '../mongoose-models/schemas/rate-limit.schema';
import { BookingStatus, RepositoryTokens } from '../../shared/enums/db.enum';
import { validateReset } from '../../common/validation';

export interface SlotView {
  id: string;
  provider: string;
  start: string;
  end: string;
  available: boolean;
}

@Injectable()
export class SlotsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SlotsService.name);

  constructor(
    @Inject(RepositoryTokens.SLOT) private readonly slots: BaseRepository<Slot>,
    @Inject(RepositoryTokens.BOOKING) private readonly bookings: BaseRepository<Booking>,
    @Inject(RepositoryTokens.IDEMPOTENCY) private readonly idempotency: BaseRepository<IdempotencyRecord>,
    @Inject(RepositoryTokens.RATE_LIMIT) private readonly rateLimits: BaseRepository<RateLimitWindow>,
  ) {}

  /**
   * So the page is usable straight after deploying: if the database has no slots at all,
   * create sample ones for the next 5 days. A POST /reset replaces them like any other slots.
   * Turn off with SEED_DEMO_SLOTS=false.
   */
  async onApplicationBootstrap() {
    if (process.env.SEED_DEMO_SLOTS === 'false') return;
    if ((await this.slots.countDocuments({})) > 0) return;

    const doctors = ['Dr Ade', 'Dr Bello', 'Dr Chika'];
    const hoursUtc = [8, 9, 10, 13, 14];
    const rows: Array<Record<string, unknown>> = [];
    const today = new Date();
    for (let day = 0; day < 5; day++) {
      for (const [d, doctor] of doctors.entries()) {
        for (const h of hoursUtc) {
          const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + day, h, 0, 0));
          if (start.getTime() <= Date.now()) continue;
          const end = new Date(start.getTime() + 30 * 60_000);
          const id = `slot-${start.toISOString().slice(0, 13).replace(/[-T]/g, '')}-d${d + 1}`;
          rows.push({ _id: id, provider: doctor, start, end, startRaw: start.toISOString(), endRaw: end.toISOString() });
        }
      }
    }
    await this.slots.insertMany(rows).catch((e) => this.logger.warn(`demo slots not created: ${e?.message}`));
    this.logger.log(`Created ${rows.length} sample slots (database had none).`);
  }

  /** POST /reset: deletes every booking and replaces all slots (past slots included). */
  async reset(body: unknown): Promise<{ slots: number }> {
    const input = validateReset(body);

    await Promise.all([
      this.bookings.deleteMany({}),
      this.slots.deleteMany({}),
      this.idempotency.deleteMany({}),
      this.rateLimits.deleteMany({}),
    ]);
    if (input.length > 0) {
      await this.slots.insertMany(
        input.map((s) => ({ _id: s.id, provider: s.provider, start: s.startDate, end: s.endDate, startRaw: s.start, endRaw: s.end })),
      );
    }
    return { slots: input.length };
  }

  /** GET /slots: earliest first, optional exact-match provider filter, each with `available`. */
  async list(provider?: string): Promise<SlotView[]> {
    const filter = provider ? { provider } : {};
    const slots = await this.slots.find(filter, { sort: { start: 1, _id: 1 } });
    if (slots.length === 0) return [];

    const taken = await this.bookings.find(
      { status: BookingStatus.CONFIRMED, slotId: { $in: slots.map((s) => s._id) } },
      { projection: { slotId: 1 } },
    );
    const takenIds = new Set(taken.map((b) => b.slotId));

    return slots.map((s) => ({
      id: s._id,
      provider: s.provider,
      start: s.startRaw,
      end: s.endRaw,
      available: !takenIds.has(s._id),
    }));
  }

  findById(id: string) {
    return this.slots.findById(id);
  }
}

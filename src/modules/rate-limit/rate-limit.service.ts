import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseRepository } from '../repository/base.repository';
import { RateLimitWindow } from '../mongoose-models/schemas/rate-limit.schema';
import { RepositoryTokens } from '../../shared/enums/db.enum';
import { ApiException } from '../../exceptions/api.exception';

/**
 * Per-email sliding-window limiter (default: 5 booking attempts per 60 seconds).
 *
 * The whole check-and-record step is ONE atomic update on ONE document (an aggregation-
 * pipeline update), so ten simultaneous requests for the same email cannot all slip
 * through between "count" and "insert". It is also stored in MongoDB rather than in
 * process memory, so it keeps working with several server instances.
 */
@Injectable()
export class RateLimitService {
  private readonly max: number;
  private readonly windowMs: number;

  constructor(
    @Inject(RepositoryTokens.RATE_LIMIT) private readonly repo: BaseRepository<RateLimitWindow>,
    config: ConfigService,
  ) {
    const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    this.max = config.get<number>(`${env}.rateLimit.maxAttempts`) ?? 5;
    this.windowMs = (config.get<number>(`${env}.rateLimit.windowSeconds`) ?? 60) * 1000;
  }

  /** Records an attempt for `email`, or throws 429 with a Retry-After header. */
  async consume(email: string): Promise<void> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.windowMs);

    const pipeline = [
      { $set: { hits: { $filter: { input: { $ifNull: ['$hits', []] }, cond: { $gt: ['$$this', cutoff] } } } } },
      { $set: { allowed: { $lt: [{ $size: '$hits' }, this.max] } } },
      { $set: { hits: { $cond: ['$allowed', { $concatArrays: ['$hits', [now]] }, '$hits'] }, touchedAt: now } },
    ];

    let doc: RateLimitWindow | null = null;
    for (let attempt = 0; attempt < 3 && !doc; attempt++) {
      try {
        doc = await this.repo.findOneAndUpdate({ _id: email } as any, pipeline, { upsert: true });
      } catch (err: any) {
        // Two first-ever requests for the same email can race on the upsert; the loser retries.
        if (err?.code !== 11000) throw err;
      }
    }
    if (!doc) throw new Error('rate limiter could not record the attempt');

    if (!doc.allowed) {
      const oldest = Math.min(...doc.hits.map((h) => new Date(h).getTime()));
      const retryAfter = Math.max(1, Math.ceil((oldest + this.windowMs - now.getTime()) / 1000));
      throw ApiException.RATE_LIMITED(retryAfter);
    }
  }
}

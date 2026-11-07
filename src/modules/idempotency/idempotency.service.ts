import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from '../repository/base.repository';
import { IdempotencyRecord } from '../mongoose-models/schemas/idempotency.schema';
import { RepositoryTokens } from '../../shared/enums/db.enum';
import { ApiException } from '../../exceptions/api.exception';

export type IdempotencyClaim =
  | { kind: 'new' }
  | { kind: 'replay'; status: number; body: Record<string, unknown> };

const WAIT_STEP_MS = 40;
const MAX_WAIT_MS = 8000;
const STALE_AFTER_MS = 30000;

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

/**
 * Makes retries safe. The first request with an Idempotency-Key "claims" it by inserting
 * a record (the key is the unique _id, so only one request can claim it). Retries then:
 *   - replay the stored response when the first request has finished,
 *   - wait for it when it is still running (simultaneous retries never race), or
 *   - get 422 when the same key arrives with a different body.
 * Only successful responses are stored; a failed attempt releases the key so the
 * client can fix the problem and retry with the same key.
 */
@Injectable()
export class IdempotencyService {
  constructor(@Inject(RepositoryTokens.IDEMPOTENCY) private readonly repo: BaseRepository<IdempotencyRecord>) {}

  hashBody(body: unknown): string {
    return createHash('sha256').update(canonical(body)).digest('hex');
  }

  async claim(key: string, bodyHash: string): Promise<IdempotencyClaim> {
    const startedWaiting = Date.now();
    for (;;) {
      try {
        await this.repo.create({ _id: key, bodyHash, state: 'processing', createdAt: new Date() } as any);
        return { kind: 'new' };
      } catch (err: any) {
        if (err?.code !== 11000) throw err;
      }

      const existing = await this.repo.findById(key);
      if (!existing) continue; // released between our insert and our read: try to claim again

      if (existing.bodyHash !== bodyHash) throw ApiException.IDEMPOTENCY_KEY_REUSED();
      if (existing.state === 'done') return { kind: 'replay', status: existing.status as number, body: existing.response as Record<string, unknown> };

      // Still processing: another request holds the key.
      const age = Date.now() - new Date(existing.createdAt).getTime();
      if (age > STALE_AFTER_MS) {
        // The original request must have died; take the key over.
        await this.repo.deleteOne({ _id: key, state: 'processing', createdAt: existing.createdAt } as any);
        continue;
      }
      if (Date.now() - startedWaiting > MAX_WAIT_MS) throw ApiException.REQUEST_IN_PROGRESS();
      await new Promise((r) => setTimeout(r, WAIT_STEP_MS));
    }
  }

  async complete(key: string, status: number, body: Record<string, unknown>): Promise<void> {
    await this.repo.updateOne({ _id: key } as any, { $set: { state: 'done', status, response: body } });
  }

  async release(key: string): Promise<void> {
    await this.repo.deleteOne({ _id: key, state: 'processing' } as any);
  }
}

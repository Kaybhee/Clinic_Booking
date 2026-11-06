import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { MongooseModelsModule } from '../mongoose-models/mongoose.models.module';
import { BaseRepository } from './base.repository';
import { DatabaseModelNames, RepositoryTokens } from '../../shared/enums/db.enum';

const repo = (token: RepositoryTokens, model: DatabaseModelNames) => ({
  provide: token,
  useFactory: (m: any) => new BaseRepository(m),
  inject: [getModelToken(model)],
});

@Module({
  imports: [MongooseModelsModule],
  providers: [
    // Dynamic repository providers for each database schema & entity
    repo(RepositoryTokens.SLOT, DatabaseModelNames.SLOT),
    repo(RepositoryTokens.BOOKING, DatabaseModelNames.BOOKING),
    repo(RepositoryTokens.IDEMPOTENCY, DatabaseModelNames.IDEMPOTENCY),
    repo(RepositoryTokens.RATE_LIMIT, DatabaseModelNames.RATE_LIMIT),
  ],
  exports: [RepositoryTokens.SLOT, RepositoryTokens.BOOKING, RepositoryTokens.IDEMPOTENCY, RepositoryTokens.RATE_LIMIT],
})
export class RepositoryModule implements OnModuleInit {
  constructor(
    @Inject(RepositoryTokens.SLOT) private readonly slots: BaseRepository<any>,
    @Inject(RepositoryTokens.BOOKING) private readonly bookings: BaseRepository<any>,
    @Inject(RepositoryTokens.IDEMPOTENCY) private readonly idempotency: BaseRepository<any>,
    @Inject(RepositoryTokens.RATE_LIMIT) private readonly rateLimits: BaseRepository<any>,
  ) {}

  /**
   * The "one confirmed booking per slot" guarantee is a unique index, so the app must not
   * accept traffic until every index exists.
   */
  async onModuleInit() {
    await Promise.all([this.slots, this.bookings, this.idempotency, this.rateLimits].map((r) => r.ensureIndexes()));
  }
}

import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { IdempotencyService } from './idempotency.service';

@Module({ imports: [RepositoryModule], providers: [IdempotencyService], exports: [IdempotencyService] })
export class IdempotencyModule {}

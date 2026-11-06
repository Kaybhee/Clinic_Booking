import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { SlotsModule } from '../slots/slots.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [RepositoryModule, SlotsModule, IdempotencyModule, RateLimitModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}

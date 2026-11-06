import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { DatabaseModelNames } from '../../shared/enums/db.enum';
import { SlotSchema } from './schemas/slot.schema';
import { BookingSchema } from './schemas/booking.schema';
import { IdempotencyRecordSchema } from './schemas/idempotency.schema';
import { RateLimitWindowSchema } from './schemas/rate-limit.schema';

// Purpose: Centralized module to manage all Mongoose models and schemas to avoid circular dependencies

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DatabaseModelNames.SLOT, schema: SlotSchema },
      { name: DatabaseModelNames.BOOKING, schema: BookingSchema },
      { name: DatabaseModelNames.IDEMPOTENCY, schema: IdempotencyRecordSchema },
      { name: DatabaseModelNames.RATE_LIMIT, schema: RateLimitWindowSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseModelsModule {}

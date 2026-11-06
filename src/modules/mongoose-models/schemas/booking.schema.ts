import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BookingStatus } from '../../../shared/enums/db.enum';

@Schema({ collection: 'bookings', versionKey: false })
export class Booking {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true })
  slotId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, enum: Object.values(BookingStatus), default: BookingStatus.CONFIRMED })
  status: BookingStatus;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;
}

export type BookingDocument = HydratedDocument<Booking>;
export const BookingSchema = SchemaFactory.createForClass(Booking);

/**
 * The rule "two people can never book the same slot" lives in the database, not in
 * application code: only ONE confirmed booking may exist per slot. Two simultaneous
 * requests can both see the slot as free, but only one insert can win; the other gets
 * a duplicate-key error which the service turns into 409. Cancelled bookings fall out
 * of the index, so a cancelled slot can be booked again.
 */
BookingSchema.index(
  { slotId: 1 },
  { unique: true, partialFilterExpression: { status: BookingStatus.CONFIRMED }, name: 'one_confirmed_booking_per_slot' },
);

// Powers GET /bookings?email=...&cursor=... (oldest first, keyset paging on _id).
BookingSchema.index({ email: 1, _id: 1 }, { name: 'bookings_by_email' });

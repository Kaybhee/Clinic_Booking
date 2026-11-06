import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'idempotency_records', versionKey: false })
export class IdempotencyRecord {
  /** The client-supplied Idempotency-Key. */
  @Prop({ type: String, required: true })
  _id: string;

  /** Hash of the request body, so the same key with a different body can be rejected. */
  @Prop({ type: String, required: true })
  bodyHash: string;

  @Prop({ type: String, enum: ['processing', 'done'], required: true })
  state: 'processing' | 'done';

  @Prop({ type: Number, default: null })
  status: number | null;

  @Prop({ type: Object, default: null })
  response: Record<string, unknown> | null;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;
}

export type IdempotencyRecordDocument = HydratedDocument<IdempotencyRecord>;
export const IdempotencyRecordSchema = SchemaFactory.createForClass(IdempotencyRecord);

// Keys are only meaningful for a day.
IdempotencyRecordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

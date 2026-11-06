import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** Sliding-window log of booking attempts for one email address. */
@Schema({ collection: 'rate_limits', versionKey: false })
export class RateLimitWindow {
  /** The (normalised) email address. */
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: [Date], default: [] })
  hits: Date[];

  @Prop({ type: Boolean, default: true })
  allowed: boolean;

  @Prop({ type: Date, default: () => new Date() })
  touchedAt: Date;
}

export type RateLimitWindowDocument = HydratedDocument<RateLimitWindow>;
export const RateLimitWindowSchema = SchemaFactory.createForClass(RateLimitWindow);

// Idle windows clean themselves up.
RateLimitWindowSchema.index({ touchedAt: 1 }, { expireAfterSeconds: 60 * 60 });

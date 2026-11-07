import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * A bookable appointment slot. The id is supplied by the client through POST /reset,
 * so `_id` is a string. `startRaw` / `endRaw` keep the timestamps exactly as they were
 * sent, because the API echoes them back unchanged; `start` / `end` are the parsed
 * dates used for sorting and for the "already started" check.
 */
@Schema({ collection: 'slots', versionKey: false })
export class Slot {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  provider: string;

  @Prop({ type: Date, required: true, index: true })
  start: Date;

  @Prop({ type: Date, required: true })
  end: Date;

  @Prop({ type: String, required: true })
  startRaw: string;

  @Prop({ type: String, required: true })
  endRaw: string;
}

export type SlotDocument = HydratedDocument<Slot>;
export const SlotSchema = SchemaFactory.createForClass(Slot);

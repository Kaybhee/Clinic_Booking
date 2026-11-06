import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


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

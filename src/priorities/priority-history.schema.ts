import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PriorityHistoryDocument = PriorityHistory & Document;

@Schema({ timestamps: true })
export class PriorityHistory {
  @Prop({ required: true })
  priorityId: string;

  @Prop({ required: true })
  field: string;

  @Prop({ required: false })
  previousValue: string;

  @Prop({ required: true })
  updatedValue: string;

  updatedBy: {
    id: { type: String },
    name: { type: String }
  }
}

export const PriorityHistorySchema = SchemaFactory.createForClass(PriorityHistory);
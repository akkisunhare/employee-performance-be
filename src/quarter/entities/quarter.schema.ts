// src/quarters/schemas/quarter.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuarterDocument = Quarter & Document;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt
export class Quarter {
  @Prop({ required: true })
  year: string;

  @Prop({ required: true, enum: ['q1', 'q2', 'q3', 'q4'] })
  quarter: string;

  @Prop({ required: true })
  start_date: string;

  @Prop({ required: true })
  end_date: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
    organizationId: Types.ObjectId;

  @Prop({ type: Object, required: false })
  createdBy: { id: string; name: string };

  @Prop({ type: Object, required: false })
  lastUpdatedBy?: { id: string; name: string };

  // createdAt and updatedAt will be auto-handled by timestamps: true
}

export const QuarterSchema = SchemaFactory.createForClass(Quarter);

QuarterSchema.index({ quarter: 1, year: 1, organizationId: 1 }, { unique: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({
  timestamps: true,
})
export class Organization {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: true })
  isActive: boolean;

 @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy: Types.ObjectId; 
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

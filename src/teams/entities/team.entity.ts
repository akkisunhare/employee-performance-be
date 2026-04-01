import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/entities/user.entity';

@Schema({ timestamps: true })
export class Team extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: { id: String, name: String }, required: true })
  owner: {
    id: string;
    name: string;
  };

  @Prop({ type: [String], ref: User.name, default: [] })
  memberIds: string[];

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  lastUpdatedBy?: Types.ObjectId;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class OrganizationRole {
  @Prop({ required: true, type: Types.ObjectId })
  organizationId: Types.ObjectId;

  @Prop({ required: true, default: 'user' })
  role: string;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  password?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  department?: string;

  @Prop({ required: false })
  role?: string;

  @Prop({ required: false })
  designation?: string;

  @Prop({ required: false })
  avatar: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Organization' }],
    required: false,
  })
  organizationIds: Types.ObjectId[];
  
  @Prop({ type: [Object], default: [] })
  organizationRoles: OrganizationRole[];

  @Prop({ default: false })
  isAdminEdit: boolean;

  @Prop({ default: false })
  isUserEdit: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

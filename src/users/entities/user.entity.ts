import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  OTP = 'otp',
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

@Schema({ _id: false })
export class OrganizationRole {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ required: true, enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  // ✅ Optional (Google/OTP compatibility)
  @Prop({ required: false, unique: true, sparse: true })
  email?: string;

  @Prop({ required: false })
  password?: string;

  // ✅ Optional + indexed
  @Prop({ required: false, unique: true, sparse: true })
  phone?: string;

  @Prop({ required: false })
  department?: string;

  // ✅ Global role (optional if using org roles)
  @Prop({ enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Prop({ required: false })
  designation?: string;

  @Prop({ required: false })
  avatar?: string;

  // ✅ Multi-tenant support
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Organization' }],
    default: [],
  })
  organizationIds: Types.ObjectId[];

  // ✅ Strong typed organization roles
  @Prop({ type: [OrganizationRole], default: [] })
  organizationRoles: OrganizationRole[];

  // 🔥 AUTH FIELDS

  @Prop({ enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @Prop({ required: false, index: true })
  googleId?: string;

  @Prop({ required: false, index: true })
  firebaseUid?: string;

  // 🔔 Push notification token
  @Prop({ required: false })
  fcmToken?: string;

  // ✅ Account state
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  // 🕒 Tracking
  @Prop()
  lastLoginAt?: Date;

  // 🛠 Existing flags (keep if needed)
  @Prop({ default: false })
  isAdminEdit: boolean;

  @Prop({ default: false })
  isUserEdit: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

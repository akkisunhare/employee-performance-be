import {
  IsString,
  IsNotEmpty,
  IsEmail,
  Matches,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  ORGANIZATION_OWNER = 'organization_owner',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  OTP = 'otp',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // ✅ Optional (Google login may provide OR OTP may not)
  @IsEmail()
  @IsOptional()
  email?: string;

  // ✅ Optional (Google login users may not have phone)
  @IsString()
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in international format (e.g., +15551234567)',
  })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  // ✅ Strict role control
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  avatar?: string;

  // ✅ Multi-tenant support
  @IsArray()
  @IsOptional()
  organizationIds?: string[];

  // 🔥 NEW FIELDS (IMPORTANT)

  // Which login method user used
  @IsEnum(AuthProvider)
  @IsOptional()
  provider?: AuthProvider;

  // Google user ID
  @IsString()
  @IsOptional()
  googleId?: string;

  // Firebase UID (for OTP)
  @IsString()
  @IsOptional()
  firebaseUid?: string;

  // Push notification token
  @IsString()
  @IsOptional()
  fcmToken?: string;
}

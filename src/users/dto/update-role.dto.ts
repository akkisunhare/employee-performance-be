import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from './create-user.dto';

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  // @IsEnum(UserRole)
  role: UserRole;
}

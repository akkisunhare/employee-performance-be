import { IsString, IsNotEmpty, IsArray, IsObject, ValidateNested, ArrayMinSize, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class TeamOwnerDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @ValidateNested()
  @Type(() => TeamOwnerDto)
  owner: TeamOwnerDto;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  memberIds: string[];

  @IsOptional()
  createdBy?: Types.ObjectId;

  @IsString()
  @IsOptional()
  organizationId?: string;
}

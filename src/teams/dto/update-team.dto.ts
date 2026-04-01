import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateTeamDto } from './create-team.dto';
import { Types } from 'mongoose';

export class UpdateTeamDto extends PartialType(
  OmitType(CreateTeamDto, ['organizationId', 'createdBy'] as const)
) {
  @IsOptional()
  lastUpdatedBy?: Types.ObjectId;;
}

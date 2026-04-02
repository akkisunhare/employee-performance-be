import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WeekInterval } from './priority.types';

class WeeklyStatusDto {
  @IsString()
  @IsNotEmpty()
  updateStartWeek: string;

  @IsString()
  @IsNotEmpty()
  updateEndWeek: string;

  @IsEnum([
    'Not yet started',
    'On track',
    'Behind schedule',
    'Complete',
    'Not applicable',
  ])
  @IsNotEmpty()
  updateStatus: string;

  @IsString()
  @IsOptional()
  updateDescription?: string;
}

class WeekStatusDataDto {
  @IsString()
  @IsNotEmpty()
  week: string;

  @IsEnum([
    'Not yet started',
    'On track',
    'Behind schedule',
    'Complete',
    'Not applicable',
    'Not able to store',
  ])
  @IsNotEmpty()
  status: string;
}

export class CreatePriorityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  owner: string;

  @IsString()
  @IsOptional()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  team: string;

  @IsString()
  @IsNotEmpty()
  quarter: string;

  @IsString()
  description: string;

  @IsEnum(['individual', 'team', 'company'])
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  startWeek: WeekInterval;

  @IsNotEmpty()
  endWeek: WeekInterval;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyStatusDto)
  @IsOptional()
  weeklyStatus?: WeeklyStatusDto[];

  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeekStatusDataDto)
  @IsOptional()
  weekStatusdata?: WeekStatusDataDto[];
}

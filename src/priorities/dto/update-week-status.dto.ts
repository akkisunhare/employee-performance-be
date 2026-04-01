import { IsArray, IsIn, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PriorityStatus } from './priority.types';

const validStatuses = [
  'Not yet started',
  'On track',
  'Behind schedule',
  'Complete',
  'Not applicable',
  'Not able to store'
];

class WeekStatusUpdateDto {
  @IsNotEmpty()
  intervalIndex: number;

 @IsString()
  @IsIn(validStatuses, { message: `Status must be one of: ${validStatuses.join(', ')}` })
  status: PriorityStatus;

  @IsString()
  description?: string;
}

export class UpdateWeekStatusDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeekStatusUpdateDto)
  weekStatusUpdates: WeekStatusUpdateDto[];
}
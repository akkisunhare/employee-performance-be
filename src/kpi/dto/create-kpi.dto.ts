import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, isString, IsString, ValidateNested } from 'class-validator';

export class OptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Option id is required and cannot be empty' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: 'Option name is required and cannot be empty' })
  name: string;
}

export class CreateKpiDto {
  @IsNotEmpty({ message: 'KPI name is required and cannot be empty' })
  @IsString({ message: 'KPI name must be a string' })
  name: string;

  @IsString()
  userId:string

@IsString()
userName:string

  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty({ message: 'Owner is required' })
  @ValidateNested()
  @Type(() => OptionDto)
  ownerId: OptionDto;

  @IsEnum(['number', 'percentage'], { message: 'Measurement unit must be either "number" or "percentage"' })
  measurementUnit: 'number' | 'percentage';

  @IsString({ message: 'Target value must be a string' })
  @IsNotEmpty({ message: 'Target value is required' })
  targetValue: string;

  @IsString({ message: 'Remaining contribution must be a string' })
  @IsOptional()
  remainingContribution: string;

  @IsString({ message: 'Current value must be a string' })
  @IsOptional()
  currentValue?: string;

  @IsEnum(['standalone', 'cumulative'], { message: 'Division type must be either "standalone" or "cumulative"' })
  divisionType: 'standalone' | 'cumulative';

  @IsString({ message: 'Quarter must be a string' })
  @IsNotEmpty({ message: 'Quarter is required' }) 
  quarter?: string;

  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly'], { message: 'Frequency must be one of "daily", "weekly", "monthly", or "quarterly"' })
  @IsOptional()
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';

  @IsString({ message: 'Parent KPI ID must be a string' })
  @IsOptional()
  parentKpiId?: string;

  @IsNotEmpty({ message: 'KPI type is required' })
  @IsEnum(['individual', 'team', 'company'], { message: 'KPI type must be "individual", "team", or "company"' })
  kpiType: 'individual' | 'team' | 'company';

  @IsString({ message: 'Organization ID must be a string' })
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId: string;
}

export class CreateTeamKpiDto extends CreateKpiDto {
  @IsString({ message: 'Team ID must be a string' })
  @IsNotEmpty({ message: 'Team ID is required' })
  teamId: string;

  @IsArray({ message: 'Assignee IDs must be an array' })
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  @IsNotEmpty({ message: 'Assignee IDs are required' })
  assigneeIds: OptionDto[]

}

export class CreateCompanyKpiDto extends CreateKpiDto {
  @IsArray({ message: 'Team IDs must be an array' })
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  @IsOptional()
  teamIds?: OptionDto[];
}

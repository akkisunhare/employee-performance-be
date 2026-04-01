import { IsOptional, IsString, IsInt, Min, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SortByDto {
  @IsString()
  field: string;

  @IsString()
  order: 'asc' | 'desc';
}

export class PrioDto {
  @IsOptional()
  @IsString()
  prioType?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  additionalDetails?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SortByDto)
  sortBy?: SortByDto;
}

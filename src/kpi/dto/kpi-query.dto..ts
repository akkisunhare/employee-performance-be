// kpi-query.dto.ts
import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class KpiQueryDto {
  @IsOptional()
  @IsString()
  kpiType?: string;

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
  @Transform(({ value }) => value === undefined ? true : value === 'true')
  additionalDetails?: boolean;
 @IsOptional()
   search?: string;
   
  filters?: Record<string, any>;
   sortBy?: {
  field: string;
  order: 'asc' | 'desc';
};
}

import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class myDashboardDto {
  @IsOptional()
  @IsString()
  dataType?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  dashboardType?: string;
}
export class myDashboardTeamDto {
  @IsString()
  memberId?: any;
  
  @IsString()
  type?: string;
}

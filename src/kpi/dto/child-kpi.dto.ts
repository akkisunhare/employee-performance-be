import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class ChildKpiDto {
    @IsString()
    @IsNotEmpty({ message: 'Child KPI ID is required' })
    id: string;

    @IsString()
    @IsNotEmpty({ message: 'Child KPI name is required' })
    name: string;

    @IsOptional()
    @IsString()
    description?: string; // Optional description for child KPI
}

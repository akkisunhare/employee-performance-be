import { PartialType } from '@nestjs/mapped-types';
import { CreateKpiDto, OptionDto } from './create-kpi.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChildKpiDto } from './child-kpi.dto';

export class UpdateKpiDto extends PartialType(CreateKpiDto) {
    @IsArray({ message: 'Child KPIs must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ChildKpiDto) 
    @IsOptional() // childKpis should be optional in update
    childKpis?: ChildKpiDto[]; // This is specific to UpdateKpiDto only


    @IsArray({ message: 'Assignee IDs must be an array' })
    @ValidateNested({ each: true })
    @Type(() => OptionDto)
    @IsOptional() // assigneeIds should be optional for updates
    assigneeIds?: OptionDto[];
  
}

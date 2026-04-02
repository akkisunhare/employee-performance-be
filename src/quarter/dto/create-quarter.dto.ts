import {
  IsEnum,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsString,
  isString,
  IsISO8601,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class UserInfo {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  name: string;
}

export class CreateQuarterDto {
  @IsNumber()
  year: number;

  @IsEnum(['q1', 'q2', 'q3', 'q4'])
  quarter: 'q1' | 'q2' | 'q3' | 'q4';

  @IsISO8601()
  start_date: string;

  @IsISO8601()
  end_date: string;

  @IsString({ message: 'Organization ID must be a string' })
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserInfo)
  createdBy?: UserInfo;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserInfo)
  lastUpdatedBy?: UserInfo;

  userId: string;
  userName: string;
}
@Schema()
export class Quarter extends Document {
  // @Prop({ required: true })
  _id: any;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

  @Prop({ type: Date, required: true })
  start_date: Date;

  @Prop({ type: Date, required: true })
  end_date: string;
}
export class CreateQuarterDtoNew {
  @IsOptional()
  _id: any;

  @IsIn(['Q1', 'Q2', 'Q3', 'Q4'])
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

  @IsNumber()
  year: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
export const QuarterSchema = SchemaFactory.createForClass(Quarter);

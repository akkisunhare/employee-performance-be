import {  IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Types } from "mongoose";

export class UpdateIntervalBreakdownDto {

    @IsNotEmpty({message:'Interval Index is required'})
    @IsInt()
    intervalIndex: number

    @IsNotEmpty({message: 'Current Value is required'})
    @IsNumber()
    currentValue:number

    user?: {                     // Optional user info who is updating
        id: string | Types.ObjectId;
        name?: string;
      };
    @IsBoolean()
    isUpdated?: boolean;

    @IsOptional()
    @IsString()
    // notes: { type: String, default: "" }
    notes: string

}
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class sendEmailDto {
  @IsEmail({}, { each: true })
  recipients: any[];

  @IsString()
  subject: string;

  @IsString()
  @IsOptional()
  data: string;

  @IsOptional()
  @IsString()
  text?: string;
}

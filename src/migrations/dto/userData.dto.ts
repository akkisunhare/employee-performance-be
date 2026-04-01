import {
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class UserDataDto {
  @IsString()
  @IsNotEmpty()
  oldId: string;

  @IsString()
  @IsNotEmpty()
  newId: string;

  @IsString()
  @IsNotEmpty()
  moduleName: string;
}

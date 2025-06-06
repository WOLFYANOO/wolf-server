import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleEnum } from 'src/types/enums/user.enum';

export default class CreateWorkerDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(15)
  user_name: string;
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  password: string;
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  @IsOptional()
  role: RoleEnum;
}

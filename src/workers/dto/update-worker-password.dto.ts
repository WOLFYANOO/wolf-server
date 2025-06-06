import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateWorkerPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  password: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  new_password: string;
}

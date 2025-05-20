import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;
  @IsString()
  @MinLength(9, { message: 'Invalid password.' })
  @MaxLength(24, { message: 'Invalid password.' })
  password: string;
}

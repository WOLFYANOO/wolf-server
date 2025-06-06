import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;
  @IsString()
  @IsOptional()
  tax_num: string;
}

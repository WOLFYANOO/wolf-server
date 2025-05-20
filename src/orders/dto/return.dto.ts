import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ReturnDto {
  @IsNumber()
  @IsNotEmpty()
  qty: number;
  @IsString()
  @IsOptional()
  reason: string;
}

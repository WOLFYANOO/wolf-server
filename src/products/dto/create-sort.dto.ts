import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSortDto {
  @IsString()
  @IsNotEmpty()
  size: string;
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  color: string;
  @IsNumber()
  qty: number;
  @IsNumber()
  price: number;
  @IsNumber()
  costPrice: number;
  @IsOptional()
  @IsString()
  note?: string;
}

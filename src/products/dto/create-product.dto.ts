import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsNotEmpty()
  @IsString()
  material: string;

  @IsString()
  @IsOptional()
  note?: string;
}

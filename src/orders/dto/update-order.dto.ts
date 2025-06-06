import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
} from 'class-validator';
import {
  PaidStatusEnum,
  PaymentMethodsEnum,
} from 'src/types/enums/product.enum';
class CreateOrderDto {
  @IsNotEmpty()
  @IsEnum(PaymentMethodsEnum)
  payment_method: PaymentMethodsEnum;
  @IsNotEmpty()
  @IsEnum(PaidStatusEnum)
  paid_status: PaidStatusEnum;
  @IsNumberString()
  tax: string;
  @IsNumber()
  @IsOptional()
  discount: number;
}
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}

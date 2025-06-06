import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator';
import {
  PaidStatusEnum,
  PaymentMethodsEnum,
} from 'src/types/enums/product.enum';
import { IsValidProductSorts } from 'src/vaildator/json.vaildator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  client_id: string;
  @IsNotEmpty()
  @IsString()
  @Validate(IsValidProductSorts)
  product_sorts: string;
  @IsNotEmpty()
  @IsEnum(PaymentMethodsEnum)
  payment_method: PaymentMethodsEnum;
  @IsNotEmpty()
  @IsEnum(PaidStatusEnum)
  paid_status: PaidStatusEnum;
  @IsOptional()
  @IsNumberString()
  tax: string;
  @IsNumber()
  @IsOptional()
  discount: number;
}

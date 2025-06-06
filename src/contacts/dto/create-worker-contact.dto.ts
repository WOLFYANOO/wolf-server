import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateWorkerContactDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
  @IsOptional()
  @IsString()
  note: string;
}

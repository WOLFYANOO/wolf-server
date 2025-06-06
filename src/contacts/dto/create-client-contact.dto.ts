import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateClientContactDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
  @IsOptional()
  @IsString()
  note: string;
}

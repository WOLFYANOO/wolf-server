import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsPhoneNumber, IsString } from 'class-validator';
class CreateContactDto {
  @IsPhoneNumber()
  phone: string;
  @IsString()
  note: string;
  @IsBoolean()
  is_main: boolean;
}
export class UpdateContactDto extends PartialType(CreateContactDto) {}

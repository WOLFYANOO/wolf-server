import { IsString, IsEnum, IsOptional } from 'class-validator';
import { GovernoratesEnums } from 'src/types/enums/user.enum';

export class CreateAddressDto {
  @IsString()
  client_name: string;
  @IsEnum(GovernoratesEnums)
  governorate: GovernoratesEnums;

  @IsString()
  city: string;

  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  more_info?: string;

  @IsString()
  address_for: string;
}

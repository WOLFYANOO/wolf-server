import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { IsValidReturns } from 'src/vaildator/returns-json.vaildator';

export class ReturnDto {
  @IsNotEmpty()
  @Validate(IsValidReturns)
  returns: string;
}

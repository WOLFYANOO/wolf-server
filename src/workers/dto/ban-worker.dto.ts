import { IsNotEmpty, IsString } from 'class-validator';

export class BanWorkerDto {
  @IsNotEmpty()
  @IsString()
  banned_reason: string;
}

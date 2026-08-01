import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BanUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;
}

import { IsOptional, IsString } from 'class-validator';

export class MarkSoldDto {
  @IsOptional()
  @IsString()
  soldToUserId?: string;
}

import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ListingCondition, ListingType } from '@prisma/client';
import { UpsertBookDto } from '../../catalog/dto/upsert-book.dto';

export class CreateListingDto {
  @ValidateNested()
  @Type(() => UpsertBookDto)
  book: UpsertBookDto;

  @IsEnum(ListingType)
  type: ListingType;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsEnum(ListingCondition)
  condition: ListingCondition;

  @IsString()
  @MaxLength(120)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

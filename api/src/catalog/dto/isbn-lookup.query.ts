import { IsString, MinLength } from 'class-validator';

export class IsbnLookupQuery {
  @IsString()
  @MinLength(9)
  isbn: string;
}

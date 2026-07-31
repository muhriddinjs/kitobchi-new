import { Controller, Get, Param, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { IsbnLookupQuery } from './dto/isbn-lookup.query';

@Controller({ path: 'books', version: '1' })
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('lookup')
  lookup(@Query() query: IsbnLookupQuery) {
    return this.booksService.lookupByIsbn(query.isbn);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.booksService.getWithListings(id);
  }
}

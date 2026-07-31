import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  controllers: [CategoriesController, BooksController],
  providers: [CategoriesService, BooksService],
  exports: [BooksService, CategoriesService],
})
export class CatalogModule {}

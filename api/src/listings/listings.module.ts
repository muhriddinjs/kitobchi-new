import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { StorageModule } from '../storage/storage.module';
import { ReportsModule } from '../reports/reports.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [CatalogModule, StorageModule, ReportsModule],
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}

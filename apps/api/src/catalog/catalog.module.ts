import { Module } from '@nestjs/common';
import { AdminCatalogController, PublicCatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [PublicCatalogController, AdminCatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}

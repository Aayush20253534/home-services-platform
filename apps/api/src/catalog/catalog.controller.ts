import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public, Roles } from '../auth/auth.decorators';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class PublicCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('categories')
  categories() { return this.catalog.categories(true); }

  @Public()
  @Get('services')
  services(@Query() query: { category?: string; search?: string; limit?: string }) {
    return this.catalog.services(true, query);
  }

  @Public()
  @Get('services/:slug')
  service(@Param('slug') slug: string) { return this.catalog.publicService(slug); }
}

@Controller('admin/catalog')
@Roles('ADMIN')
export class AdminCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories() { return this.catalog.categories(false); }

  @Get('services')
  services(@Query() query: { category?: string; search?: string; limit?: string }) {
    return this.catalog.services(false, query);
  }

  @Post('categories')
  createCategory(@Body() body: unknown) { return this.catalog.createCategory(body); }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: unknown) {
    return this.catalog.updateCategory(id, body);
  }

  @Post('services')
  createService(@Body() body: unknown) { return this.catalog.createService(body); }

  @Patch('services/:id')
  updateService(@Param('id') id: string, @Body() body: unknown) {
    return this.catalog.updateService(id, body);
  }
}

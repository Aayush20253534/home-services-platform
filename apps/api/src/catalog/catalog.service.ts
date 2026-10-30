import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@home-services/database';
import { DatabaseService } from '../database/database.service';
import { pageLimit, parseCategory, parseService, searchTerm, uuid } from './catalog.validation';

const selectCategory = { id: true, slug: true, name: true, sortOrder: true, isActive: true } as const;
const selectService = {
  id: true, slug: true, name: true, description: true, pricingType: true,
  basePricePaise: true, durationMinutes: true, isActive: true,
  categoryId: true, category: { select: selectCategory },
} as const;

function handleWrite(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') throw new ConflictException('A record with that slug already exists');
    if (error.code === 'P2025') throw new NotFoundException('Record not found');
    if (error.code === 'P2003') throw new BadRequestException('Referenced category does not exist');
  }
  throw error;
}

@Injectable()
export class CatalogService {
  constructor(private readonly db: DatabaseService) {}

  categories(publicOnly: boolean) {
    return this.db.serviceCategory.findMany({
      where: publicOnly ? { isActive: true } : {},
      select: { ...selectCategory, _count: { select: { services: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  services(publicOnly: boolean, query: { category?: unknown; search?: unknown; limit?: unknown }) {
    const category = query.category ? String(query.category) : undefined;
    if (category && (category.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category))) {
      throw new BadRequestException('Invalid category slug');
    }
    const search = searchTerm(query.search);
    return this.db.service.findMany({
      where: {
        ...(publicOnly ? { isActive: true, category: { isActive: true } } : {}),
        ...(category ? { category: { slug: category, ...(publicOnly ? { isActive: true } : {}) } } : {}),
        ...(search ? { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ] } : {}),
      },
      select: selectService,
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
      take: pageLimit(query.limit),
    });
  }

  async publicService(slug: string) {
    const service = await this.db.service.findUnique({
      where: { slug },
      select: selectService,
    });
    if (!service || !service.isActive || !service.category.isActive) throw new NotFoundException('Service not found');
    return service;
  }

  async createCategory(value: unknown) {
    const input = parseCategory(value);
    try {
      return await this.db.serviceCategory.create({
        data: { name: input.name!, slug: input.slug!, sortOrder: input.sortOrder ?? 0, isActive: input.isActive ?? true },
        select: selectCategory,
      });
    } catch (error) { return handleWrite(error); }
  }

  async updateCategory(id: string, value: unknown) {
    const input = parseCategory(value, true);
    try {
      return await this.db.serviceCategory.update({ where: { id: uuid(id) }, data: input, select: selectCategory });
    } catch (error) { return handleWrite(error); }
  }

  private async categoryCanServe(categoryId: string, active: boolean) {
    const category = await this.db.serviceCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new BadRequestException('Category does not exist');
    if (active && !category.isActive) throw new BadRequestException('Activate the category before publishing services');
  }

  async createService(value: unknown) {
    const input = parseService(value);
    await this.categoryCanServe(input.categoryId!, input.isActive ?? true);
    try {
      return await this.db.service.create({
        data: {
          name: input.name!, slug: input.slug!, categoryId: input.categoryId!,
          pricingType: input.pricingType!, basePricePaise: input.basePricePaise!,
          durationMinutes: input.durationMinutes!, description: input.description ?? null,
          isActive: input.isActive ?? true,
        },
        select: selectService,
      });
    } catch (error) { return handleWrite(error); }
  }

  async updateService(id: string, value: unknown) {
    const input = parseService(value, true);
    const serviceId = uuid(id);
    const previous = await this.db.service.findUnique({ where: { id: serviceId } });
    if (!previous) throw new NotFoundException('Service not found');
    await this.categoryCanServe(input.categoryId ?? previous.categoryId, input.isActive ?? previous.isActive);
    try {
      return await this.db.service.update({ where: { id: serviceId }, data: input, select: selectService });
    } catch (error) { return handleWrite(error); }
  }
}

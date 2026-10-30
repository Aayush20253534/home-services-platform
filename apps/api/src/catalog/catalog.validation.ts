import { BadRequestException } from '@nestjs/common';

export type CategoryInput = { name: string; slug?: string; sortOrder?: number; isActive?: boolean };
export type ServiceInput = {
  name: string; slug?: string; categoryId: string; description?: string | null;
  pricingType: 'FIXED' | 'INSPECTION'; basePricePaise: number;
  durationMinutes: number; isActive?: boolean;
};

type ObjectValue = Record<string, unknown>;
const categoryCreate = ['name', 'slug', 'sortOrder', 'isActive'] as const;
const categoryUpdate = ['name', 'sortOrder', 'isActive'] as const;
const serviceCreate = ['name', 'slug', 'categoryId', 'description', 'pricingType', 'basePricePaise', 'durationMinutes', 'isActive'] as const;
const serviceUpdate = ['name', 'categoryId', 'description', 'pricingType', 'basePricePaise', 'durationMinutes', 'isActive'] as const;

function object(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Expected an object');
  return value as ObjectValue;
}
function knownKeys(value: ObjectValue, keys: readonly string[]) {
  if (!Object.keys(value).every((key) => keys.includes(key))) throw new BadRequestException('Unexpected field in request');
}
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new BadRequestException(`${field} must contain 1–${max} characters`);
  }
  return value.trim();
}
function bool(value: unknown, key: string): boolean {
  if (typeof value !== 'boolean') throw new BadRequestException(`${key} must be boolean`);
  return value;
}
function integer(value: unknown, key: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    throw new BadRequestException(`${key} must be an integer between ${min} and ${max}`);
  }
  return value as number;
}
export function slugFromName(value: string): string {
  return value.normalize('NFKD').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}
function slug(value: unknown, name: string): string {
  const result = value === undefined ? slugFromName(name) : text(value, 'slug', 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) {
    throw new BadRequestException('Use lowercase letters, numbers and hyphens in the slug');
  }
  return result;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new BadRequestException('Invalid resource ID');
  }
  return value;
}

export function parseCategory(value: unknown, partial = false): Partial<CategoryInput> {
  const raw = object(value);
  knownKeys(raw, partial ? categoryUpdate : categoryCreate);
  if (partial && !Object.keys(raw).length) throw new BadRequestException('No changes submitted');
  const result: Partial<CategoryInput> = {};
  if (!partial || raw.name !== undefined) result.name = text(raw.name, 'name', 120);
  if (!partial) result.slug = slug(raw.slug, result.name!);
  if (raw.sortOrder !== undefined) result.sortOrder = integer(raw.sortOrder, 'sortOrder', 0, 10000);
  if (raw.isActive !== undefined) result.isActive = bool(raw.isActive, 'isActive');
  return result;
}
export function parseService(value: unknown, partial = false): Partial<ServiceInput> {
  const raw = object(value);
  knownKeys(raw, partial ? serviceUpdate : serviceCreate);
  if (partial && !Object.keys(raw).length) throw new BadRequestException('No changes submitted');
  const result: Partial<ServiceInput> = {};
  if (!partial || raw.name !== undefined) result.name = text(raw.name, 'name', 160);
  if (!partial) result.slug = slug(raw.slug, result.name!);
  if (!partial || raw.categoryId !== undefined) result.categoryId = uuid(raw.categoryId);
  if (raw.description !== undefined) {
    if (raw.description === null) result.description = null;
    else if (typeof raw.description === 'string' && raw.description.length <= 2000) result.description = raw.description.trim() || null;
    else throw new BadRequestException('description must be 2000 characters or fewer');
  }
  if (!partial || raw.pricingType !== undefined) {
    if (raw.pricingType !== 'FIXED' && raw.pricingType !== 'INSPECTION') throw new BadRequestException('Invalid pricingType');
    result.pricingType = raw.pricingType;
  }
  if (!partial || raw.basePricePaise !== undefined) result.basePricePaise = integer(raw.basePricePaise, 'basePricePaise', 0, 100000000);
  if (!partial || raw.durationMinutes !== undefined) result.durationMinutes = integer(raw.durationMinutes, 'durationMinutes', 1, 1440);
  if (raw.isActive !== undefined) result.isActive = bool(raw.isActive, 'isActive');
  return result;
}

export function pageLimit(value: unknown): number {
  if (value === undefined) return 100;
  if (typeof value !== 'string' || !/^\d{1,3}$/.test(value)) throw new BadRequestException('Invalid limit');
  return integer(Number(value), 'limit', 1, 100);
}
export function searchTerm(value: unknown): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 100) throw new BadRequestException('Search must be 100 characters or fewer');
  return value.trim() || undefined;
}

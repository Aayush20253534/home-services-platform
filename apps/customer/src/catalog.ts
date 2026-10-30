import type { IconName } from '@home-services/mobile-ui';

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  icon: IconName;
  tint: string;
};

export type CatalogService = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  icon: IconName;
  tint: string;
  basePricePaise: number;
  durationMinutes: number;
  pricingType: 'FIXED' | 'INSPECTION';
};

type ApiCategory = { id: string; slug: string; name: string; isActive: boolean };
type ApiService = {
  id: string; slug: string; name: string; description: string | null;
  basePricePaise: number; durationMinutes: number; pricingType: 'FIXED' | 'INSPECTION';
  categoryId: string; category: { id: string; slug: string; name: string };
};

const categoryAppearance: Record<string, { icon: IconName; tint: string }> = {
  cleaning: { icon: 'sparkles-outline', tint: '#E0F6ED' },
  electrical: { icon: 'flash-outline', tint: '#FFF2D8' },
  plumbing: { icon: 'water-outline', tint: '#E6F0FF' },
  'ac-repair': { icon: 'snow-outline', tint: '#EEE9FF' },
  appliances: { icon: 'construct-outline', tint: '#FDECE8' },
  painting: { icon: 'color-palette-outline', tint: '#E7F0FF' },
};
const fallback = { icon: 'grid-outline' as IconName, tint: '#EBEFFB' };
const formatMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export function priceLabel(paise: number): string {
  return formatMoney.format(paise / 100);
}

export function mapCategory(raw: ApiCategory): CatalogCategory {
  const style = categoryAppearance[raw.slug] ?? fallback;
  return { id: raw.id, slug: raw.slug, name: raw.name, ...style };
}

export function mapService(raw: ApiService): CatalogService {
  const style = categoryAppearance[raw.category.slug] ?? fallback;
  return {
    id: raw.id, slug: raw.slug, name: raw.name,
    description: raw.description || 'Professional home service assessment',
    categoryId: raw.categoryId, categoryName: raw.category.name,
    basePricePaise: raw.basePricePaise, durationMinutes: raw.durationMinutes,
    pricingType: raw.pricingType, ...style,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
}
function validText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function validCategory(value: unknown): value is ApiCategory {
  return isRecord(value) && validId(value.id) && validText(value.slug) &&
    validText(value.name) && value.isActive === true;
}
function validService(value: unknown): value is ApiService {
  if (!isRecord(value) || !isRecord(value.category)) return false;
  return validId(value.id) && validId(value.categoryId) && validId(value.category.id) &&
    value.categoryId === value.category.id && validText(value.slug) && validText(value.name) &&
    validText(value.category.slug) && validText(value.category.name) &&
    (value.description === null || typeof value.description === 'string') &&
    Number.isSafeInteger(value.basePricePaise) && (value.basePricePaise as number) >= 0 &&
    Number.isSafeInteger(value.durationMinutes) && (value.durationMinutes as number) > 0 &&
    (value.pricingType === 'FIXED' || value.pricingType === 'INSPECTION');
}

export function parseCatalog(categories: unknown, services: unknown): {
  categories: CatalogCategory[];
  services: CatalogService[];
} {
  if (!Array.isArray(categories) || !Array.isArray(services) ||
      !categories.every(validCategory) || !services.every(validService)) {
    throw new Error('The service catalog response is invalid');
  }
  const activeIds = new Set(categories.map((category: ApiCategory) => category.id));
  return {
    categories: categories.map(mapCategory),
    services: services.filter((service: ApiService) => activeIds.has(service.categoryId)).map(mapService),
  };
}

export type SortMode = 'name' | 'price-low' | 'price-high';
export function filterServices(
  services: readonly CatalogService[],
  query: string,
  categoryId: string | null,
  sort: SortMode,
  favoritesOnly: boolean,
  favorites: readonly string[],
): CatalogService[] {
  const term = query.trim().toLocaleLowerCase();
  const saved = new Set(favorites);
  const matching = services.filter((item) =>
    (!categoryId || item.categoryId === categoryId) &&
    (!favoritesOnly || saved.has(item.id)) &&
    (!term || [item.name, item.categoryName, item.description].some((part) => part.toLowerCase().includes(term))),
  );
  return matching.sort((a, b) => {
    if (sort === 'price-low') return a.basePricePaise - b.basePricePaise || a.name.localeCompare(b.name);
    if (sort === 'price-high') return b.basePricePaise - a.basePricePaise || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}

export async function fetchCatalog(apiBase: string | undefined, signal?: AbortSignal) {
  if (!apiBase) throw new Error('Configure EXPO_PUBLIC_API_URL to load the catalog');
  const base = apiBase.replace(/\/$/, '');
  const [categoriesResponse, servicesResponse] = await Promise.all([
    fetch(`${base}/catalog/categories`, { signal }),
    fetch(`${base}/catalog/services?limit=100`, { signal }),
  ]);
  if (!categoriesResponse.ok || !servicesResponse.ok) throw new Error('Service catalog unavailable');
  return parseCatalog(await categoriesResponse.json() as unknown, await servicesResponse.json() as unknown);
}

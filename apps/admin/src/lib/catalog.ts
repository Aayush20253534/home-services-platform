export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { services: number };
};
export type CatalogService = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  category: CatalogCategory;
  pricingType: 'FIXED' | 'INSPECTION';
  basePricePaise: number;
  durationMinutes: number;
  isActive: boolean;
};

export function toSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}
export function formatRupees(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);
}
export function rupeesToPaise(value: string): number | null {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const amount = Number(whole) * 100 + Number((fraction + '00').slice(0, 2));
  return Number.isSafeInteger(amount) && amount <= 100000000 ? amount : null;
}

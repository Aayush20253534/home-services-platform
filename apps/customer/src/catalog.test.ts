import assert from 'node:assert/strict';
import test from 'node:test';
import { filterServices, mapCategory, mapService, parseCatalog, priceLabel } from './catalog';

const category = { id: '550e8400-e29b-41d4-a716-446655440000', slug: 'cleaning', name: 'Cleaning', isActive: true };
const service = { id: '550e8400-e29b-41d4-a716-446655440001', slug: 'bathroom', name: 'Bathroom cleaning', description: 'Clean fixtures', categoryId: category.id, category: { id: category.id, slug: category.slug, name: category.name }, basePricePaise: 79900, durationMinutes: 90, pricingType: 'FIXED' as const };
test('catalog converts API records without inventing prices', () => {
  const result = parseCatalog([category], [service]);
  assert.equal(result.services[0].basePricePaise, 79900);
  assert.equal(result.categories[0].name, 'Cleaning');
  assert.equal(priceLabel(10050).includes('100.5'), true);
  assert.equal(mapCategory(category).icon, 'sparkles-outline');
  assert.equal(mapService(service).durationMinutes, 90);
});
test('invalid catalog is rejected rather than silently replaced', () => {
  assert.throws(() => parseCatalog([category], [{ ...service, basePricePaise: 'free' }]));
  assert.throws(() => parseCatalog({}, []));
  assert.equal(parseCatalog([category], []).services.length, 0);
});
test('filtering, sorting and favorites behave deterministically', () => {
  const one = mapService(service);
  const two = { ...one, id: 'another', name: 'AC inspection', basePricePaise: 20000 };
  assert.equal(filterServices([one,two], '', null, 'price-low', false, [])[0].id, 'another');
  assert.equal(filterServices([one,two], 'clean fixtures', null, 'name', false, []).length, 2);
  assert.equal(filterServices([one,two], 'bathroom', null, 'name', false, []).length, 1);
  assert.equal(filterServices([one,two], '', null, 'name', true, [one.id]).length, 1);
});

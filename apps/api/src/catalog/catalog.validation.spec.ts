import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { parseCategory, parseService, slugFromName, pageLimit } from './catalog.validation';

test('canonical slugs and controlled category updates', () => {
  assert.equal(slugFromName('AC & Fan Repair!'), 'ac-fan-repair');
  const category = parseCategory({ name: 'AC Repair', sortOrder: 2 });
  assert.equal(category.slug, 'ac-repair');
  assert.throws(() => parseCategory({ name: 'Test', isAdmin: true }), BadRequestException);
  assert.throws(() => parseCategory({ slug: 'takeover' }, true), BadRequestException);
});

test('prices, duration and references are validated', () => {
  const good = {
    name: 'Fan repair', categoryId: '550e8400-e29b-41d4-a716-446655440000',
    pricingType: 'FIXED', basePricePaise: 24900, durationMinutes: 45,
  };
  assert.equal(parseService(good).basePricePaise, 24900);
  assert.throws(() => parseService({ ...good, basePricePaise: 200.5 }), BadRequestException);
  assert.throws(() => parseService({ ...good, durationMinutes: 0 }), BadRequestException);
  assert.throws(() => parseService({ ...good, categoryId: 'nope' }), BadRequestException);
  assert.throws(() => parseService({ ...good, isActive: 'yes' }), BadRequestException);
  assert.throws(() => parseService({ slug: 'changed' }, true), BadRequestException);
});

test('bounded query limits', () => {
  assert.equal(pageLimit(undefined), 100);
  assert.equal(pageLimit('20'), 20);
  assert.throws(() => pageLimit('2000'), BadRequestException);
});

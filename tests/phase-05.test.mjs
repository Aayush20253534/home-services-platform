import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

test('catalog endpoints, admin proxy and integration tests exist', () => {
  for (const path of [
    'apps/api/src/catalog/catalog.controller.ts',
    'apps/api/src/catalog/catalog.service.ts',
    'apps/api/src/catalog/catalog.validation.ts',
    'apps/admin/src/app/api/catalog/[...segments]/route.ts',
    'apps/api/scripts/catalog-smoke.ts',
    'docs/phases/05-catalog.md',
  ]) assert.ok(existsSync(path), path);
});
test('customer catalog has no hard-coded service database', () => {
  const app = readFileSync('apps/customer/App.tsx', 'utf8');
  const catalog = readFileSync('apps/customer/src/catalog.ts', 'utf8');
  assert.match(catalog, /fetch\(.*catalog\/categories/);
  assert.match(catalog, /catalog\/services/);
  assert.match(app, /fetchCatalog/);
  assert.doesNotMatch(app, /const services: Service\[\] = \[/);
});
test('seed does not overwrite admin catalog edits', () => {
  const seed = readFileSync('packages/database/prisma/seed.ts', 'utf8');
  assert.doesNotMatch(seed, /update: \{ \.\.\.service/);
});

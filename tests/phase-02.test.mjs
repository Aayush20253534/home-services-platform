import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(file, 'utf8');

test('Phase 02 includes shared design system and mobile library', () => {
  for (const file of [
    'packages/design-tokens/src/index.ts',
    'packages/design-tokens/styles/tokens.css',
    'packages/mobile-ui/src/index.tsx',
    'docs/phases/02-design-system.md',
  ]) assert.ok(existsSync(file), file);
});

test('all six admin pages are present and clearly labeled', () => {
  for (const path of ['page.tsx', 'bookings/page.tsx', 'providers/page.tsx', 'customers/page.tsx', 'services/page.tsx', 'settings/page.tsx']) {
    assert.ok(existsSync(`apps/admin/src/app/(protected)/${path}`), path);
  }
  assert.match(read('apps/admin/src/components/admin-shell.tsx'), /UI Demo/);
  assert.match(read('apps/admin/src/components/mock-data.ts'), /Fictional demonstration data/);
});

test('mobile previews are explicitly non-operational', () => {
  assert.match(read('apps/customer/App.tsx'), /No service provider will be notified/);
  assert.match(read('apps/provider/App.tsx'), /not connected to dispatch/);
  assert.match(read('apps/provider/App.tsx'), /disabled onPress/);
});

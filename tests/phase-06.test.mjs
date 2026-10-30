import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

test('customer experience is modular and retains authenticated entry', () => {
  for (const name of ['catalog.ts', 'booking.ts', 'catalog.test.ts', 'booking.test.ts']) {
    assert.ok(existsSync(`apps/customer/src/${name}`), name);
  }
  const app = readFileSync('apps/customer/App.tsx', 'utf8');
  assert.match(app, /MobileAuthGate role="CUSTOMER"/);
  assert.match(app, /useMobileAuth/);
  assert.match(app, /upcomingDays/);
  assert.match(app, /validateDraft/);
  assert.match(app, /BackHandler/);
  assert.match(app, /No service provider will be notified/);
});
test('user interface supports live discovery and explicitly local drafts', () => {
  const app = readFileSync('apps/customer/App.tsx', 'utf8');
  assert.match(app, /fetchCatalog/);
  assert.match(app, /filterServices/);
  assert.match(app, /setFavoritesOnly/);
  assert.match(app, /scrollKey/);
  assert.match(app, /onRefresh/);
  assert.match(app, /Drafts are not bookings/);
  assert.doesNotMatch(app, /POST \/bookings/);
});
test('shared app shell supports pull-to-refresh without changing provider requirements', () => {
  const ui = readFileSync('packages/mobile-ui/src/index.tsx', 'utf8');
  assert.match(ui, /onRefresh\?:/);
  assert.match(ui, /RefreshControl/);
});

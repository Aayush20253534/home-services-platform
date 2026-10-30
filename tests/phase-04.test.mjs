import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('Phase 04 auth server and migration are present', () => {
  for (const path of [
    'apps/api/src/auth/auth.service.ts',
    'apps/api/src/auth/auth.guards.ts',
    'apps/api/src/auth/auth.controller.ts',
    'packages/database/prisma/migrations/20261030000200_auth/migration.sql',
    'packages/database/prisma/provision-admin.ts',
    'docs/phases/04-authentication.md',
  ]) assert.ok(existsSync(path), path);
});

test('admin screens are nested under protected server layout', () => {
  assert.ok(existsSync('apps/admin/src/app/(protected)/layout.tsx'));
  assert.ok(existsSync('apps/admin/src/app/login/page.tsx'));
  const layout = readFileSync('apps/admin/src/app/(protected)/layout.tsx', 'utf8');
  assert.match(layout, /auth\/me/);
  assert.match(layout, /cookies/);
  for (const path of ['page.tsx','bookings/page.tsx','customers/page.tsx','providers/page.tsx','services/page.tsx','settings/page.tsx']) {
    assert.ok(existsSync(`apps/admin/src/app/(protected)/${path}`));
    assert.ok(!existsSync(`apps/admin/src/app/${path}`));
  }
});

test('mobile apps restore auth and store refresh tokens with SecureStore', () => {
  const gate = readFileSync('packages/mobile-auth/src/index.tsx', 'utf8');
  assert.match(gate, /SecureStore\.setItemAsync/);
  assert.match(gate, /SecureStore\.getItemAsync/);
  for (const role of ['customer', 'provider']) {
    assert.match(readFileSync(`apps/${role}/App.tsx`, 'utf8'), /MobileAuthGate/);
  }
});

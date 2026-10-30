import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { DatabaseService } from '../dist/database/database.service.js';
import { OtpSender } from '../dist/auth/otp.sender.js';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const db = app.get(DatabaseService);
  const sender = app.get(OtpSender);
  const codes = new Map<string, string>();
  sender.send = async (phone: string, code: string) => { codes.set(phone, code); };
  const suffix = randomBytes(6).toString('hex').replace(/[a-f]/g, '4').slice(0, 9);
  const phone = `+919${suffix}`;
  const categorySlug = `phase5-${suffix}`;
  const serviceSlug = `phase5-repair-${suffix}`;
  await db.user.create({ data: { phone, role: 'ADMIN' } });
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();

  async function call(path: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: unknown, token?: string) {
    const response = await fetch(base + path, {
      method,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json() as Record<string, unknown> | Record<string, unknown>[];
    return { status: response.status, data };
  }
  try {
    assert.equal((await call('/catalog/categories')).status, 200);
    assert.equal((await call('/admin/catalog/categories')).status, 401);
    assert.equal((await call('/admin/catalog/categories', 'POST', { name: 'Untrusted' })).status, 401);
    const challenge = await call('/auth/request-otp', 'POST', { phone, role: 'ADMIN' });
    assert.equal(challenge.status, 200);
    const auth = await call('/auth/verify-otp', 'POST', {
      phone, role: 'ADMIN', challengeId: (challenge.data as Record<string, unknown>).challengeId, code: codes.get(phone),
    });
    assert.equal(auth.status, 200, JSON.stringify(auth.data));
    const token = (auth.data as Record<string, unknown>).accessToken as string;

    const createCategory = await call('/admin/catalog/categories', 'POST', {
      name: 'Test Household Work', slug: categorySlug, sortOrder: 9000,
    }, token);
    assert.equal(createCategory.status, 201, JSON.stringify(createCategory.data));
    const categoryId = (createCategory.data as Record<string, unknown>).id as string;
    const dup = await call('/admin/catalog/categories', 'POST', { name: 'Again', slug: categorySlug }, token);
    assert.equal(dup.status, 409);
    const badService = await call('/admin/catalog/services', 'POST', {
      name: 'Invalid price', slug: `invalid-${suffix}`, categoryId, pricingType: 'FIXED',
      basePricePaise: -100, durationMinutes: 45,
    }, token);
    assert.equal(badService.status, 400);

    const created = await call('/admin/catalog/services', 'POST', {
      name: 'Fan repair', slug: serviceSlug, description: 'Check and repair fan',
      categoryId, pricingType: 'INSPECTION', basePricePaise: 25000, durationMinutes: 45,
    }, token);
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const serviceId = (created.data as Record<string, unknown>).id as string;
    const listing = await call(`/catalog/services?category=${categorySlug}`);
    assert.equal(listing.status, 200);
    assert.ok(Array.isArray(listing.data) && listing.data.some((s) => s.slug === serviceSlug));
    const details = await call(`/catalog/services/${serviceSlug}`);
    assert.equal(details.status, 200);

    const updated = await call(`/admin/catalog/services/${serviceId}`, 'PATCH', {
      name: 'Ceiling fan repair', basePricePaise: 29900, durationMinutes: 50,
    }, token);
    assert.equal(updated.status, 200);
    assert.equal((updated.data as Record<string, unknown>).basePricePaise, 29900);
    const archiveCategory = await call(`/admin/catalog/categories/${categoryId}`, 'PATCH', { isActive: false }, token);
    assert.equal(archiveCategory.status, 200);
    const hidden = await call(`/catalog/services?category=${categorySlug}`);
    assert.ok(Array.isArray(hidden.data) && hidden.data.length === 0);
    assert.equal((await call(`/catalog/services/${serviceSlug}`)).status, 404);
    const preventPublication = await call(`/admin/catalog/services/${serviceId}`, 'PATCH', { isActive: true }, token);
    assert.equal(preventPublication.status, 400);

    assert.equal((await call(`/admin/catalog/categories/${categoryId}`, 'PATCH', { isActive: true }, token)).status, 200);
    assert.equal((await call(`/admin/catalog/services/${serviceId}`, 'PATCH', { isActive: false }, token)).status, 200);
    assert.equal((await call(`/catalog/services/${serviceSlug}`)).status, 404);
    assert.equal((await call(`/admin/catalog/services/${serviceId}`, 'PATCH', { isActive: true }, token)).status, 200);
    const restored = await call(`/catalog/services/${serviceSlug}`);
    assert.equal(restored.status, 200);
    assert.equal((restored.data as Record<string, unknown>).basePricePaise, 29900);
    console.log('Catalog integration smoke passed: public read, admin write, validation, conflicts, archive and restore.');
  } finally {
    await db.service.deleteMany({ where: { slug: serviceSlug } });
    await db.serviceCategory.deleteMany({ where: { slug: categorySlug } });
    await db.authOtpChallenge.deleteMany({ where: { phone } });
    await db.user.deleteMany({ where: { phone } });
    await app.close();
  }
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });

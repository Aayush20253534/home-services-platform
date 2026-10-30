import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { OtpSender } from '../src/auth/otp.sender';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const codes = new Map<string, string>();
  const sender = app.get(OtpSender);
  sender.send = async (phone: string, code: string) => { codes.set(phone, code); };
  const db = app.get(DatabaseService);
  const suffix = randomBytes(5).toString('hex');
  const customerPhone = `+9198${suffix.replace(/[a-f]/g, '1').slice(0, 8)}`;
  const providerPhone = `+9187${suffix.replace(/[a-f]/g, '2').slice(0, 8)}`;
  const adminPhone = `+9176${suffix.replace(/[a-f]/g, '3').slice(0, 8)}`;
  const phones = [customerPhone, providerPhone, adminPhone];
  await db.user.create({ data: { phone: adminPhone, role: 'ADMIN' } });
  await app.listen(0, '127.0.0.1');
  const address = await app.getUrl();

  async function call(path: string, body?: unknown, token?: string) {
    const response = await fetch(address + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json() as Record<string, unknown>;
    return { status: response.status, data };
  }

  async function logIn(phone: string, role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN') {
    const start = await call('/auth/request-otp', { phone, role });
    assert.equal(start.status, 200, JSON.stringify(start));
    const challengeId = start.data.challengeId;
    assert.equal(typeof challengeId, 'string');
    assert.ok(codes.get(phone), 'OTP sender must be invoked');
    const invalid = await call('/auth/verify-otp', { phone, challengeId, code: '999999', role });
    assert.equal(invalid.status, 401);
    const valid = await call('/auth/verify-otp', { phone, challengeId, code: codes.get(phone), role });
    assert.equal(valid.status, 200, JSON.stringify(valid));
    const token = valid.data.accessToken as string;
    const refresh = valid.data.refreshToken as string;
    assert.ok(token && refresh);
    const replay = await call('/auth/verify-otp', { phone, challengeId, code: codes.get(phone), role });
    assert.equal(replay.status, 401);
    return { token, refresh, user: valid.data.user as { role: string } };
  }

  try {
    assert.equal((await call('/auth/me')).status, 401);
    assert.equal((await call('/health')).status, 200);
    const customer = await logIn(customerPhone, 'CUSTOMER');
    assert.equal((await call('/auth/me', undefined, customer.token)).status, 200);
    assert.equal((await call('/access/admin', undefined, customer.token)).status, 403);
    assert.equal((await call('/access/provider', undefined, customer.token)).status, 403);

    const rotated = await call('/auth/refresh', { refreshToken: customer.refresh });
    assert.equal(rotated.status, 200);
    assert.equal((await call('/auth/refresh', { refreshToken: customer.refresh })).status, 401);
    const newerAccess = rotated.data.accessToken as string;
    assert.equal((await call('/auth/logout', {}, newerAccess)).status, 200);
    assert.equal((await call('/auth/me', undefined, newerAccess)).status, 401);

    const provider = await logIn(providerPhone, 'PROVIDER');
    assert.equal((await call('/access/provider', undefined, provider.token)).status, 200);
    const providerRow = await db.user.findUnique({ where: { phone: providerPhone }, include: { providerProfile: true } });
    assert.equal(providerRow?.providerProfile?.verificationStatus, 'PENDING');
    assert.equal((await call('/access/admin', undefined, provider.token)).status, 403);

    const admin = await logIn(adminPhone, 'ADMIN');
    assert.equal((await call('/access/admin', undefined, admin.token)).status, 200);
    assert.equal((await call('/access/provider', undefined, admin.token)).status, 403);

    const unprovisioned = await call('/auth/request-otp', { phone: '+919111111111', role: 'ADMIN' });
    assert.equal(unprovisioned.status, 200);
    assert.equal((await call('/auth/verify-otp', { phone: '+919111111111', role: 'ADMIN', challengeId: unprovisioned.data.challengeId, code: '123456' })).status, 401);
    console.log('Auth HTTP smoke passed: OTP, replay protection, roles, refresh rotation, logout, admin provisioning.');
  } finally {
    await db.authOtpChallenge.deleteMany({ where: { phone: { in: phones } } });
    await db.user.deleteMany({ where: { phone: { in: phones } } });
    await app.close();
  }
}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });

import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { digest, hashesEqual, validateAuthConfiguration } from './auth.service';

const cfg = {
  AUTH_JWT_SECRET: 'jwt-secret-abcdefghijklmnopqrstuvwxyz0123456',
  AUTH_OTP_SECRET: 'otp-secret-abcdefghijklmnopqrstuvwxyz0123456',
  AUTH_REFRESH_SECRET: 'refresh-secret-abcdefghijklmnopqrstuvwxyz0123456',
  NODE_ENV: 'test',
};

test('HMAC digests validate through constant-time comparison', () => {
  const a = digest('long-secret', 'hello');
  const b = digest('long-secret', 'world');
  assert.equal(hashesEqual(a, a), true);
  assert.equal(hashesEqual(a, b), false);
  assert.equal(hashesEqual('not hex', a), false);
});

test('JWT, OTP, refresh secrets must be independent', () => {
  assert.ok(validateAuthConfiguration(cfg).jwtSecret);
  assert.throws(() => validateAuthConfiguration({ ...cfg, AUTH_OTP_SECRET: cfg.AUTH_JWT_SECRET }));
  assert.throws(() => validateAuthConfiguration({ ...cfg, AUTH_JWT_SECRET: 'tiny' }));
});

test('production cannot enable local OTP mode', () => {
  assert.throws(() => validateAuthConfiguration({ ...cfg, NODE_ENV: 'production', SMS_PROVIDER: 'dev-console' }));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { OtpSender } from './otp.sender';

test('local console OTP mode is forbidden in production', async () => {
  const previous = { provider: process.env.SMS_PROVIDER, dev: process.env.AUTH_DEV_OTP, node: process.env.NODE_ENV };
  try {
    process.env.SMS_PROVIDER = 'dev-console';
    process.env.AUTH_DEV_OTP = 'true';
    process.env.NODE_ENV = 'production';
    await assert.rejects(new OtpSender().send('+919876543210','123456'));
  } finally {
    for (const [key,val] of [['SMS_PROVIDER',previous.provider],['AUTH_DEV_OTP',previous.dev],['NODE_ENV',previous.node]] as const) {
      if (val === undefined) delete process.env[key]; else process.env[key] = val;
    }
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { isE164PhoneNumber, isNonEmptyString } from './index';

test('requires meaningful text', () => {
  assert.equal(isNonEmptyString('   '), false);
  assert.equal(isNonEmptyString('Fan repair'), true);
  assert.equal(isNonEmptyString(42), false);
});

test('recognizes E.164 phone number format', () => {
  assert.equal(isE164PhoneNumber('+919876543210'), true);
  assert.equal(isE164PhoneNumber('9876543210'), false);
  assert.equal(isE164PhoneNumber('+000'), false);
});

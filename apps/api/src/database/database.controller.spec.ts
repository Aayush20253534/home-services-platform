import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceUnavailableException } from '@nestjs/common';
import { DatabaseController } from './database.controller';

test('readiness succeeds when PostGIS query returns a version', async () => {
  const controller = new DatabaseController({
    $queryRaw: async () => [{ version: '3.5.0' }],
  } as never);
  assert.deepEqual(await controller.readiness(), {
    status: 'ready',
    database: 'postgresql',
    spatial: 'postgis',
  });
});

test('readiness returns 503 without exposing database errors', async () => {
  const controller = new DatabaseController({
    $queryRaw: async () => { throw new Error('secret connection URL'); },
  } as never);
  await assert.rejects(
    controller.readiness(),
    (error: unknown) =>
      error instanceof ServiceUnavailableException &&
      error.message === 'Database is not ready',
  );
});

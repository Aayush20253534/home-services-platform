import assert from 'node:assert/strict';
import test from 'node:test';
import { AppService } from './app.service';

test('health payload identifies a running API process', () => {
  assert.deepEqual(new AppService().getHealth(), {
    status: 'ok',
    service: 'home-services-api',
  });
});

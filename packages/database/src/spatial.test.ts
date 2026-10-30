import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCoordinates, findEligibleServiceAreas } from './spatial';

test('rejects impossible latitude or longitude', () => {
  assert.throws(() => assertCoordinates({ latitude: 91, longitude: 80 }), RangeError);
  assert.throws(() => assertCoordinates({ latitude: 25, longitude: Number.NaN }), RangeError);
  assert.doesNotThrow(() => assertCoordinates({ latitude: 25.4358, longitude: 81.8463 }));
});

test('rejects unsafe spatial result limits before querying', async () => {
  let invoked = false;
  const stub = { $queryRaw: () => { invoked = true; return Promise.resolve([]); } };
  await assert.rejects(
    findEligibleServiceAreas(stub as never, { latitude: 25, longitude: 82 }, 10000),
    RangeError,
  );
  assert.equal(invoked, false);
});

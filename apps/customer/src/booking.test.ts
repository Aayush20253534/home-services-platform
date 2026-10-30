import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPreferredSlot, localDateKey, upcomingDays, validateDraft } from './booking';

const now = new Date(2026, 9, 31, 20);
const upcoming = upcomingDays(now);
const draft = {
  serviceId: 'service', serviceName: 'Inspection', basePricePaise: 24900,
  address: '27 Example Road, Prayagraj', note: '',
  preferredDate: upcoming[0].id, preferredTime: '11:00',
};
test('dates roll across month boundaries in local time', () => {
  assert.equal(localDateKey(new Date(2026,9,31,12)), '2026-10-31');
  assert.equal(upcoming[0].id, '2026-11-01');
  assert.equal(upcoming.length, 7);
  assert.match(formatPreferredSlot(draft), /11:00 AM/);
});
test('booking draft validation blocks missing address and stale slots', () => {
  assert.equal(validateDraft(draft, now), null);
  assert.match(validateDraft({ ...draft, address: 'x' }, now)!, /address/);
  assert.match(validateDraft({ ...draft, preferredDate: '2020-01-01' }, now)!, /seven days/);
  assert.match(validateDraft({ ...draft, note: 'x'.repeat(501) }, now)!, /500/);
  assert.match(validateDraft({ ...draft, preferredTime: '03:00' }, now)!, /time/);
});

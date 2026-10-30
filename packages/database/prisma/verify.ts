import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(process.cwd(), '../../.env'), override: false, quiet: true });

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { findEligibleServiceAreas } from '../src/spatial';

const database = new PrismaClient();

class RollbackVerification extends Error {}

async function verify(): Promise<void> {
  await database.$queryRaw`SELECT 1`;
  const spatial = await database.$queryRaw<Array<{ version: string }>>`SELECT PostGIS_Version() AS "version"`;
  assert.ok(spatial[0]?.version, 'PostGIS must be installed');

  const services = await database.service.count();
  assert.ok(services >= 6, 'Seed must populate the initial service catalog');

  // Verify a real spatial match without retaining a fabricated provider or user.
  // Throwing a dedicated marker rolls back the entire test transaction.
  let checked = false;
  try {
    await database.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { email: `phase03-${randomUUID()}@example.invalid`, role: 'PROVIDER' },
      });
      const provider = await transaction.providerProfile.create({
        data: { userId: user.id, displayName: 'Transient verification record', verificationStatus: 'VERIFIED', isOnline: true },
      });
      await transaction.providerServiceArea.create({
        data: { providerId: provider.id, label: 'Geo test', latitude: 25.4358, longitude: 81.8463, radiusKm: 3 },
      });

      // Exercise relational writes using the actual generated Prisma client.
      // The entire verification transaction is deliberately rolled back.
      const customer = await transaction.user.create({
        data: { email: `customer-${randomUUID()}@example.invalid`, role: 'CUSTOMER' },
      });
      const address = await transaction.address.create({
        data: {
          userId: customer.id,
          label: 'Temporary',
          line1: 'Database verification fixture',
          city: 'Prayagraj',
          state: 'Uttar Pradesh',
          postalCode: '211001',
          latitude: 25.4358,
          longitude: 81.8463,
        },
      });
      const catalogService = await transaction.service.findFirstOrThrow({
        where: { isActive: true },
      });
      await transaction.providerSkill.create({
        data: { providerId: provider.id, serviceId: catalogService.id, approved: true },
      });
      const booking = await transaction.booking.create({
        data: {
          customerId: customer.id,
          serviceId: catalogService.id,
          addressId: address.id,
          scheduledFor: new Date('2026-11-01T10:00:00Z'),
          estimatedPricePaise: catalogService.basePricePaise,
        },
      });
      await transaction.bookingStatusEvent.create({
        data: { bookingId: booking.id, toStatus: 'REQUESTED', actorUserId: customer.id },
      });
      await transaction.assignmentOffer.create({
        data: {
          bookingId: booking.id,
          providerId: provider.id,
          expiresAt: new Date('2026-11-01T09:30:00Z'),
        },
      });
      await transaction.providerAssignment.create({
        data: { bookingId: booking.id, providerId: provider.id },
      });
      await transaction.payment.create({
        data: { bookingId: booking.id, amountPaise: catalogService.basePricePaise, gateway: 'verification-only' },
      });
      const saved = await transaction.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: { assignment: true, offers: true, payments: true, statusEvents: true },
      });
      assert.equal(saved.assignment?.providerId, provider.id);
      assert.equal(saved.offers.length, 1);
      assert.equal(saved.payments.length, 1);
      assert.equal(saved.statusEvents.length, 1);

      const nearby = await findEligibleServiceAreas(transaction, { latitude: 25.436, longitude: 81.847 });
      assert.ok(nearby.some((area) => area.providerId === provider.id), 'nearby provider should match');
      const distant = await findEligibleServiceAreas(transaction, { latitude: 28.6139, longitude: 77.209 });
      assert.ok(!distant.some((area) => area.providerId === provider.id), 'distant provider must not match');
      checked = true;
      throw new RollbackVerification();
    });
  } catch (error) {
    if (!(error instanceof RollbackVerification)) throw error;
  }
  assert.ok(checked, 'geospatial assertion must execute');
  console.log(`Database verified: ${services} services; PostGIS ${spatial[0].version}; spatial transaction rolled back.`);
}

verify()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });

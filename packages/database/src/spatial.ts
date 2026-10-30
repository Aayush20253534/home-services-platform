import type { PrismaClient } from '@prisma/client';

export type Coordinates = { latitude: number; longitude: number };

export type EligibleServiceArea = {
  id: string;
  providerId: string;
  distanceMeters: number;
};

export function assertCoordinates(point: Coordinates): void {
  if (!Number.isFinite(point.latitude) || point.latitude < -90 || point.latitude > 90) {
    throw new RangeError('latitude must be between -90 and 90');
  }
  if (!Number.isFinite(point.longitude) || point.longitude < -180 || point.longitude > 180) {
    throw new RangeError('longitude must be between -180 and 180');
  }
}

/**
 * Uses PostGIS geography distances in meters, not naive degree arithmetic.
 * A provider can have multiple service areas; this returns eligible areas,
 * NOT a final provider ranking or dispatch decision.
 */
export async function findEligibleServiceAreas(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  customer: Coordinates,
  limit = 25,
): Promise<EligibleServiceArea[]> {
  assertCoordinates(customer);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError('limit must be between 1 and 100');
  }

  return prisma.$queryRaw<EligibleServiceArea[]>`
    SELECT area."id", area."providerId",
      ST_Distance(
        ST_SetSRID(ST_MakePoint(area."longitude"::double precision, area."latitude"::double precision), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${customer.longitude}::double precision, ${customer.latitude}::double precision), 4326)::geography
      ) AS "distanceMeters"
    FROM "ProviderServiceArea" AS area
    JOIN "ProviderProfile" AS provider ON provider."id" = area."providerId"
    WHERE area."isActive" = TRUE
      AND provider."verificationStatus" = 'VERIFIED'::"VerificationStatus"
      AND provider."isOnline" = TRUE
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(area."longitude"::double precision, area."latitude"::double precision), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${customer.longitude}::double precision, ${customer.latitude}::double precision), 4326)::geography,
        area."radiusKm" * 1000.0
      )
    ORDER BY "distanceMeters" ASC
    LIMIT ${limit};
  `;
}

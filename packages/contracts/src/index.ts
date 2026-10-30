/**
 * Transport-safe shared domain contracts.
 * These are not a substitute for runtime request validation (Phase 04+).
 */
export const USER_ROLES = ['CUSTOMER', 'PROVIDER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BOOKING_STATUSES = [
  'REQUESTED',
  'OFFERED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface HealthResponse {
  status: 'ok';
  service: 'home-services-api';
}

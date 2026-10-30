# Architecture overview

## Phase 01 deployment units

- **Customer:** Expo/React Native, Android and iOS.
- **Provider:** Separate Expo/React Native application.
- **Admin:** Next.js App Router web dashboard.
- **API:** NestJS REST API, `GET /health` for process liveness.
- **PostgreSQL:** PostGIS-equipped local container; persistence model follows in Phase 03.
- **Redis:** Local container reserved for future background assignments.

## Boundaries

Apps communicate with the API over HTTP(S). Never connect a mobile app directly to PostgreSQL, Redis, or payment provider secrets. Only the server should access privileged services.

Future dispatch design uses persistent assignment offers, transactional acceptance and a background job queue. The design must guarantee no double-confirmed booking under concurrent accepts and maintain an audit history.

## Ports

- `3000`: admin
- `4000`: API
- `5432`: PostgreSQL (loopback-bound)
- `6379`: Redis (loopback-bound)

Expo development servers choose available Metro ports automatically.

## Security boundary

Phase 01 **does not** implement production authentication, authorization, payment flows, or sensitive data management. Do not launch publicly with only the Phase 01 foundation.

## Integration roadmap

Phase 02: design system. Phase 03: Prisma/PostGIS models and migrations. Phase 04: sessions, role guards and OTP. Phases 05–20: service operations, dispatch and commerce.

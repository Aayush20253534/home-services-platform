# Phase 03: PostgreSQL, Prisma and PostGIS

## Implemented

- Versioned Prisma relational schema: `packages/database/prisma/schema.prisma`.
- Baseline migration: `packages/database/prisma/migrations/20261030000100_init/migration.sql`.
- PostgreSQL 17 / PostGIS 3.5 local Docker service (already added in Phase 01).
- Idempotent six-category example catalog seed with six services, monetary values stored as integer **paise**.
- Users, customer/provider profiles, services, provider skills, schedules, service areas, addresses, bookings, booking status events, assignment offers, confirmed assignments and payment records.
- Real `ST_DWithin` and `ST_Distance` PostGIS geography queries, including eligibility checks for verified/online providers.
- SQL checks against negative prices, invalid coordinates, bad service radii and invalid weekday or time ranges.
- A unique confirmed provider assignment per booking, plus indexed offer history (race-safe dispatch transactions are Phase 14).
- NestJS `DatabaseModule` and `GET /health/ready` endpoint.
- A transaction-rollback spatial smoke test that creates temporary provider/coverage records, validates near/far results, then rolls back without retaining personal data.
- CI migration, seed, and geospatial integration checks against actual PostGIS database.

## Requirements

Use Node 22+, pnpm 10 and Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:validate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:verify
pnpm dev
```

On PowerShell use `Copy-Item .env.example .env` instead of `cp`.

- `GET http://localhost:4000/health`: process liveness.
- `GET http://localhost:4000/health/ready`: actual database and PostGIS readiness (returns HTTP 503 if unavailable).

For future model edits, use `pnpm db:migrate:dev` on a **development** database to generate a new migration, review the SQL and commit it. Production uses `pnpm db:migrate:deploy`. **Never** run `migrate reset` or `db push` against production.

The catalog seed is idempotent by category/service slugs. It does not create users or actual bookings. Catalog prices are illustrative until the business configures rates.

## Important invariants

- All money is integer paise (100 paise = ₹1); avoid floating-point currency.
- Use UTC timestamps in the database (timestamptz), convert to local time at the presentation boundary.
- Longitude and latitude use DECIMAL(9,6), validated in SQL and in the spatial query helper.
- The PostGIS spatial expression indexes use geography points created from coordinates (longitude **first**, latitude second), so distance/radius comparisons use meters.
- Foreign keys prevent orphan bookings, provider offers and payments. Deletion policies are explicit.
- `ProviderAssignment.bookingId` is unique. Phase 14 must still use a transaction and conditional acceptance to prevent concurrent offers from incorrectly succeeding.
- `BookingStatusEvent` is an append-only event model by convention, but state machine enforcement and authorization are later phases.
- Sample UI data in Phase 02 is **not** fetched from the database. Real CRUD endpoints begin in later phases.

## Test checklist

```bash
pnpm db:validate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:seed
pnpm db:verify
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Seeding twice must not create duplicate category or service rows. Spatial verification must match a nearby transient, verified, online provider, reject the same provider when distant, and leave no transient records after rollback.

## Deferred to later phases

- Passwordless phone OTP identity and permission enforcement: Phase 04.
- Admin CRUD for services/categories and provider management: Phases 05, 09 and 11.
- Customer booking API and address ownership enforcement: Phases 07–08.
- Assignment engine and transactional dispatch: Phases 13–14.
- Payment gateway and immutable financial ledger/settlements: Phases 18–19.
- Additional refund, review, notification, dispute, and audit-log tables should be implemented with versioned migrations when those features are built.

## Security

Local Postgres credentials in compose and env examples are development-only. Never expose `DATABASE_URL` to mobile apps or browser code. Real credentials must be delivered via server-side secrets and used with TLS in managed production deployments.

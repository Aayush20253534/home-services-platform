# Phase 05: Database-backed service catalog

## Scope delivered

- Public, read-only category list, active service list and individual service details from PostgreSQL.
- Customer app fetches live catalog data; no hard-coded service prices or categories are used as a fallback.
- Admin-only create, update, archive and restore for categories and services.
- Existing slugs are immutable; collisions return HTTP 409. Invalid inputs and references return HTTP 400.
- Category archival hides its services from public discovery, even when the service itself remains active.
- Soft archival retains historic relational references and booking records.
- Backend price validation uses integer paise. Admin form converts decimal INR to integer paise without floating-point precision loss.
- Next.js server-only proxy forwards admin catalog changes with HttpOnly session authorization and same-origin write checks.
- Existing catalog seed will no longer overwrite live edits on subsequent runs.
- Integration test exercises auth restrictions, create/edit, invalid prices, duplicate slugs, archive and restore.

## API

Public:
```text
GET /catalog/categories
GET /catalog/services?category=cleaning&search=clean&limit=100
GET /catalog/services/:slug
```

Authenticated ADMIN only:
```text
GET   /admin/catalog/categories
GET   /admin/catalog/services?limit=100
POST  /admin/catalog/categories
PATCH /admin/catalog/categories/:uuid
POST  /admin/catalog/services
PATCH /admin/catalog/services/:uuid
```

Example POST /admin/catalog/services:
```json
{
  "name": "Ceiling fan inspection",
  "slug": "ceiling-fan-inspection",
  "categoryId": "replace-with-real-category-uuid",
  "description": "Initial inspection and estimate",
  "pricingType": "INSPECTION",
  "basePricePaise": 24900,
  "durationMinutes": 45,
  "isActive": true
}
```

Only fields explicitly whitelisted by the API are accepted. Use PATCH { "isActive": false } to archive and PATCH { "isActive": true } to restore. Hard DELETE is intentionally unavailable.

## Local setup

```bash
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

Admin sign-in: http://localhost:3000/login, then open Services. Customer app uses its `EXPO_PUBLIC_API_URL` setting to fetch public catalog. Prices in initial seed are examples; replace them in admin before real operations.

## Acceptance

- Anonymous GET returns only active services from active categories.
- Anonymous and CUSTOMER writes are denied; ADMIN requests succeed.
- Create, edit, archive and restore persist across reloads.
- Duplicated slugs, unknown IDs, invalid money and malformed data receive errors.
- Archiving does not delete historical data.
- Customer handles no services or unavailable API gracefully.
- Build, typecheck, migration, seed and integration tests pass in CI.

## Deferred

Image uploads, dynamic subservices/problem trees and provider-specific pricing are future enhancements. Address selection, real booking creation, payment and dispatch are not introduced here. Admin listing currently requests up to 100 services; pagination is a follow-up for larger catalogs.

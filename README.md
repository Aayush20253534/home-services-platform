# Home Services Platform

A TypeScript monorepo for a three-sided home-services marketplace: customer mobile application, service-provider mobile application, admin dashboard, and a shared backend API.

## Applications

| Workspace | Stack | Development command |
| --- | --- | --- |
| `apps/customer` | Expo / React Native | `pnpm --filter @home-services/customer dev` |
| `apps/provider` | Expo / React Native | `pnpm --filter @home-services/provider dev` |
| `apps/admin` | Next.js App Router | `pnpm --filter @home-services/admin dev` |
| `apps/api` | NestJS | `pnpm --filter @home-services/api dev` |

## Requirements

- Node.js 22.13 or later (Node 22 LTS is recommended)
- pnpm 10 (enable with Corepack)
- Docker Desktop or a compatible Docker Engine for local PostgreSQL and Redis
- Android Studio/Android emulator or Expo-compatible device for Android development; macOS + Xcode for iOS simulator

## Quick start

```bash
git clone https://github.com/Aayush20253534/home-services-platform.git
cd home-services-platform
corepack enable
corepack prepare pnpm@10.20.0 --activate
pnpm install
cp .env.example .env
docker compose up -d
pnpm dev
```

On Windows PowerShell replace `cp .env.example .env` with `Copy-Item .env.example .env`. The API listens at `http://localhost:4000/health`; the admin website is at `http://localhost:3000`. Expo prints QR codes or emulator links for both mobile applications. Both Expo projects are independent and can be launched separately.

The API's `/health` endpoint is a **process liveness** check; `/health/ready` checks PostgreSQL and PostGIS. The initial database and migrations are implemented in Phase 03. Authentication is part of Phase 04. No production credentials are included.

## Local infrastructure

```bash
docker compose up -d
docker compose ps
docker compose down
```

PostgreSQL (with PostGIS available for future migrations) runs on port 5432; Redis on 6379. Credentials in `compose.yaml` are local-development-only examples and must not be reused in a deployed system.

For physical mobile devices, use your computer's LAN IP instead of `localhost` when configuring a future `EXPO_PUBLIC_API_URL`. Android emulator uses `10.0.2.2` for the host machine.

## Initialize the database (Phase 03)

```bash
pnpm db:generate
pnpm db:validate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:verify
```

The seed adds six example categories and services, no customer/provider accounts or transactions. For future development-only schema changes use `pnpm db:migrate:dev`. See `docs/phases/03-database.md`.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

`pnpm build` verifies the web/API builds and Metro bundles for Android and iOS. It **does not** generate signed APK/IPA files. Continuous integration runs the same checks.

## Workspace layout

```text
apps/
  customer/     Expo customer app
  provider/     Expo provider app
  admin/        Next.js admin site
  api/          NestJS REST API
packages/
  config/       Shared TypeScript compiler configuration
  design-tokens/ Shared mobile/web theme and CSS variables
  mobile-ui/    Reusable React Native interface components
  database/     Prisma schema, migrations, seed and spatial queries
  contracts/    Shared TypeScript API/domain types
  validation/   Shared validation helpers
docs/
  architecture/ Architecture and decisions
  phases/       Phase completion details
```

## Phase status

- **Phase 01:** Monorepo, four application shells, local infrastructure, lint/typecheck/tests, CI, and documentation.
- **Phase 02:** Implemented shared design tokens, reusable mobile components, interactive customer/provider screen previews, and six navigable admin sections with demo filtering and dialogs.
- **Phase 03:** Prisma relational schema, versioned PostGIS migration, database readiness, seeded catalog, and spatial verification.
- **Phase 04:** Authentication and role-based permissions.

See `docs/phases/01-foundation.md`, `docs/phases/02-design-system.md`, `docs/phases/03-database.md`, and `docs/architecture/design-system.md` for details. **All currently displayed booking/provider/customer records, prices, counts and earnings are illustrative.** Customer drafts, provider availability and admin service creation exist only as temporary UI state; they are not persisted or submitted. Backend integration begins in later phases.

## Security

Do not commit `.env` files, API keys, customer information, provider identity documents, or payment credentials. The admin and API shells remain unauthenticated after Phase 03 and must not be exposed as production business applications until Phase 04 authorization and subsequent security work are complete.

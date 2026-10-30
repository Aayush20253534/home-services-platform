# Phase 01: Repository and monorepo foundation

## Deliverables

- [x] pnpm 10 / Turborepo repository initialized on `main`.
- [x] Two Expo React Native mobile application shells.
- [x] Next.js admin application shell.
- [x] NestJS backend with `GET /health`.
- [x] Shared TypeScript configuration, contracts and validation helpers.
- [x] Docker Compose with PostgreSQL (PostGIS) and Redis.
- [x] GitHub Actions lint, typecheck, test and build workflow.
- [x] Local environment example and README.

## Acceptance commands

```bash
corepack enable
corepack prepare pnpm@10.20.0 --activate
pnpm install
docker compose up -d
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
curl http://localhost:4000/health
```

Expect the health endpoint to return a JSON object with `status: "ok"`. This tests **liveness only** and does not probe PostgreSQL or Redis.

## Deferred scope

No database models, Prisma migrations, OTP, booking flow, provider matching, secure admin login or payment integration are included in this phase. These belong to later phases.

## Verification status

The implementation files are in Git. Confirm the checks above and the GitHub Actions run before considering the phase fully verified on a development machine.

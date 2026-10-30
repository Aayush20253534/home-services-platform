# Phase 04: Authentication and role-based authorization

## Implemented
- E.164 phone verification using random 6-digit OTPs; 5-minute expiry, five failed attempts and one-time consumption.
- OTP HMAC digests stored instead of plaintext values, phone/IP-based rate limits, and SMS delivery via Twilio with explicit local dev-console mode.
- Self-service onboarding for CUSTOMER and PROVIDER only. Provider accounts start PENDING verification; no public admin registration.
- Explicit administrator provisioning with `pnpm db:provision-admin +919876543210`, which refuses privilege escalation for existing nonadmin users.
- JWT access tokens (15 minutes, HS256, issuer/audience constraints) backed by revocable database sessions.
- 30-day opaque refresh tokens stored only as HMAC hashes; atomic refresh-token rotation, logout and logout-all.
- Globally protected NestJS routes and role guards; public health and OTP endpoints. Test endpoints for admin/provider role verification.
- Admin web sign-in uses server-side Next.js API routes with HttpOnly, SameSite=Strict cookies; protected pages use server-side role checks. Refresh rotates through a server-only route.
- Customer and provider apps include OTP sign-in, account restoration, encrypted SecureStore refresh-token storage and logout.
- Automated checks: cryptographic config tests and real HTTP/DB authentication integration test with mock SMS sending.

## Setup and local verification

Use PostgreSQL/PostGIS migration from Phase 03. After pulling main:

```bash
pnpm install
cp .env.example .env
cp apps/customer/.env.example apps/customer/.env
cp apps/provider/.env.example apps/provider/.env
docker compose up -d
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:provision-admin +919876543210
pnpm dev
```

On Windows PowerShell use `Copy-Item` in place of `cp`.
Set `AUTH_JWT_SECRET`, `AUTH_OTP_SECRET` and `AUTH_REFRESH_SECRET` to distinct 32+ character cryptographically random secrets before deploying. The checked-in values are examples and are **not production-safe**.

In local development only, the backend may use `SMS_PROVIDER=dev-console` together with `AUTH_DEV_OTP=true` and nonproduction `NODE_ENV`; OTPs print to the API terminal. This mode refuses to operate in production. Configure a real SMS sender and approved messaging compliance for production; this reference implementation supports Twilio (`SMS_PROVIDER=twilio` and all three `TWILIO_*` env vars).

For the web dashboard deployed separately from the API, set server-only `AUTH_API_URL` to the HTTPS backend base URL. Do not prefix that variable with `NEXT_PUBLIC_`. Configure each Expo app's own `.env` with a reachable `EXPO_PUBLIC_API_URL`, using your LAN IP on physical devices.

## API contracts

```text
POST /auth/request-otp   {phone, role}             -> {challengeId, expiresInSeconds, message}
POST /auth/verify-otp    {challengeId,phone,code,role} -> {accessToken, refreshToken, expiresIn, user}
POST /auth/refresh       {refreshToken}             -> rotated access/refresh tokens
GET  /auth/me            Authorization: Bearer ... -> {id,phone,role}
POST /auth/logout        Authorization: Bearer ... -> {success:true}
POST /auth/logout-all    Authorization: Bearer ... -> {success:true}
GET  /access/admin       ADMIN only
GET  /access/provider    PROVIDER only
GET  /health             Public liveness
GET  /health/ready       Public DB/PostGIS readiness
```

Roles are one per phone number. An already registered phone cannot silently switch between CUSTOMER, PROVIDER and ADMIN. Users requesting an admin OTP without provisioning get a generic response and cannot verify.

## Security boundaries and limitations

- Account authorization and session revocation are checked against PostgreSQL on every protected request, not just by trusting the JWT payload.
- Refresh tokens are stored hashed; access tokens exist in mobile memory and short-lived HttpOnly admin cookies.
- Admin credentials are not exposed to client-side JavaScript.
- Only trusted proxy hops should be enabled through `TRUST_PROXY_HOPS`. Under an unconfigured proxy all users might share an IP throttle bucket.
- The SMS provider account must have the necessary approvals to send OTPs to its launch market.
- Data validation, permission checks and admin provisioning must also be applied to future business API routes. The demo data is not real booking information.
- Provider accounts can authenticate while verification is pending, but may not be assigned real jobs until provider approval rules are implemented.
- For public launch, harden anti-abuse controls with a durable distributed rate limiter/captcha, account and device risk checks, and operator-facing auditing.

## CI / smoke tests

The CI pipeline starts PostGIS, runs migrations and the catalog seed, and performs an HTTP integration test covering customer signup, OTP replay rejection, roles, provider pending verification, admin provisioning, refresh rotation and logout. The test overrides SMS delivery in-process and never sends real messages.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @home-services/database build
pnpm --filter @home-services/api test:integration
pnpm build
```

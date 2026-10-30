# Phase 06: Customer mobile interface

## Completed

Phase 06 builds a usable customer-facing interface without prematurely activating real bookings.

- Responsive Expo/React Native home, search, category browsing, service-list, and detail screens
- **Live catalog only**, fetched from the Phase 05 public API. Archived categories and services are not shown; invalid data is rejected rather than replaced with made-up products
- Search by service, description or category; category filters; alphabetical, ascending and descending price sorting
- Temporary saved-service shortlist, accessible from Home and Profile
- Actual logged-in customer phone displayed on the account page (the Phase 02 guest placeholder is gone)
- Service details show current prices, pricing type, duration, and real descriptions from PostgreSQL
- Booking preview: choose one of the **next seven local calendar days**, select a preferred time, enter an address and optional description, review the price and save an in-memory draft
- Draft list allows edit, delete and restarting the draft process; stale preferred dates are replaced with a current option when editing
- Profile links: Saved services, Saved addresses placeholder, Payment history placeholder, Help/FAQ, Privacy and security overview, and sign out
- Android hardware Back returns to the previous screen; bottom tabs remain available
- Pull-to-refresh using a backwards-compatible optional addition to the shared mobile navigation component
- Loading, empty, catalog-unavailable and retry states
- Pure catalog and booking-rule modules with unit tests, plus structural regression checks

## Explicit boundaries

**A saved draft is not a booking.** It never creates a database row, notifies a provider, reserves a time, charges money or claims a confirmed appointment.

**Favorites and drafts live in React component memory only.** They disappear after an app restart or sign-out. Do not describe them as permanently saved. The draft may contain a typed address and note; it is not uploaded to an API at this stage.

The customer profile's phone number comes from the authenticated Phase 04 session. Profile editing, address persistence, GPS and serviceability belong to Phase 07. Actual bookings are Phase 08. Payments and dispatch arrive later.

## Local setup

```bash
pnpm install
cp .env.example .env
cp apps/customer/.env.example apps/customer/.env
docker compose up -d
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

Configure the customer app's `EXPO_PUBLIC_API_URL` with the address your phone or emulator can reach. The API must be running and its SMS development provider configured for OTP sign-in.

Customer Expo development server: port 8081. Admin service management: http://localhost:3000/services.

## Acceptance checks

1. Sign in with customer OTP; profile displays the authenticated phone.
2. Home loads live categories/services and does not show invented filler data when the API is down.
3. Search, filter by category, sort by price and toggle the saved-service shortlist.
4. Open service details and confirm the price and description match the admin catalog.
5. Select a future day, time, address and optional problem description. Reject an invalid address.
6. Review and save a local draft, view it under Requests, edit it, then delete it.
7. Profile help accordions open/close, privacy overview is readable, and sign-out works.
8. Confirm the request never appears in the admin booking queue; no API call creates a booking.
9. Restart the app; temporary drafts/favorites do not persist.
10. Verify `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.

## Next milestone

Phase 07: customer address management, address ownership, location and serviceability. Phase 08: real booking APIs, proper scheduling and persistent booking history.

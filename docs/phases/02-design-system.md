# Phase 02: Shared visual system and interactive screen previews

## What is implemented

- Shared TypeScript colors, spacing, radii and typography: `packages/design-tokens`.
- CSS custom properties for the Next.js dashboard: `packages/design-tokens/styles/tokens.css`.
- Reusable React Native components: `packages/mobile-ui` (buttons, badges, cards, headers, search, bottom navigation, notices).
- Customer app: Home, Explore, Bookings, Profile, service detail, appointment form, booking review and memory-only draft list.
- Provider app: Home, Jobs, Schedule, Earnings, Profile and detail preview, with memory-only availability toggle and day selection.
- Admin: Overview, Bookings, Providers, Customers, Services, Settings. Responsive sidebar, mobile menu, filtering, search, detail dialogs and a memory-only service form.
- Demo data is always identified as illustrative. No actual customers, providers, orders, settlements or permissions have been created.

## Demo interactions (manual smoke tests)

### Customer app
1. Switch across four bottom tabs.
2. Select a category; confirm the Explore filter updates.
3. Type into search; verify matching services are shown.
4. Select a service, choose a time, enter a sample address and review.
5. Save a demo draft, view it in Bookings and remove it.
6. Restart the application; memory-only drafts should disappear.

### Provider app
1. Toggle availability; label must say it is only a preview.
2. Open a job, inspect details, and return to the job list.
3. Filter jobs by example status.
4. Select weekdays and toggle availability.
5. Visit Earnings, see demo figures; visit Profile and check coming-soon labels.
6. No active accept/reject dispatch action should exist.

### Admin web
1. Navigate to every sidebar destination; verify the current page is highlighted.
2. Resize browser to mobile width; verify menu opens and closes.
3. Search and filter sample bookings and providers, open/close a detail dialog.
4. Search customers, check empty-results state.
5. Filter service categories, add a demo service, check it appears only in the current browser session.
6. Reload; demo service must disappear.
7. Confirm all sample operational data has clear demo disclosures.

## Design principles

- Minimum 44–48 px touch areas where practical, strong contrast and accessible labels.
- Clear hierarchy: main heading, section title, card title, metadata, caption.
- One primary call to action per significant view.
- No pretend checkout, fake provider assignment or misleading persistence.
- Shared semantic palette (ink, surface, primary blue, teal, amber, danger).
- Responsive web layout with scrollable tables rather than clipped records.

## Deferred

- User authentication and persistence: Phase 04.
- Backend service catalog: Phase 05.
- Location services and addresses: Phase 07.
- Booking submissions: Phase 08.
- Live provider management: Phases 09–12.
- Matching and dispatch: Phases 13–15.
- Payment data and real earnings: Phases 17–19.

## Verification

```bash
pnpm install --no-frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Automated checks validate the code and bundles. Actual simulator/device layout inspection and browser visual testing remain separate manual acceptance activities.

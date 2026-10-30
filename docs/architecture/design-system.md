# Design system architecture

The two React Native apps share semantic theme values and native components via workspaces. The admin web app consumes the same semantic palette via a CSS tokens entrypoint.

## Sources of truth

- `packages/design-tokens/src/index.ts`: native colors, spacing, radii and type sizes.
- `packages/design-tokens/styles/tokens.css`: matching web CSS variables.
- `packages/mobile-ui/src/index.tsx`: `AppShell`, `AppButton`, `SurfaceCard`, `AppText`, `Badge`, `PageHeader`, `SectionHeading`, `SearchField`, `Notice` and `Icon`.
- `apps/admin/src/app/globals.css`: CSS semantic components and responsive web layout.
- `apps/admin/src/components/ui.tsx`: dashboard reusable metric, table detail, filters, page heading and dialog primitives.

## Palette

- Ink / dark: #17243F / #101F3F
- Primary blue: #3956E8
- Teal: #079F91
- Amber: #D58B19
- Danger: #CE4962
- Background / surface: #F5F7FB / #FFFFFF

## Component behavior

All real pressable controls have an actual local behavior. Nonoperational actions display an explicit coming-soon state or are disabled. Data actions never impersonate successful backend writes.

React Native demos use local component state. Admin previews use client components for filters, detail overlays, and session-only service drafts. This is **not** persistence; it is UI acceptance tooling.

## Mobile navigation

A shared bottom tab bar drives the customer (Home, Explore, Bookings, Profile) and provider (Home, Jobs, Schedule, Earnings, Profile) views. Contextual detail screens remain within their parent tab and preserve intuitive back behavior.

## Web navigation

Next.js App Router provides distinct URLs for Overview, Bookings, Providers, Customers, Services and Settings. The sidebar handles wide layouts; a slide-out mobile navigation supports smaller screens.

## Maintenance rules

Update semantic colors in **both** TypeScript and CSS tokens. Avoid adding raw palettes without mapping to tokens. Accessibility checks should cover semantic roles, labels, mobile touch targets, keyboard focus, responsive tables and contrast before production.

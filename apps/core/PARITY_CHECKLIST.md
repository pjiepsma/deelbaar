# Core vs legacy mobile — behavior parity checklist

Primary Expo app: **`apps/core`** (`@deelbaar/core`). Legacy **`apps/mobile`** may be removed after everything here is true for Core.

Use this list when implementing or reviewing; tick items in your tracker of choice.

## Routing and shell

- [ ] Root layout: providers (Query, Auth, User, Locale, Onboarding, Notification, Theme), HeroUI + Uniwind, Safe Area, Stack.
- [ ] Entry: redirect or auth gate to main experience (`/(tabs)` or login).
- [ ] Tab bar (or equivalent) for main sections (e.g. map, account).

## Auth and profile

- [ ] Email/password (or current) sign-in and sign-out.
- [ ] Anonymous / guest flows if product requires them.
- [ ] Profile load and display; role/guest copy where applicable.

## Map and listings

- [ ] Map renders with valid `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- [ ] Listings data source matches mobile (Payload / local / hybrid as designed).
- [ ] Search, category filters, carousel / detail selection behavior.
- [ ] Location permission and map center / city messaging (e.g. free area hints) if present in product.

## Domain features (port from `components/` as needed)

- [ ] Reviews (list, sort, submit if applicable).
- [ ] Reservations / tools modals.
- [ ] Products / offerings / approval flows.
- [ ] Book scanner / wishes / inventory flows.
- [ ] Notifications (bell, badge, payload).
- [ ] Onboarding modal / first-run.
- [ ] Stripe Connect (if still in scope).
- [ ] Create listing / seed / admin utilities used in production builds.

## i18n and settings

- [ ] `nl` / `en` (or full locale set) and persistence.
- [ ] Theme preference (system / light / dark) wired to Uniwind.

## Data and types

- [ ] `pnpm copy:payload-types` updates **`apps/core/lib/types/payload-generated.ts`** (and CI runs it before build if needed).
- [ ] Payload base URL correct per environment (`EXPO_PUBLIC_PAYLOAD_URL`).

## Native / build

- [ ] Android: `google-services.json` package matches `app.json` `android.package`.
- [ ] EAS: `eas.json` + `extra.eas.projectId` in `app.json` for builds you care about.
- [ ] iOS: credentials and profiles for EAS if iOS is in scope.

## UI direction (HeroUI-first)

- [ ] Replace ad-hoc buttons, inputs, dialogs, toasts, sheets with **HeroUI Native** primitives where possible (see repo `AGENTS.md` and HeroUI docs).
- [ ] Defer visual redesign until parity is stable.

# Core vs legacy mobile — behavior parity checklist

Primary Expo app: **`apps/core`** (`@deelbaar/core`). **`apps/mobile`** exists only during migration; once this checklist is satisfied for Core, **`apps/mobile` is removed** (no ongoing rebuild there).

**Product vision and MVP direction:** repo **`docs/PRODUCT_VISION.md`**.

Use this list when implementing or reviewing; tick items in your tracker of choice.

## HeroUI rewrite progress

- **Batch 1 (done):** Root **`HeroUINativeProvider`** `config.devInfo.stylingPrinciples: false` (quieter logs); merged duplicate **`ThemePreferenceProvider`** imports in **`app/_layout.tsx`**. **`app/login.tsx`** — `Card`, `Spinner`, Uniwind layout classes, HeroUI **`Input`** / **`Button`**. **`app/(tabs)/account.tsx`** — **`Card`** (Header / Body / Title / Description), **`Chip`** (role, `color="default"` to avoid bad accent token), **`Separator`**, Uniwind text utilities; **`useMemo`** deps include **`t`**.
- **Batch 2 (done):** Map shell chrome — **`SearchBar`**: **`SearchField`** + **`SearchIcon`** / **`Input`** / **`ClearButton`**, Uniwind group. **`MapCategoryFilter`**: **`Surface`** trigger + Uniwind / popover header; **`displayName`**. **`EmptyStateCard`**: **`Card`** + **`Card.Body`**, Uniwind typography; **`displayName`**.
- **Batch 3 (done):** **`global.css` `@theme`** — **`--color-accent`** + **`--color-accent-foreground`** to satisfy Uniwind / HeroUI accent utilities (reduces **`accent-accent`** warning). **`molecules/ListingCard`**: **`Card`** shell, **`Button`** (icon-only) for favorites, **`Chip`** for category pill, Uniwind text utilities; removed debug **`console.log`**. **`molecules/DefaultCard`**: **`Card`** + **`Card.Body`**, **`Button`** for CTA; **`displayName`**.
- **Next batches:** **`ListingsMapNew`** overlays / chrome, modals, domain screens (reviews, products, books).

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

- [x] Payload-backed hooks under **`apps/core/lib/hooks/data/`**; **`lib/hooks/index.ts`** barrel — see **`apps/core/README.md`**.
- [ ] `pnpm copy:payload-types` updates **`apps/core/lib/types/payload-generated.ts`** (and CI runs it before build if needed).
- [ ] Payload base URL correct per environment (`EXPO_PUBLIC_PAYLOAD_URL`).

## Native / build

- [ ] Android: `google-services.json` package matches `app.json` `android.package`.
- [ ] EAS: `eas.json` + `extra.eas.projectId` in `app.json` for builds you care about.
- [ ] iOS: credentials and profiles for EAS if iOS is in scope.

## UI direction (HeroUI-first)

- [ ] Replace ad-hoc buttons, inputs, dialogs, toasts, sheets with **HeroUI Native** primitives where possible (see repo `AGENTS.md` and HeroUI docs).
- [ ] Defer visual redesign until parity is stable.

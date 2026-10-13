# Navigation contract (`apps/core`)

Single architecture: **Expo Router** file routes + React Navigation under the hood. No parallel manual `linking.ts` maps.

## Screen categories

| Category | Routes | Header | Back |
|----------|--------|--------|------|
| **Tabs** | `/(tabs)/*` | `headerShown: false` | N/A — iOS `NativeTabs`, Android floating pill (`FloatingTabBar`). Layout: [layout-contracts/tabs-chrome.md](layout-contracts/tabs-chrome.md) |
| **Full-bleed stack** | `/auth/*`, `/listing/*`, `/account/*`, `/legal/[page]` | `headerShown: false` | `HeroChromeButton` (`arrow-back`) + `router.back()` / `navigation.goBack()` |

Presets live in `apps/core/src/navigation/screenOptions.ts`.

## Full-bleed back chrome

- Use `HeroChromeButton` from `features/listings/HeroChromeButton.tsx` (listing is reference).
- Auth: `AuthScreenShell` with `onBack` — back row **outside** scroll, same horizontal/top padding as listing hero (`PLACE_DETAIL_HORIZONTAL_PADDING`, `TOP_CHROME_PADDING`).
- **Forbidden:** native stack header on auth/listing/legal; custom × close; footer duplicate back on same screen; `formSheet` + nested stack for auth.

## Imperative navigation

- Guest → auth: `navigateToAuthStart()` → `/auth`
- Listing: `navigateToListingDetail({ collection, id })` → `/listing/:collection/:id`
- Legal: `navigateToLegalDocument({ page })` → `/legal/:page`
- Account stack: `navigateToAccountPath` / listings helpers in `rootNavigation.ts` → `/account/*`
- Auth success exit: `dismissAuthFlow()` → `router.replace('/(tabs)/map')` (skipped when `authFlowPresentation === 'embedded'`)

Auth step transitions: `apps/core/src/navigation/authPaths.ts` only — no raw legacy screen names (`LoginEmail`, `AuthStart`, …).

## Deep links

| URL path | Screen |
|----------|--------|
| `/` | `/(tabs)/map` (initial tab) |
| `/auth` | Auth start |
| `/auth/callback` | Verify email (`email`, `code` query params) |
| `/listing/:collection/:id` | Listing detail |
| `/legal/:page` | Legal document |
| `/account/*` | Account stack (profile, listings, reach, language, theme, …) |

Scheme: `deelbaar://` (see `app.json`).

## Forbidden

- Nested `Auth` stack / `AuthModalStack` / `formSheet` auth wrapper
- `navigateTo*Modal` naming for non-modal routes
- `getRootStackNavigator` parent walks (use router helpers)
- Third back implementation per screen type

## Verification

See `docs/design/navigation-verification-matrix.md`. PRs touching navigation must pass `@deelbaar/core` lint and the matrix smoke checklist.

# Navigation verification matrix (`@deelbaar/core`)

Run before merging navigation changes.

## Automated (CI)

```bash
pnpm --filter @deelbaar/core lint
```

Workflow: `.github/workflows/core-navigation-smoke.yml`

## Manual smoke (device or simulator)

| # | Flow | Steps | Pass |
|---|------|-------|------|
| 1 | Guest → auth | Profile / Favorites / Hub / Map protected action → `/auth` | Back returns to prior tab |
| 2 | Auth back chrome | Auth start shows `HeroChromeButton` top-left; swipe back works | Matches listing circle back |
| 3 | Auth email path | Enter email → login or sign-up → back through stack | No duplicate back rows |
| 4 | Listing detail | Map card → `/listing/:collection/:id` → back | Hero back + gesture |
| 5 | Legal | Profile → legal row → Komoot-style top-left circle back | Title loads, back works on loading/error/content |
| 6 | Auth success exit | Login with completed onboarding → lands on `/(tabs)/map` | No trapped auth stack |
| 7 | Deep link | `deelbaar://auth/callback?email=…&code=123456` | Verify screen prefills |

## Regression guards

- No `formSheet` auth wrapper
- No `navigateToAuthModal` / `getRootStackNavigator`
- Auth transitions use `authPaths.ts` only

# `@deelbaar/core` (Expo)

Primary app shell: **Expo Router**, **TanStack Query**, **Payload** via **`getPayloadSdk()`**, **SQLite + sync** for offline-first listings.

**Migration:** behavior and UI are ported from **`apps/mobile`** into Core; **`apps/mobile`** is **not** the long-term product surface. When parity in **`PARITY_CHECKLIST.md`** is satisfied, **`apps/mobile`** will be **deleted** from the repo (no dual maintenance after that).

## Layout

| Path | Role |
|------|------|
| `app/` | Routes, layouts, screens (thin; compose hooks + components). |
| `components/` | UI by domain (`map/`, `listings/`, `auth/`, …) with local `index.ts` barrels where present. |
| `lib/api/` | Transport: `payloadSdk.ts`, `PayloadClient.ts`; add **`lib/api/<domain>/`** for custom routes and typed fetchers. |
| `lib/hooks/data/` | Payload-backed React Query hooks split by domain (listings, users, reviews, uploads). |
| `lib/hooks/index.ts` | Optional barrel re-exporting `./data/*` and other hooks. |
| `lib/hooks/useLocationQueries.ts` | Map bounds, GPS, **`useNearbyListings`**. |
| `lib/providers/` | Auth, Query, theme, notifications, etc. |
| `lib/storage/` | SQLite, sync queue, file queue. |
| `lib/types/` | Shared models + generated Payload types. |
| `constants/` | Legacy palette / typography / map style (being phased toward Uniwind + HeroUI tokens). |
| `lib/constants/` | Map/listing layout numbers shared with map UI. |

## References

- Product vision + map UI inspiration (Funda / Komoot / TripAdvisor): repo **`docs/PRODUCT_VISION.md`** (screenshots: **`docs/funda.jpeg`**, **`docs/komoot.jpeg`**, **`docs/tripadvisor.jpeg`**). **Style:** Komoot-like calm interaction reference; **UI build** = **HeroUI Native + Uniwind** theming, not pixel clones of references.
- Parity vs legacy app: `PARITY_CHECKLIST.md`.
- API layers rule: repo `.cursor/rules/deelbaar-api.mdc`.
- Strict Payload typing (no `any` / loose SDK): repo `.cursor/rules/payload-strict-types.mdc`.

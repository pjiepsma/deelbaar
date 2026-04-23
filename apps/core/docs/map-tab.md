# Map tab (listings + carousel)

This screen stacks **Mapbox**, **floating controls**, and **bottom dock UI** (search, filters, `ListingCarousel`). A few details are easy to get wrong on **Android** and with **GPS-driven queries**—this page is the checklist.

## 1. Environment

| Variable | Where | Notes |
|----------|--------|--------|
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | `apps/core/.env` | Required; without it the map screen shows a token error. |
| `EXPO_PUBLIC_PAYLOAD_URL` | `apps/core/.env` | Base URL for the CMS (no trailing slash). **Must be reachable from the phone** (e.g. `http://192.168.x.x:4000` on the same LAN as the device; `localhost` is wrong on a physical device). |

After changing `.env`, restart Metro (`pnpm run dev:core` or your usual command).

## 2. CMS / API

Nearby listings use **`GET /api/listings/nearby`** (see `apps/cms`). The map tab does not require login for that route; if the carousel is empty, confirm in logs that the request returns `docs` (status 200) and that `EXPO_PUBLIC_PAYLOAD_URL` matches what the device can open in a browser.

## 3. Layout: three layers (do not reorder casually)

The implementation lives in `components/map/MapTabShell.tsx`. Order and stacking matter:

1. **Map** — `ListingsMapNew` fills the screen (`flex: 1`). It loads GPS, calls `useNearbyListings`, and pushes results into parent state via `setListings`.
2. **Controls** — absolutely positioned search + category row (`zIndex` below the dock layer).
3. **Dock layer** — `StyleSheet.absoluteFillObject` with **higher `zIndex` + Android `elevation`** than the map so React Native views can paint **above** the native map.

If controls or carousel disappear on Android, the first fix is usually the map’s **surface** mode (see below), not random `zIndex` tweaks.

## 4. Android: Mapbox above RN siblings

`@rnmapbox/maps` on Android defaults to a **GL surface** that can draw **on top of** sibling React Native views. In `ListingsMapNew` we set:

```tsx
surfaceView={Platform.OS === 'android' ? false : undefined}
```

That uses a **texture-backed** path so overlays (carousel / bottom sheet) can sit above the map. See Mapbox RN docs for tradeoffs (performance vs overlay stacking).

## 5. GPS + React Query: do not clear listings on refetch

`useNearbyListings` uses a query key that includes **latitude and longitude**. Small GPS updates start a **new** query; for a moment `data` can be empty. Without **`placeholderData: keepPreviousData`**, any `setListings(nearbyListings)` effect will briefly set **zero listings** and the carousel will flicker or look “empty”.

That behavior is implemented in `apps/core/lib/hooks/useLocationQueries.ts` (`useNearbyListings`). If you change the query key (e.g. round coordinates), keep the same guard in mind.

## 6. Debugging the dock vs the map

`MapTabShell` supports an optional **yellow debug strip** at the bottom of the dock layer (counts + optional extra label). Toggle in `MapTabShell.tsx`:

```ts
const MAP_TAB_DEBUG_DOCK = __DEV__ && true; // set false when done
```

- If you **see** the strip but **not** the carousel/bottom sheet content, stacking is OK; focus on `ListingCarousel` / HeroUI BottomSheet (`isOpen`, snap points, portal).
- If you **do not** see the strip, the dock layer is not winning the draw order—re-check `surfaceView` and `carouselLayer` `elevation` / `zIndex`.

## 7. HeroUI BottomSheet + map

`ListingCarousel` uses **`BottomSheet` + `BottomSheet.Portal`** from HeroUI Native (gorhom-based). Portals render in a **window-level** layer; they should appear above the map when the native map uses the texture path above. If you still see odd behavior, compare with a minimal HeroUI example from `.heroui-docs/native/components/(overlays)/bottom-sheet.mdx` and the upstream [Bottom sheet](https://www.heroui.com/docs/native/components/bottom-sheet) docs.

## 8. Minimal mental model

```
<View style={{ flex: 1 }}>
  <Map />           {/* flex 1, fetches nearby → setListings */}
  <Controls />      {/* absolute top */}
  <DockLayer />     {/* absolute fill, high zIndex — ListingCarousel */}
</View>
```

Parent state holds **`listings`**; the map receives **`filteredListings`** for markers so filters match the carousel.

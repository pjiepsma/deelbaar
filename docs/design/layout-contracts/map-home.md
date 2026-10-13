# Map home (overview) layout contract

Floating discovery chrome on Map tab. Map remains the hero; overlays must not bury it.

## Top chrome

Absolute top stack (**no** full-width wrapping card — map stays visible between controls):

| Token | Value | Role |
|-------|-------|------|
| `MAP_OVERLAY_TOP_GAP` | 8 | Gap below safe-area top |
| `MAP_OVERLAY_HORIZONTAL_PADDING` | 16 | Left/right inset |
| Stack | `gap-2` only | Search pill + category Tabs + soft count |

Search alone may use a pill `Surface`. Tabs use HeroUI primary list chrome.

**Order (top → bottom):** `MapAreaSearchField` → `MapCategoryFilter` (`Tabs` primary) → `MapResultCount` (`Chip` soft).

Category triggers: min height **44** (`min-h-11`). Filter testIDs: `filter-map-all|kiosks|markets|taps`.

**Overflow:** With ≤4 filters, equal-width row (no `Tabs.ScrollView` — avoids dead half-scroll). At **5+** (`MAP_FILTER_SCROLL_MIN_COUNT`), horizontal scroll kicks in.

## Bottom chrome

Let `C = tabBarOverlayClearance(insets.bottom)`.

| Chrome | Formula |
|--------|---------|
| Carousel | `C + MAP_LISTING_CAROUSEL_BOTTOM_PADDING` (12) |
| Image band | `MAP_LISTING_IMAGE_HEIGHT` = **140** |
| Body | `MAP_LISTING_CARD_BODY_HEIGHT` = **84** |
| Card height | `MAP_LISTING_CARD_HEIGHT` = image + body = **224** |
| My location | carousel bottom + card height + 12 |
| Coachmark | carousel bottom + card height + 16 |

Keep in sync with [tabs-chrome.md](./tabs-chrome.md).

## Card anatomy

- Column: full-bleed photo on top, text below (`Card` + `Card.Body`).
- Type badge: `Chip` soft **on photo** (bottom-left).
- Heart: top-right on photo.
- Title: `text-base`; distance / rating secondary.

## Out of scope

- Amenity filter sheet
- Explicit “Search this area” CTA
- Non-map Home feed

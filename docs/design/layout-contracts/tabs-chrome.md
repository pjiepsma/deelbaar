# Tabs chrome layout contract

Platform shell (HeroUI Fitness / Stride pattern):

| Platform | Shell |
|----------|--------|
| **iOS** | `NativeTabs` (`expo-router/unstable-native-tabs`) — system tab bar insets the scene |
| **Android** | Custom `FloatingTabBar` — absolute centered `Surface` pill; scene is full-bleed |

Shared config: `apps/core/src/navigation/tabs.ts`. Clearance math: `apps/core/src/navigation/tabBarClearance.ts`.

## Android floating pill geometry

Named constants (keep in sync with `FloatingTabBar` classNames):

| Constant | Value | Meaning |
|----------|-------|---------|
| `TAB_BAR_SAFE_OFFSET_ADDON_PX` | 12 | Gap above safe-area bottom |
| `FLOATING_TAB_BAR_PILL_HEIGHT_PX` | 56 | `p-1.5` (12) + `h-11` (44) |
| `floatingTabBarOccupiedHeight(B)` | `B + 12 + 56` | Total height from screen bottom to top of pill |

`tabBarOverlayClearance(B)` = occupied height on Android, **0** on iOS.

## Map chrome (absolute bottoms)

Let `C = tabBarOverlayClearance(insets.bottom)`.

| Chrome | Formula |
|--------|---------|
| Carousel | `C + MAP_LISTING_CAROUSEL_BOTTOM_PADDING` (12) |
| My location | carousel bottom + `MAP_LISTING_CARD_HEIGHT` (224) + 12 |
| Coachmark | carousel bottom + card height + 16 |

Top map chrome (search / category Tabs / count): see [map-home.md](./map-home.md).

## Tab list screens (`Screen` + `withTabBarSpacing`)

| Platform | `paddingBottom` on `Screen` |
|----------|-----------------------------|
| Android | `floatingTabBarOccupiedHeight(insets.bottom)` |
| iOS | `0` (NativeTabs already insets) |
| No tab spacing | `insets.bottom` |

## Account home (Android floating)

`AccountCanvas` with `withTabBar` is **full-bleed** under the pill (no outer bottom pad). Guest/console `ScrollView` uses `tabScreenBottomPadding` on `contentContainerStyle` so last rows clear the pill — same overlay idea as Map.

## Out of scope

- `ScreenFade` under the pill (optional later; skip over Mapbox)
- HeroUI Pro FAB (different control)

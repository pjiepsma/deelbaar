# Layout contract: legal document

Scope: `apps/core/src/features/legal/LegalDocumentScreen.tsx`

## Regions

- Back chrome (floating top-left)
- Content state (loading / error / document body)

## Invariants

- Uses shared back primitive: `ScreenBackChrome` → `HeroChromeButton`.
- Top inset formula: `top = insets.top + TOP_CHROME_PADDING`.
- Horizontal inset formula: `x = PLACE_DETAIL_HORIZONTAL_PADDING`.
- Back button is visible in all legal states: loading, error, content.
- Root route is full-bleed (`headerShown: false`) for `/legal/[page]`.
- Scroll content keeps bottom-safe area: `paddingBottom = insets.bottom + 24`.

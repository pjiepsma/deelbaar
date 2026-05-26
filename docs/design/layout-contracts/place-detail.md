# Place detail — layout contract

Reference: Komoot-style place detail (task may pin `docs/design/place-detail-reference.png`).

## Layout mechanism

- **Screen:** flex column — hero block (height `H`) then sheet (`flex: 1`, `marginTop: -R`).
- **Hero:** full-bleed media (height `H`) + chrome overlay column (`marginTop: -H`, `justifyContent: 'space-between'`, `paddingBottom: placeDetailHeroChromeBottom()`).
- **No absolute** for sheet or hero chrome bands; see `.cursor/rules/flex-over-absolute-layout.mdc`.

## Regions

| Region | Definition |
|--------|------------|
| `H` | `placeDetailHeroHeight()` = `round(windowHeight × 0.36)` |
| `R` | `PLACE_DETAIL_PANEL_RADIUS` = 24 |
| Sheet overlap | `marginTop: -R` on sheet — beige panel overlaps bottom **R** px of hero |
| Hero safe band | Y from 0 to `H - R` — bottom chrome must live here |
| `heroChromeBottom` | `placeDetailHeroChromeBottom()` = `R + PLACE_DETAIL_HERO_CHROME_GAP` (= 32) — controls sit above beige curve |

## Invariants (pass/fail)

| ID | Rule | Pass when |
|----|------|-----------|
| P1 | Chrome above sheet lip | Bottom chrome wrapper uses `paddingBottom: placeDetailHeroChromeBottom()` (= 64) |
| P2 | No duplicate insets | Dots in full-width row above pill/thumb row; one bottom chrome stack |
| P3 | Sheet overlap | Sheet uses `marginTop: -R`, not absolute `top: sheetTop` |
| P4 | Z-order | Hero root (or bottom chrome) `zIndex` > sheet so controls are not hidden behind sheet |

## Forbidden

- Separate absolute layers for dots vs pills vs thumb
- Magic `bottom:` values on hero controls (`16`, `36`, etc.)
- Absolute sheet positioning when flex + negative margin works

## States to prove (layout proof in handoff)

- Guest, photos hero, ≥1 photo (carousel)
- Guest, map hero
- Optional: 0 photos, signed-in Save enabled

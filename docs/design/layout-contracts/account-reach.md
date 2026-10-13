# Layout contract — Account reach store

**Route:** `/account/reach`

## Layout

1. AccountTaskScreen header (theme-aware back)
2. Summary Card — home label (or city required), hosting-always-free, MetricRing current tier
3. SnapDeck of packs (home included; province/country/world not on sale) — owned tier uses accent border
4. “Notify me” → BottomSheet: purchases not enabled (no fake IAP)

## Proof

- [ ] No fake purchased state
- [ ] No fake Store checkout
- [ ] Border color from theme accent (not hardcoded purple)

# Account UX master

**Scope:** `/(tabs)/account` + `/account/*`.

**References:** [account-references/INDEX.md](account-references/INDEX.md) (HeroUI fitness Profile template + Material/Android/Apple settings IA + shipped app galleries).

## Design language

Primitives in `apps/core/src/features/account/design/`:

- Canvas, TopChrome, LanguageSheet, ThemeSheet, AboutSheet
- **AccountSectionTitle**, **AccountPromoCard** (guest TB rhythm — one title style, flat wash cards)
- PassportCard, MetricRing, SnapDeck / StickyActionBar (signed / stack)
- HeroUI `ListGroup` for guest settings/legal (no trailing chevrons)

## Guest home

Quiet Account surface (`GuestAccountScreen`) — one visual system:

1. Brand chrome (`ACCOUNT_TITLE_CLASS`)  
2. Join — `AccountPromoCard` + perks + SoftCta/primary → auth  
3. Need help? — compact shell + chevron → `/account/help`  
4. Settings — `AccountSectionTitle` + flat list (Location / Language / Theme stacks)  
5. Help & legal — same list pattern  
6. Version  

Contract: [layout-contracts/account-home-guest.md](layout-contracts/account-home-guest.md).

## Signed-in home

Console (`AccountConsoleScreen`) — structurally ≠ guest:

1. Identity band → profile  
2. Next-steps deck (omit when empty)  
3. Host card — My listings / Add listing  
4. Visitor tools — alerts, home base, reach  
5. Account — guidelines, profile, privacy & data  
6. Settings + useful links  
7. Session sheet  

Contract: [layout-contracts/account-home-signed-in.md](layout-contracts/account-home-signed-in.md).

## Stack

Task screens via `AccountTaskScreen`: listings, wizard, reach, home base, guidelines, identity, alerts, data.

## Grep gate

Under `features/account`, avoid Profile god-screen DNA as the **whole** tab: `TabScreenHeader` + body `RadioGroup` theme/language walls.

Allowed: HeroUI `Card` / `ListGroup` / `Surface` / `PressableFeedback` / sheets for Account settings lists (matches HeroUI fitness template).

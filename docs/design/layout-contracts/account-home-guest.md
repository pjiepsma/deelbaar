# Layout contract — Account home (guest)

**Route:** `/(tabs)/account` when `!user`

**References:** [account-references/INDEX.md](../account-references/INDEX.md) — Thuisbezorgd perk invite + Need help + stack settings.

## Tokens

| Token | Role |
|-------|------|
| `ACCOUNT_CANVAS_PAD` | Horizontal inset (20) |
| `ACCOUNT_CARD_RADIUS` | Promo cards radius (28) |
| `ACCOUNT_PROMO_PAD` | Promo body/footer pad (16) |
| `ACCOUNT_BLOCK_GAP` | Gap between major blocks (16) |
| `ACCOUNT_SECTION_GAP` | Section title → list (12) |
| `ACCOUNT_TITLE_CLASS` | All titles: `text-foreground text-lg font-bold` |
| `ACCOUNT_SUBTITLE_CLASS` | Help subtitle: `text-muted text-base` |
| `ACCOUNT_PROMO_CARD_CLASS` | Flat: `border-0 shadow-none` |
| `JOIN_CARD_DOODLE_SIZE` | Join art (120) |
| `HELP_CARD_DOODLE_SIZE` | Need help art (72) |
| `ACCOUNT_PROMO_COMPACT_PAD` | Need help pad (12) |

## Structure (scroll)

1. **AccountCanvas** — no glow, no sticky bar, tab clearance  
2. **Top chrome** — brand via `ACCOUNT_TITLE_CLASS`  
3. **Join** — `AccountPromoCard` clay wash, `AccountSectionTitle`, 3 one-line perks, doodle, SoftCta + primary → auth  
4. **Need help?** — compact shell, mist wash, title + subtitle + doodle + **trailing chevron**; press → `/account/help`  
5. **Settings** — `AccountSectionTitle` + ListGroup white `shadow-none`; rows icon + title + value; **no** `ItemSuffix`  
6. **Help & legal** — same list pattern  
7. **Version** — muted footer  

## Forbidden

- Fredoka / one-off title sizes on guest home  
- `ListGroup.ItemSuffix` on guest settings/legal lists (Need help keeps chevron)  
- Promo card drop shadows  
- Language/Theme/Location bottom sheets on Account home  
- Multi-line perk bullets; Just Eat orange  

## Proof

- [ ] Join + Need help both use `AccountPromoCard` (same radius/pad/shadow-none)  
- [ ] Four titles = `AccountSectionTitle` / `ACCOUNT_TITLE_CLASS`  
- [ ] Need help has trailing chevron + compact pad/art 
- [ ] Need help → `/account/help`  
- [ ] Dual CTAs soft + primary only  

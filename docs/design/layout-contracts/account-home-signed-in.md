# Layout contract — Account home (signed-in)

**Route:** `/(tabs)/account` when `user`

## Structure (scroll)

1. **AccountCanvas** — no glow, tab clearance
2. **Top chrome** — brand
3. **Identity band** (`PassportCard`) → profile on press; home label or unset; verified chip; reach metric ring
4. **Next steps** (`AccountActionDeck`) — omit when empty
5. **Host card** — My listings + Add listing
6. **Visitor tools** — alerts, home base, reach (`AccountIconRow`, no chevrons)
7. **Account** — guidelines, profile, privacy & data
8. **Settings** — language, theme → sheets
9. **Useful links** — terms, privacy, about
10. **Session** CTA → SessionSheet; version

## Forbidden

- Guest join/auth dual CTA as primary chrome
- Profile `ListGroup` god-screen / body theme radios as the whole tab
- Gear-only access to destinations

## Proof

- [ ] Capture structurally different from guest (identity + host card, no Sign up/Log in join card)
- [ ] All icon rows navigate to real `/account/*` or sheets

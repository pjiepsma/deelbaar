# Deelbaar Core — Mobile UX Master

**Source of truth** for `apps/core` UI and copy. If the app disagrees with this document, the app is wrong.

Agents: read this entire document before changing any screen in `apps/core`. Humans: treat changes here as product decisions.

---

## Product

Map-first neighbourhood app:

- **Discover** shared places (kiosks, markets, taps) on the map
- **Save** favorites for quick return
- **Host** manage their listing under Account → My listings
- **Configure** the app in Account (theme, language, legal, reach, privacy)

**Personality:** Warm, local, trustworthy, uncluttered. A useful neighbourhood tool — not a social network or fintech app.

---

## North-star principles

1. **Browse open, act gated** — Guests explore the map and place previews freely. An account is for *your* places and *saved* places, not for looking around.
2. **Never show system language** — No API reasons, enum values, “auth required”, “interaction locked”, `outside_unlocked_scope`, or debug labels in the UI.
3. **One visual system** — Same screen title scale, subtitle, horizontal inset, section spacing, list style, and button hierarchy on every tab and modal.
4. **Explain at the moment of action** — Restrictions appear when the user tries something, in plain language with one clear next step (usually sign in).
5. **Same skeleton when signed in** — Tabs keep the same layout; content fills in. The screen must not feel like a different product after login.
6. **Performance is a product promise** — The app must feel fast on ordinary phones. Fetch only what the user is exploring; never block the map with full-screen reloads while panning; render pins and cards for the visible area, not the whole country.

---

## Performance (key USP)

**Positioning:** *Fast local discovery — the map stays responsive while you explore.*

| User feels | We deliver |
|------------|------------|
| Map never “loads the world” | Listings fetched for visible area + small buffer only |
| Pan/zoom stays smooth | Background refresh keeps last pins/cards on screen |
| Cards and pins stay in sync | One cache, viewport-filtered for carousel and markers |
| Trust through speed | Skeletons only when cache is empty — never flash away good data |

**Map tab rules (Milestone 1):** viewport-sized fetch with prefetch buffer; abort superseded network requests; cap payloads and rendered pins; native map layers preferred over many React marker views. **Discovery** responses carry card-only fields; **focus** (pin or carousel snap) prefetches full place detail so opening a card feels instant.

Same principles apply later to Favorites lists, place detail media, and Account hosting — bounded fetch, render what is on screen, background refresh by default.

---

## Access layers

| Layer | Guest | Signed-in |
|-------|--------|-----------|
| Map browse (pan, zoom, cards) | Full | Full |
| Place detail (full screen from carousel) | Full content for guests; hero photos/map toggle; heart Save gated | Same + Save when `canFavorite` |
| Save / follow / alerts | Tap → sign-in modal | Enabled, “coming soon”, or soft-disabled with human copy |
| Favorites tab | Sign-in to see saved list | Saved places or honest empty |
| Account tab | Quiet Account: perk invite join card (dual CTAs + doodle), settings, help/legal | Console: identity, host card, visitor tools, settings, session |

Backend `interaction` fields (`canFavorite`, `reason`, etc.) are **implementation only**. Map them to user-facing copy in one place (i18n / a small copy helper). **Never** render `reason` or contract keys in JSX.

---

## Map

### Horizontal listing cards

**Layout:** Komoot-style snap carousel flush above the tab bar (bottom padding only). Each card is a compact **row**: thumbnail left, text right, white surface with light shadow on the map. **Type** appears as a badge on the thumbnail (not a separate count strip above the carousel).

**Show:** image, name, type badge, distance, rating/review count when available.

**Do not show:** lock icons, “auth required”, entitlement warnings, route stats (duration/elevation), or any `interaction` state on the card.

Cards look **equally tappable** for everyone. Tapping opens the **full-screen place detail**.

**Heart (save) on the card:** May appear for everyone; it is **not** a silent favorite toggle. **Guests** cannot save — tap runs the same protected-action path as Save in the preview sheet (close sheet if needed → sign-in modal). **Signed-in** users only persist when `canFavorite` allows; otherwise disable the control or show honest “not available yet” copy — never toggle `loved` locally without a successful API.

### Place detail screen (from map carousel)

- **Entry:** Carousel card tap → full-screen detail (`ListingDetail`), not a bottom sheet. Swipe-back and hero **←** return to Map tab.
- **Hero:** Komoot-style toggle — **photos** (swipe carousel) ↔ **mini map** (listing pin + user location when available). **No route line**, no external turn-by-turn. Bottom-left: photo-count pill + **Add photo** chip (same dark pill style; guest sees it disabled). Bottom-right: map thumb switches modes.
- **Chrome:** White circular back, share (stub OK), **heart** = Save (`runMapProtectedAction`). **No** ⋯ menu. **No sticky footer.**
- **Guest:** Full place copy (description, hours, notices, grid, reviews). **Save**, **Add photo**, and **Leave review** are gated (Add photo / Leave review disabled on hero and reviews header; Save → sign-in modal).
- **Body:** Beige panel (`#F2EDE8`): kind pill, title, type row, description, 2×2 facts (real CMS data only), horizontal notice cards, **Reviews** section (header + leave-review link; list or “no reviews yet”).
- **Forbidden:** Duration/elevation/route stats, “Navigate” to Apple/Google Maps, `interaction.reason` in UI.
- **Layout contract (agent):** [layout-contracts/place-detail.md](layout-contracts/place-detail.md) — math proof required before “done”.

### Save / follow / alerts

| User | Behaviour |
|------|-----------|
| Guest | Buttons look actionable; tap → close sheet if needed → auth modal |
| Signed-in, allowed | Perform action or honest “not available yet” |
| Signed-in, scope limited | Disabled with human explanation (e.g. area access) — never enum text |

### Map chrome (search, coachmarks)

- Coachmarks: short, sequential, dismissible — teach pan/zoom, cards, opening a place.
- Tone: encouraging, not salesy.

---

## Tabs

**Chrome shell:** iOS system `NativeTabs`; Android centered floating pill tab bar (`Surface` + haptics). Map carousel / overlays clear the floating pill on Android — see [layout-contracts/tabs-chrome.md](layout-contracts/tabs-chrome.md).

### Page chrome (all tabs)

- **Title** — matches bottom tab label; appears **once** on the screen.
- **Subtitle** — one muted line: what this tab is for.
- **Inset & rhythm** — same horizontal padding and section gaps on Favorites and Account.

### Guest sign-in block (Favorites)

Used when Favorites’ main value needs an account:

- Sits **directly under** the subtitle (top of content). **Not** vertically centered on the empty screen.
- Shared `GuestAuthCard`: icon + headline + one sentence + full-width **“Log in or sign up”**.
- Headline **must not** repeat the tab title.

Account guest is a separate greenfield landing surface (not this card template). See [account-ux-master.md](account-ux-master.md).

### Account (guest)

Quiet Account — structurally different from signed-in:

1. Join invite card (perk title, 3 bullets, Open Doodle, Create account + Log in → auth).
2. Settings list (language, theme with status → sheets).
3. Help & legal list + version.

References: [account-references/INDEX.md](account-references/INDEX.md).  
Contracts: [layout-contracts/account-home-guest.md](layout-contracts/account-home-guest.md). See also [account-ux-master.md](account-ux-master.md).

### Account (signed-in)

Feature-rich console:

1. Identity band → profile.
2. Next-steps deck when needed; host card (listings / add).
3. Visitor tools (alerts, home base, reach) + guidelines / data.
4. Settings, legal links, session (sign out / delete).

Contracts: [layout-contracts/account-home-signed-in.md](layout-contracts/account-home-signed-in.md), [account-listings.md](layout-contracts/account-listings.md), [account-reach.md](layout-contracts/account-reach.md).

### Favorites (signed-in)

- Same header rhythm as other tabs.
- List of saved places or honest empty.
- Subtitle may describe sort behaviour (e.g. distance from map area).

---

## Auth (modal)

- Slide-up modal; dismiss returns to the same tab/context.
- **Start:** doodle hero (`AUTH_START_DOODLE`), title, short product line, email continue, Google. Contract: [layout-contracts/auth-start.md](layout-contracts/auth-start.md).
- **Tone:** plain errors; no jargon.
- **Onboarding:** verify email → welcome → notifications → location (honest about what is and isn’t stored).
- **Forms:** keyboard-safe; one obvious primary action per step; consistent shell across auth screens.

---

## Copy rules

| Context | Rule |
|---------|------|
| Tab subtitle | What this part of the app **is** |
| Sign-in block headline | What you **do** after sign-in (action) |
| Sign-in block body | **Why** (one sentence) |
| Blocked action | What’s unavailable + what to do |
| Errors | What happened + what to try |
| **Forbidden in UI** | `auth_required`, `Interaction locked`, `reason`, snake_case API strings, “Locked” without explanation |

All user-visible strings: **English and Dutch** in `apps/core/src/i18n/catalog.ts`.

---

## Visual system

| Element | Direction |
|---------|-----------|
| Brand colors | Moss + warm stone canvas + subtle clay card wash — [brand-colors.md](brand-colors.md) |
| Screen title | One size/weight app-wide (large semibold) |
| Subtitle | Muted, one line, body size |
| Section title | Smaller than screen title, bold, tight gap to content |
| Horizontal inset | Same on all tabs |
| Section gap | Same vertical rhythm between blocks |
| Settings / legal | Grouped list rows, chevrons where navigable |
| Sign-in upsell | Compact surface/card under subtitle |
| Place rows | Card with image + metadata |
| Primary button | Filled accent (moss); white label |
| Soft / secondary CTA | `SoftCtaButton`: white + ink label, no border (Thuisbezorgd Create account) |
| Google CTA | Soft CTA + multicolor `GoogleGlyph` |
| Invite / join card | Subtle clay wash (`BRAND_INVITE_WASH` / `#F9F6F0`) on stone canvas + moss checkmarks |
| Empty state | Icon + title + description; full-screen only when the **whole** screen has no other content |

**Themes:** System / light / dark from Account; applies app-wide.

---

## Agent master prompt (new chat)

Copy into Agent mode when implementing UX work:

```
Implement in apps/core only. Before coding, read docs/design/mobile-ux-master.md end-to-end.

You are implementing Deelbaar’s mobile UX spec, not patching screens ad hoc. Match the access layers, copy rules, and visual system in that document.

Deliver cohesive UI across Map (cards + preview), Favorites, Account, and auth touchpoints. Remove any user-visible system or diagnostic language.

When finished, run the checklist below and pnpm --filter @deelbaar/core lint. List files changed.
```

---

## Implementation checklist

Before marking UX work done:

- [ ] No `interaction.reason`, `.replaceAll('_')`, “Interaction locked”, or contract keys in JSX
- [ ] Map carousel cards show no auth/entitlement labels
- [ ] Place detail screen: hero toggle, no route/footer, human copy (EN + NL)
- [ ] Account guest is quiet Account (perk invite dual CTAs + doodle + settings ListGroup + help — not marketing stack)
- [ ] Account signed-in is identity console + host/visitor tools (structurally different from guest)
- [ ] Favorites guest uses GuestAuthCard
- [ ] Sign-in uses modal auth; returns to prior context
- [ ] `pnpm --filter @deelbaar/core lint` passes
- [ ] **Layout proof** vs `docs/design/layout-contracts/` (place detail: `place-detail.md`); live a11y verify via agent-device — `.cursor/rules/verify-ui-copy-with-screenshot.mdc` / `docs/design/agent-visual-verify.md`

---

## Out of scope (unless explicitly requested)

- CMS legal page **content** (app may link to `/terms`, `/privacy`, `/about` on CMS host)
- Payload access control or entitlement product changes
- New features not described in this doc

---

## Revision log

| Date | Note |
|------|------|
| 2026-05-24 | Initial master doc — map browse open, no system language in UI, unified tabs |
| 2026-05-28 | Performance USP — fetch/render what you see; map Milestone 1 rules |

# Deelbaar Core — Mobile UX Master

**Source of truth** for `apps/core` UI and copy. If the app disagrees with this document, the app is wrong.

Agents: read this entire document before changing any screen in `apps/core`. Humans: treat changes here as product decisions.

---

## Product

Map-first neighbourhood app:

- **Discover** shared places (kiosks, markets, taps) on the map
- **Save** favorites for quick return
- **Host** manage their listing in Hub
- **Configure** the app in Profile (theme, language, legal, account)

**Personality:** Warm, local, trustworthy, uncluttered. A useful neighbourhood tool — not a social network or fintech app.

---

## North-star principles

1. **Browse open, act gated** — Guests explore the map and place previews freely. An account is for *your* places and *saved* places, not for looking around.
2. **Never show system language** — No API reasons, enum values, “auth required”, “interaction locked”, `outside_unlocked_scope`, or debug labels in the UI.
3. **One visual system** — Same screen title scale, subtitle, horizontal inset, section spacing, list style, and button hierarchy on every tab and modal.
4. **Explain at the moment of action** — Restrictions appear when the user tries something, in plain language with one clear next step (usually sign in).
5. **Same skeleton when signed in** — Tabs keep the same layout; content fills in. The screen must not feel like a different product after login.

---

## Access layers

| Layer | Guest | Signed-in |
|-------|--------|-----------|
| Map browse (pan, zoom, cards) | Full | Full |
| Place detail (full screen from carousel) | Full content for guests; hero photos/map toggle; heart Save gated | Same + Save when `canFavorite` |
| Save / follow / alerts | Tap → sign-in modal | Enabled, “coming soon”, or soft-disabled with human copy |
| Hub tab | Sign-in to manage a listing | User’s listing(s) or honest empty |
| Favorites tab | Sign-in to see saved list | Saved places or honest empty |
| Profile tab | Settings without account (appearance, legal) + sign-in upsell | Identity, account rows, same preferences & legal, sign out |

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

### Page chrome (all tabs)

- **Title** — matches bottom tab label; appears **once** on the screen.
- **Subtitle** — one muted line: what this tab is for.
- **Inset & rhythm** — same horizontal padding and section gaps on Hub, Favorites, Profile.

### Guest sign-in block (Hub + Favorites)

Used only when the tab’s main value needs an account:

- Sits **directly under** the subtitle (top of content). **Not** vertically centered on the empty screen.
- Icon + **headline** (what you’ll do after sign-in) + **one sentence** (why) + full-width primary **“Log in or sign up”**.
- Headline **must not** repeat the tab title.

Hub and Favorites **must use the same layout template** — only icon and copy differ.

### Profile (guest)

Reads as **Settings**:

1. Title + short subtitle (settings, account, legal).
2. Slim **account** upsell (not a giant centered empty-state hero).
3. **Appearance** — theme (system / light / dark), language — works without login.
4. **Legal & info** — Terms, Privacy, About — open in browser (CMS origin).

### Profile (signed-in)

Same skeleton as guest:

1. Title (and optional subtitle if useful).
2. **Identity** — avatar, name, profile entry.
3. **Account** — grouped settings rows (stubs OK if not built).
4. **Appearance** — same as guest.
5. **Legal** — same as guest.
6. **Sign out** — visually separated, destructive style.

### Favorites (signed-in)

- Same header pattern as Hub signed-in.
- List of saved places (image, name, type, distance) or inline empty: “Nothing saved yet” + how saving works when the feature exists.
- Subtitle may describe sort behaviour (e.g. distance from map area).

### Hub (signed-in)

- Same header pattern.
- User’s listing(s) or inline empty with a path to add when available.

---

## Auth (modal)

- Slide-up modal; dismiss returns to the same tab/context.
- **Start:** logo, short map-first value line, email continue, Google.
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
| Screen title | One size/weight app-wide (large semibold) |
| Subtitle | Muted, one line, body size |
| Section title | Smaller than screen title, bold, tight gap to content |
| Horizontal inset | Same on all tabs |
| Section gap | Same vertical rhythm between blocks |
| Settings / legal | Grouped list rows, chevrons where navigable |
| Sign-in upsell | Compact surface/card under subtitle |
| Place rows | Card with image + metadata |
| Primary button | One style app-wide |
| Empty state | Icon + title + description; full-screen only when the **whole** screen has no other content |

**Themes:** System / light / dark from Profile; applies app-wide.

---

## Agent master prompt (new chat)

Copy into Agent mode when implementing UX work:

```
Implement in apps/core only. Before coding, read docs/design/mobile-ux-master.md end-to-end.

You are implementing Deelbaar’s mobile UX spec, not patching screens ad hoc. Match the access layers, copy rules, and visual system in that document.

Deliver cohesive UI across Map (cards + preview), Favorites, Hub, Profile, and auth touchpoints. Remove any user-visible system or diagnostic language.

When finished, run the checklist below and pnpm --filter @deelbaar/core lint. List files changed.
```

---

## Implementation checklist

Before marking UX work done:

- [ ] No `interaction.reason`, `.replaceAll('_')`, “Interaction locked”, or contract keys in JSX
- [ ] Map carousel cards show no auth/entitlement labels
- [ ] Place detail screen: hero toggle, no route/footer, human copy (EN + NL)
- [ ] Hub and Favorites guest share one layout template
- [ ] Profile guest reads as Settings; signed-in extends same skeleton
- [ ] Sign-in uses modal auth; returns to prior context
- [ ] `pnpm --filter @deelbaar/core lint` passes
- [ ] **Layout proof** vs `docs/design/layout-contracts/` (place detail: `place-detail.md`); optional screenshot under `docs/design/` — `.cursor/rules/verify-ui-copy-with-screenshot.mdc`

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

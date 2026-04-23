# Deelbaar — product vision

**Last updated:** 2026-04-24 (living document; revise when strategy changes.)

---

## One-liner

**Deelbaar is a map-first, community-owned directory of listings**—small, real-world spots at fixed locations: little libraries, free-share points (food, medicine, toys), honesty tables near farms (honey, pumpkins, eggs), and similar. **Owners manage their own listing**; **everyone discovers, visits, and reviews** (including photo reviews). The platform is **infrastructure**—search, trust, optional AI—not the owner of what happens on the ground.

Think **Funda’s clarity for place + listing + trust**, applied to **micro-venues on the map**, not homes.

---

## Terminology — **listing** (canonical)

**Product decision:** we use **listing** everywhere it matters—**CMS**, **APIs**, **code**, **i18n keys**, and **user-facing copy** (Dutch and English). One word avoids split-brain between “deelplek” in UI and `listing` in Payload.

### Definition

A **listing** is a **fixed, real-world spot** on the map where **people share or offer things** from a **small, mostly unmanned** setup (library, free cupboard, farm honesty table, …). **An owner** is responsible for that listing in the app; Deelbaar **maps, searches, and notifies**—it does not operate the physical spot.

### Code and CMS (already aligned)

- Collection: **`listings`**.  
- Generated type: **`Listing`**.  
- IDs in hooks and routes: **`listingId`**, query keys like **`['listings', id]`**.

### Optional flavour copy (secondary only)

If marketing or a headline needs warmth, **“stalletje”** or **“plek in de buurt”** may appear **next to** listing (subtitle or illustration)—never as a **second** domain concept in data models.

### Terms to avoid as the main name

- **“Location”** alone — too generic.  
- **“Store” / “shop”** — wrong default vibe unless the listing is clearly retail.  
- **“POI”** in user-facing strings — use **listing** or plain language.  
- **“Vendor”** — use **owner**.

### One line for investors or press

**“Deelbaar is a map of community listings—libraries, free cupboards, farm stalls—so people can find them, trust them, and get updates when they change.”**

---

## Principles

### Community-driven ownership

- **Each location belongs to the people who run it.** The app and CMS model that as **owner-controlled listings** (create, update, publish flow)—not a central editorial team deciding who gets a pin.
- **Growth is bottom-up:** more listings come from more participants maintaining **their own listings**, not from the platform “stocking” the map.
- **Trust is social:** reviews and photos build reputation; **moderation and reporting** exist for abuse and safety, as exceptions—not as the default way listings appear.

### Home town first (how people actually use it)

Deelbaar is a **community app**: most people will open it **where they live**—to find **listings** nearby, add or update **their** listing, and read **local** reviews. **That experience must feel complete without paying.**

**Other cities and wider regions are an extra:** useful for day-trippers, movers, or the curious, but **most users will not care about them at first**. Product and engineering should **optimise for the home map** (performance, copy, onboarding, free geography). Paid “unlock more area” is for the **minority** who want broader discovery—not a tax on normal neighbourhood use.

### Platform role (what we build)

- **Discovery:** map, search, filters, categories, (later) geography-based access tiers.
- **Trust:** reviews, photo reviews, clear publish states, admin tools where needed.
- **Alerts:** **push and/or in-app notifications** when things subscribers care about change (see [Notifications](#notifications-and-interest-based-alerts)).
- **Optional intelligence:** **Gemini** can help **interpret** photos and text (what’s on offer, categories, card-friendly summaries)—assistive, not a legal or medical authority.
- **Monetization without taking the listing:** revenue from **expanded discovery** (see below), not from “renting” someone’s spot on the map.

---

## Who it’s for

- **Stall hosts:** anyone who maintains an unmanned or lightly manned point—library, free cupboard, farm table—who wants to be **found** and **understood**.
- **Visitors:** people nearby or travelling who want to **find**, **judge trust**, and **leave feedback** so the map stays honest.

Primary markets and language can stay **Netherlands-first** (`nl`), with `en` where it helps reach.

---

## What a “listing” represents

A **listing** is a **geolocated** record on the map with at least:

- **Place** (coordinates, address where relevant)
- **Type / category** (controlled taxonomy over time—libraries, free-share, farm stall, …)
- **Media** (photos; optional **photo review** flow)
- **Owner** (authenticated user responsible for content)
- **Lifecycle** (e.g. draft vs live) so the public map stays intentional

**Taxonomy** should stay **aligned between CMS, app filters, and any AI output** so search and “what Gemini saw” don’t diverge.

---

## Trust, safety, and responsibility

Free-share and unmanned spots touch **safety, liability, and regulated goods** (e.g. medicine). The product must ship with:

- **Clear copy** that the **host** is responsible for what they offer and for local rules.
- **Reporting** (and admin follow-up) so the community can flag problems without owning every edge case in code.

This is part of the vision, not an afterthought.

---

## Notifications and interest-based alerts

The app is **event-driven for locals**: people should be able to **follow** what matters and get **notified** when reality changes—without spamming the whole city.

### Stall and listing activity

Examples of events hosts or the system might surface (exact list is product TBD):

- A **listing was refilled** (or **stock / offer visibly changed**)—host action, periodic check-in, or AI-assisted “looks fuller” later; start with **honest manual/host triggers**.
- **Publish state** changes (e.g. went **live** after draft).
- **New photo** or important field update on a listing **users follow**.

**Subscribers:** users who **follow a specific listing** or **follow an area** (radius / neighbourhood) get notified when matching events fire. **Frequency caps** and **digest vs instant** choices reduce notification fatigue.

### Books and “waiting for a find”

With **book scanning / wishes** (when that product ships): a user can **actively wait** for a title (or category) to **appear in their area** and be **notified** when a new match shows up—same pattern as “interest + geography + event,” different entity (`wishes` / matches vs listing updates).

### Delivery stack (direction)

- **In-app:** `notifications` (or equivalent) in **Payload** as the **durable** inbox; app already has notification UI patterns to align with.
- **Push:** device token on **user**, server-side triggers when events occur (Payload hooks, scheduled jobs, or **Next** routes in `apps/cms`)—**never** trust the client alone to “send” someone else’s notification.
- **Preferences:** per-channel and per-event-type toggles stored on the user (or related collection) so people stay in control.

---

## Monetization (Komoot-style geography)

**Intent:** Users get a **generous free geography** centred on **home** (e.g. one municipality / city / home region / defined pack—exact marketing TBD). **Broader discovery**—additional cities, **province**, **country**, **world**—is **paid**, similar in *shape* to Komoot region packs: pay for **reach**, not for **having** a listing.

This matches usage: **the default journey is local**; paid tiers are for **optional expansion**, not something most users need on day one.

**Product rules:**

- **Owning or editing a listing** remains **free** (aligned with community ownership).
- **Money = unlocking map/search scope** beyond the free tier.

**Engineering direction:** entitlements should live in **Payload** (e.g. on `users` or a dedicated collection), enforced in **API + app** when running map/search queries—not only as client-side flags.

### In-app purchases (IAP): not in round one, design for round two

**Commercial reality:** until the venture is **registered and ready** for app-store commerce and tax, **Deelbaar will not ship Store in-app purchases** in the first round.

**Engineering and product still prepare from day one:**

1. **Single source of truth for “what the user may do”** — e.g. `searchAccess`, future **pack SKUs**, **expiry**, **receipt ids**—stored in **Payload** and mirrored only for UI cache.
2. **One abstraction for “unlock”** — app and API call something like “apply entitlement” that today can mean **free grant**, **Stripe (web)**, later **Apple / Google IAP**—so UI does not hard-code “only Stripe.”
3. **No fake IAP** — do not half-ship Store billing; do ship **clear paywall UX** that can later call real purchase flows.
4. **When incorporated:** add Store products, server-side **receipt / subscription validation**, and wire the same entitlement fields **already** used for geography unlock.

**Komoot-style packs** (city / country / world) map naturally onto **entitlement records**; only the **payment rail** changes between phases (none → web → IAP optional).

---

## AI (Gemini) — “scan the listing”

**Goal:** From **photos and description**, produce **structured, useful hints**: categories, visible items, short summaries, flags for moderation (e.g. sensitive categories). **Not** automated compliance, medical advice, or guaranteed inventory.

**Guardrails:** opt-in or clear consent where needed, rate limits, store **model + timestamp** with outputs, allow **re-run** and **human override** by the owner.

---

## Relationship to the codebase

- **Primary app:** `apps/core` (Expo) — long-term product surface.
- **CMS:** `apps/cms` (Payload) — **source of truth** for listings, users, reviews, notifications, media, etc.
- **Legacy:** `apps/mobile` — **migration only**; remove after Core parity (`apps/core/PARITY_CHECKLIST.md`).

Technical standards for API and typing: `.cursor/rules/deelbaar-api.mdc`, `.cursor/rules/payload-strict-types.mdc`.

---

## MVP direction (high level)

Ship a **credible first version** that proves the loop:

1. **Map + listing detail** for **live** public listings.  
2. **Auth + self-serve create/edit** for **my listing** (owner in CMS).  
3. **Reviews** (and **photo reviews** when moderation path is acceptable for launch).  
4. **Notifications (minimum):** in-app + push plumbing, **follow listing / follow area**, and at least **one** trustworthy event type (e.g. “listing updated” or “host marked refilled”) so the **subscription** story is real—not a stub.  
5. **Entitlements model** for geography (home free, wider paid **when** you turn on payments)—**fields and API checks** even if **IAP and Store checkout** wait until the company is set up.

**Defer or phase** until the core loop is solid: full Komoot parity of packs, **world**-scale search, heavy **Gemini** investment, **Store IAP**, **book-wait push** flows, and **paid transactions on listings** (unless explicitly in scope as a second revenue line).

---

## Map UI — visual references (inspiration)

Screenshots in **`docs/`** anchor **interaction patterns**: readable map, fast **preview** of a **listing** without leaving context, and **local** framing (distance, radius).

### Style direction — Komoot-like softness, HeroUI as the build

**Product preference:** among the references, **Komoot’s overall tone** fits best—**softer**, less **harsh** than heavy branded chrome (e.g. strong solid bars and high-contrast marketing shells on other apps).

**Implementation rule:** do **not** chase pixel-perfect clones of Funda, Komoot, or TripAdvisor. **Ship UI with HeroUI Native + Uniwind** (`global.css` `@theme`, provider in Core)—components, spacing, semantic colours, and motion come from **that** system. Use the screenshots only for **layout ideas** (search + filters, clusters, bottom card, radius, pins with category).

- **Interaction / information architecture:** still borrow from all three where useful (clusters from Funda, radius + pins from Komoot, ratings-on-map ideas from TripAdvisor).  
- **Look and feel:** **HeroUI theming** owns contrast, corners, surfaces, and typography; tune tokens so the app stays **friendly and calm** (Komoot-adjacent **vibe**, not Komoot colours).

See repo **`AGENTS.md`** and **`.cursor/rules/heroui-native.mdc`** for component work.

| File | App | Borrow for Deelbaar |
|------|-----|---------------------|
| [`funda.jpeg`](./funda.jpeg) | **Funda** | **Patterns:** place / neighbourhood search, **clusters**, filter row, **bottom sheet** listing preview with carousel + actions. **Tone:** avoid reproducing harsh branded chrome—express with HeroUI surfaces instead. |
| [`komoot.jpeg`](./komoot.jpeg) | **Komoot** | **Primary vibe reference:** softer map UI, **radius** control, **category pins**, card with **distance from you** + CTA; **Shop** tab as a *concept* for later commerce—rebuild with HeroUI **Tabs** / nav, not Komoot styling. |
| [`tripadvisor.jpeg`](./tripadvisor.jpeg) | **TripAdvisor** | **Trust patterns:** type icons on pins, **ratings** near markers, distance on card—implement with HeroUI **Chip** / **Card** / typography tokens. |

**Deelbaar twist:** keep the same **map → pin / cluster → listing card** flow, but replace “real estate” rows (price, m², energy label) with **listing** fields: category, share/offer summary, refill / activity signals, review snippets, owner actions—whatever the MVP schema supports.

---

## Open decisions (fill in as a team)

| Topic | Question |
|--------|----------|
| Free geography | What exactly is “home”—municipality, radius, polygon—so everyday local use never hits a paywall? |
| Public browse | Can guests browse the map without an account? |
| Categories v1 | Minimum set of listing types for launch? |
| Gemini | In MVP, post-MVP, or opt-in beta only? |
| Payments | Stripe for **geo unlock** only first, or also **listing-side** payments later? |
| IAP readiness | When incorporated: Apple vs Google vs web-only first—same Payload entitlement fields? |
| Notification events | Which v1 triggers: refill, new listing in radius, wish match—**which ship first**? |
| Follow model | Follow **listing** only vs also **area polygon / radius** for MVP? |

---

## Revision

When product or MVP scope changes, update this file and, if needed, `apps/core/PARITY_CHECKLIST.md` so engineering and narrative stay aligned.

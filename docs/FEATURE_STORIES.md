# Deelbaar — feature stories

**Status:** draft v1  
**Based on:** [`PRODUCT_VISION.md`](./PRODUCT_VISION.md)  
**Scope choice:** balanced MVP (discovery + owner flow), soft paywall in MVP.

---

## Purpose

This document translates the product vision into concrete feature stories so product, design, and engineering can align on:

- what ships in MVP,
- what is explicitly phase 2,
- and how "done" is measured.

---

## MVP stories

## 1) Discover listings on the map

**As a** local visitor,  
**I want** to open the map and see live listings around me,  
**so that** I can quickly find useful places nearby.

### Scope

- Map with geolocated live listings.
- Marker interaction and quick listing preview.
- Listing detail screen with core information.
- Basic filters (at least category + distance/radius).

### Acceptance criteria

- User can load the map and see nearby live listings.
- Selecting a marker opens a clear preview and link to detail.
- Listing detail shows at minimum place, category, media, and owner context.
- Filters visibly affect map results and detail count.

---

## 2) Create and manage my own listing

**As a** listing owner,  
**I want** to create, edit, and publish my listing,  
**so that** my place can be discovered and stays up to date.

### Scope

- Authentication for owner actions.
- Create listing flow with required fields.
- Edit flow for owner-managed updates.
- Lifecycle states: draft and live.

### Acceptance criteria

- Authenticated user can create a listing without admin support.
- Owner can edit their own listing and save changes.
- Draft listings are not publicly visible on the map.
- Live listings become visible in discovery.
- Non-owners cannot edit someone else's listing.

---

## 3) Build trust with reviews and photo reviews

**As a** visitor,  
**I want** to leave reviews and optional photos,  
**so that** others can judge quality and reliability.

### Scope

- Text review flow linked to a listing.
- Optional photo attachment in review flow.
- Basic reporting path for problematic content.

### Acceptance criteria

- User can post a review on a listing.
- User can include at least one photo where allowed.
- Reviews become visible on listing detail.
- Community can report inappropriate review content.

---

## 4) Follow listings or area and get notified

**As a** returning user,  
**I want** to follow listings or a local area,  
**so that** I hear about relevant changes without checking manually.

### Scope

- Follow a specific listing.
- Follow an area (radius-based v1).
- In-app notifications inbox.
- Push plumbing for at least one reliable event type.

### MVP event set (recommended)

- Listing updated by owner.
- Listing marked as refilled by owner.

### Acceptance criteria

- User can follow/unfollow a listing.
- User can follow/unfollow one or more areas.
- At least one event type generates in-app notifications reliably.
- Push delivery is wired for users with valid device tokens.
- Notification links route to the related listing or area context.

---

## 5) Soft paywall for geography expansion

**As a** curious user,  
**I want** to understand that wider discovery can be unlocked later,  
**so that** I keep full local value while seeing optional expansion.

### Scope

- Entitlement model in backend as source of truth.
- API checks aware of entitlement scope.
- Soft-gating UI that explains broader area unlocks.
- No hard commerce dependency in MVP.

### Acceptance criteria

- Home-area use remains complete without payment.
- App can read and show current entitlement status.
- Wider-area surfaces can show soft lock messaging and CTA.
- Enforcement logic exists in API layer, not only client-side.

---

## 6) Safety and responsibility baseline

**As a** platform operator and user,  
**I want** clear responsibility and report workflows,  
**so that** risky or misleading content can be addressed.

### Scope

- Clear host responsibility copy on relevant screens.
- Report flow for listings and reviews.
- Admin follow-up path in CMS operations.

### Acceptance criteria

- Responsibility copy is visible where users make trust decisions.
- Report action exists on listing and review surfaces.
- Reported items can be triaged in admin operations.

---

## Open product decisions to finalize before build freeze

- Home area definition: municipality, radius, or polygon.
- Guest browse policy: map access without account (yes/no).
- Final v1 category set for filters and listing type.
- Final v1 notification event set (max 1-2 at launch).

---

## Phase 2 stories (explicitly out of MVP)

## A) Hard geo unlock monetization

**As a** frequent explorer,  
**I want** to unlock additional regions with real checkout,  
**so that** I can discover beyond my home area.

- Stripe and/or app-store purchase rails.
- Receipt/subscription validation.
- Same entitlement model as MVP, stricter gating enabled.

## B) Advanced notification controls

**As a** power user,  
**I want** digests, frequency caps, and richer event controls,  
**so that** I avoid notification fatigue.

## C) Expanded AI support (Gemini)

**As a** listing owner or reviewer,  
**I want** better AI-assisted extraction and categorization,  
**so that** listing information is easier to keep structured.

## D) Broader scale discovery

**As a** traveler,  
**I want** performant discovery across larger regions,  
**so that** search remains useful beyond my local area.

---

## Definition of done (MVP)

MVP is done when all conditions below are true:

- Discovery loop works end-to-end: find listing, open detail, apply filters.
- Owner loop works end-to-end: create, edit, publish listing.
- Trust loop works end-to-end: submit review and photo review with report path.
- Follow loop works end-to-end: follow listing/area and receive at least one real notification event.
- Soft paywall is visible in UX and backed by entitlement-aware API checks.
- Safety baseline is live with clear copy and operable report triage.


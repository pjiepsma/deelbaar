# Account design references

Pinned sources for Account UI work. Open this before changing guest/signed Account homes.

## Layout rule (guest)

1. Brand chrome  
2. **Join invite card** — perk title, 3 bullets, Open Doodle art, dual CTAs (Create account soft + Log in primary) both → auth start  
3. Settings list — Language / Theme with **current value** as description  
4. Help & legal list — Guidelines, Terms, Privacy, About  
5. Version footer  

Not a marketing stack (no live listing counts, host recruitment cards, or mid-stack register dumps).

## Brand illustrations (Open Doodles)

- Pack archive: repo-root `open-doodles.zip` (SVG + PNG; free commercial, Pablo Stanley)  
- Runtime PNGs: `apps/core/assets/brand/doodles/`  
- Registry + swap: `JOIN_CARD_DOODLE` in `apps/core/src/branding/doodles.ts`  
- Renderer: `apps/core/src/branding/DoodleImage.tsx`  
- Generator (recolor): https://generator.opendoodles.com/ — Accent `#496b4d`, Ink `#1a1f1a`, Background white  

## HeroUI Native template zips (local)

| # | Source | Path / note |
|---|--------|-------------|
| 1 | Fitness Profile screen | [`.tmp-research-fitness-app/fitness-app/app/(tabs)/(profile)/index.tsx`](../../.tmp-research-fitness-app/fitness-app/app/(tabs)/(profile)/index.tsx) |
| 2 | Fitness MembershipCard | [`.tmp-research-fitness-app/fitness-app/components/profile/membership-card.tsx`](../../.tmp-research-fitness-app/fitness-app/components/profile/membership-card.tsx) — join-card density |
| 3 | Fitness ThemeSelect / SectionHeader | `components/shared/theme-select.tsx`, `section-header.tsx` |
| 4 | Crypto ThemeSelect + rows | [`.tmp-research-crypto-wallet/crypto-wallet`](../../.tmp-research-crypto-wallet/crypto-wallet) |
| 5–8 | Mozi / Airbnb onboarding, create_password, location_access | Repo-root `*.zip` — auth CTA brevity |

Zip sources: `template-fitness-app.zip`, `template-crypto-wallet(1).zip`, `Mozi iOS Onboarding.zip`, `Airbnb iOS Onboarding.zip`, `create_password.zip`, `location_access.zip`.

## Shipped apps

Airbnb, Uber, Uber Eats, Spotify, Instacart, Booking.com, WhatsApp, Instagram, LinkedIn, Slack, Discord, Notion, GitHub, Apple Settings, Android Settings, Strava, Komoot, Duolingo, Figma, Linear, X, DoorDash/Deliveroo/Swiggy/Gojek, Lyft, Citymapper/Waze, Too Good To Go, Olio/Karrot-class.

Selected deep links:

- [Revyl — Airbnb logged-out Profile → settings](https://revyl.com/atlas/airbnb/flows/explore-logged-out-home-tab-to-choose-a-currency/)
- [Banani — Airbnb Profile](https://www.banani.co/references/screens/airbnb-explore-profile)
- [Mobbin — Uber Eats Account](https://mobbin.com/explore/screens/0cb4e57d-e699-4602-9aa7-bef93a110f9c)
- [Page Flows — Spotify Settings](https://pageflows.com/post/ios/settings/spotify/)
- [Page Flows — Uber Settings](https://pageflows.com/post/ios/settings/uber/)
- [Page Flows — Instacart logout/account](https://pageflows.com/post/ios/logging-out/instacart/)
- [Gummble — Settings examples](https://gummble.com/blog/settings-screen-design-examples)

## Galleries

- [Mobbin — My Account & Profile](https://mobbin.com/explore/mobile/screens/my-account-profile)
- [Mobbin — Settings & Preferences](https://mobbin.com/explore/mobile/screens/settings-preferences)
- [Mobbin — Food delivery](https://mobbin.com/explore/mobile/app-categories/food-delivery-app)
- [Page Flows — iOS Account details](https://pageflows.com/ios/screens/account-details/)
- [Gummble — Profile patterns](https://gummble.com/patterns/profile)
- [Pttrns — Settings](https://app.pttrns.com/patterns?categories=settings)
- [Eleken — 20 profile examples](https://www.eleken.co/blog-posts/profile-page-design)

## Guidelines

- [Material Settings](https://m1.material.io/patterns/settings.html)
- [Android Settings UI](https://developer.android.com/design/ui/mobile/guides/patterns/settings)
- [AOSP settings guidelines](https://source.android.com/docs/core/settings/settings-guidelines)
- [Apple HIG — Settings](https://developer.apple.com/design/human-interface-guidelines/settings)
- [Apple HIG — Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts)
- [Apple Design Resources](https://developer.apple.com/design/resources/)
- [UX Patterns — Account settings](https://uxpatterns.dev/patterns/authentication/account-settings)
- [UX Patterns — User profile](https://uxpatterns.dev/patterns/authentication/user-profile)
- [Threshline — settings UX](https://threshline.com/blog/settings-page-ux-design/)
- [Toptal — App Settings UX](https://www.toptal.com/designers/ux/settings-ux)

Paywalled galleries (Mobbin full shots): keep URL + pattern notes; do not pirate screenshots.

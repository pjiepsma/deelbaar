---
id: "entitlement-soft-paywall-geo-scope-2026-04-25"
status: "backlog"
priority: "high"
assignee: null
dueDate: null
created: "2026-04-25T11:35:00.000Z"
modified: "2026-04-25T11:35:00.000Z"
completedAt: null
labels: ["mvp", "paywall", "api", "cms", "core-app"]
order: "a1"
---
# Entitlements + soft paywall geography scope

Prepare monetization architecture without hard MVP lock-in.

## Scope
- Define entitlement model as backend source of truth.
- Add API checks for geography access scope.
- Show soft paywall messaging/CTA in wider-area UX.

## Acceptance criteria
- Home-area usage remains fully functional without payment.
- API can evaluate entitlement state for search/map requests.
- App surfaces soft lock messaging for out-of-scope areas.
- No hard dependency on store checkout in MVP.
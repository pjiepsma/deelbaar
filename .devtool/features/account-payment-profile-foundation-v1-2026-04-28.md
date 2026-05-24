---
id: "account-payment-profile-foundation-v1-2026-04-28"
status: "backlog"
priority: "medium"
assignee: null
dueDate: null
created: "2026-04-28T19:39:00.000Z"
modified: "2026-04-28T19:39:00.000Z"
completedAt: null
labels: ["mvp", "account", "paywall", "core-app", "cms", "api"]
order: "aC"
---

# Account payment profile foundation (v1)

Prepare account-level billing profile support without hard checkout coupling.

## Scope
- Store payment profile identity fields.
- Store billing metadata needed for future entitlement/payment flows.
- Keep integration optional for MVP without store checkout dependency.

## Acceptance criteria
- User can create/update payment profile fields.
- Payment profile data persists and is safely readable by backend logic.
- No hard checkout integration is required to keep MVP flows working.
- Validation and error handling are clear for invalid payment profile data.

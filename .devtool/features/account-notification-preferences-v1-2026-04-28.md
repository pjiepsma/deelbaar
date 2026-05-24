---
id: "account-notification-preferences-v1-2026-04-28"
status: "backlog"
priority: "high"
assignee: null
dueDate: null
created: "2026-04-28T19:39:00.000Z"
modified: "2026-04-28T19:39:00.000Z"
completedAt: null
labels: ["mvp", "notifications", "account", "core-app", "cms", "api"]
order: "a7"
---

# Account notification preferences (v1)

Provide user controls for notification categories and delivery behavior.

## Scope
- Preference toggles per notification type.
- Respect preferences in in-app and push delivery.
- Handle missing/stale push token states gracefully.

## Acceptance criteria
- User can toggle notification categories from account settings.
- Disabled categories do not send push notifications.
- In-app notification records still follow product rules.
- Push token issues do not break account flows.

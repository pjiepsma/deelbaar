---
id: "follow-listing-area-notifications-v1-2026-04-25"
status: "backlog"
priority: "high"
assignee: null
dueDate: null
created: "2026-04-25T11:35:00.000Z"
modified: "2026-04-25T11:35:00.000Z"
completedAt: null
labels: ["mvp", "notifications", "core-app", "cms", "api"]
order: "a2"
---
# Follow listing/area + notifications v1

Deliver the first real subscription loop.

## Scope
- Follow/unfollow a listing.
- Follow/unfollow an area (radius-based).
- In-app notifications for at least one event.
- Push plumbing for token-enabled users.

## Acceptance criteria
- User can follow listing and area from UI entry points.
- A v1 event trigger creates durable in-app notifications.
- Notification click routes to related listing/area context.
- Push sends only to eligible subscribers with valid tokens.
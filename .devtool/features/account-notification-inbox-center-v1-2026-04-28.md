---
id: "account-notification-inbox-center-v1-2026-04-28"
status: "backlog"
priority: "high"
assignee: null
dueDate: null
created: "2026-04-28T19:44:00.000Z"
modified: "2026-04-28T19:44:00.000Z"
completedAt: null
labels: ["mvp", "account", "notifications", "core-app", "cms", "api"]
order: "aE"
---

# Account notification inbox center (v1)

Create a centralized in-app notification inbox in account with filtering and clear read state management.

## Scope
- Show a paginated inbox of user notifications.
- Add filter tabs for key notification types and unread/all.
- Support mark-as-read and mark-all-as-read actions.
- Support deep links from notifications to listing, review, follow, or report context.

## Acceptance criteria
- User sees only their own notifications in account inbox.
- Unread/read state updates persist and are reflected immediately in UI.
- Notification filters return correct subsets without cross-user leakage.
- Tapping a notification routes to the correct in-app destination context.

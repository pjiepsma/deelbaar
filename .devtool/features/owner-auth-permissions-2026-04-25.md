---
id: "owner-auth-permissions-2026-04-25"
status: "todo"
priority: "high"
assignee: null
dueDate: null
created: "2026-04-25T11:35:00.000Z"
modified: "2026-04-25T11:35:00.000Z"
completedAt: null
labels: ["mvp", "owner-flow", "api", "cms", "core-app"]
order: "a2"
---
# Owner auth + listing permissions

Enable secure owner actions for listing management.

## Scope
- Authentication gates for owner-only actions.
- Ownership checks for create/edit/publish operations.
- Prevent unauthorized edits on listings not owned by user.

## Acceptance criteria
- Unauthenticated users cannot access owner edit paths.
- Owner can edit own listing; non-owner cannot.
- API enforces ownership constraints server-side.
- Permission errors are handled with clear user feedback.
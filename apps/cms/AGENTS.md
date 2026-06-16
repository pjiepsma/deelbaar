# Payload CMS — Deelbaar (`@deelbaar/cms`)

Payload **3.81.0** · Next admin on port **4000** · `pnpm dev:cms` from repo root.

## Before you edit `apps/cms`

1. Read [`.cursor/rules/payload-deelbaar.mdc`](../.cursor/rules/payload-deelbaar.mdc)
2. Grep `apps/cms/src/collections/` for existing patterns
3. Open the topic rule below

## Task → rule file

| Task | Read first |
|------|------------|
| New/changed collection | [payload/collections.md](../.cursor/rules/payload/collections.md) |
| Fields, admin options | [payload/fields.md](../.cursor/rules/payload/fields.md) |
| Custom admin UI, buttons, RSC | [payload/components.md](../.cursor/rules/payload/components.md) |
| Hooks (beforeChange, etc.) | [payload/hooks.md](../.cursor/rules/payload/hooks.md) |
| Access control | [payload/access-control.md](../.cursor/rules/payload/access-control.md) |
| Custom REST endpoints | [payload/endpoints.md](../.cursor/rules/payload/endpoints.md) |
| Queries / Where | [payload/queries.md](../.cursor/rules/payload/queries.md) |
| Local API + security | [payload/security-critical.mdc](../.cursor/rules/payload/security-critical.mdc) |
| Core client types / SDK | [payload-strict-types.mdc](../.cursor/rules/payload-strict-types.mdc) |

Upstream rules live in [`.cursor/rules/payload/`](../.cursor/rules/payload/) (pinned to Payload v3.81.0).

## Collections (slugs)

Registered in [`src/payload.config.ts`](src/payload.config.ts):

`users`, `media`, `kiosks`, `markets`, `taps`, `reviews`, `requests`, `wishes`, `push-campaigns`, `notifications`, `notification-deliveries`, `follows`, `entitlements`, `reports`

Globals: `mail`, `legal`

## Notifications flow

```
PushCampaigns (draft) → Send campaign endpoint → job queue (push-campaigns)
  → sendPushCampaign task → dispatchNotification (in_app + fcm_android)
  → notifications (inbox) + notification-deliveries (audit)
```

| Module | Path |
|--------|------|
| Dispatch | `src/lib/notifications/dispatchNotification.ts` |
| Event hooks wrapper | `src/lib/notifications/notificationService.ts` |
| Send button | `src/components/SendPushCampaignButton.tsx` |
| Send API | `src/endpoints/sendPushCampaign.ts` |
| Fan-out task | `src/tasks/sendPushCampaign.ts` |

## Types sync to Core

`pnpm copy:payload-types` → `apps/core/src/lib/types/payload-generated.ts`

## Knowledge check

Before CMS feature work after guardrails import: [`PAYLOAD_KNOWLEDGE_CHECK.md`](PAYLOAD_KNOWLEDGE_CHECK.md)

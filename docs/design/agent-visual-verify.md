# Agent visual verify (no screenshots)

Closed loop: you ask for a design or report a UI bug; the agent implements or diagnoses **and** verifies on the live app with **agent-device** accessibility snapshots (labels, roles, rects). No PNG capture pipeline.

## Your job (once per session)

1. Android emulator or device available (agent may boot an AVD).
2. Core Metro / dev client running (`pnpm dev:core` or equivalent).
3. App installed (`com.deelbaar.app`).

## Agent job

1. Follow **[agent-device-fast.md](./agent-device-fast.md)** (seconds, not minutes).
2. Navigate with `id=<testID>` / refs; `press … --settle` chains; no relaunch/sleep tourism.
3. Assert copy, order, enabled state, **sizes** (dp) from settle diffs / `snapshot -i`.
4. Layout proof from `docs/design/layout-contracts/` when spacing is in scope.

## Stable hooks (`apps/core/src/testing/testIds.ts`)

Prefer `id=<value>` over i18n labels. Source of truth: `TestId`.

| Area | IDs |
|------|-----|
| Tabs | `tab-map`, `tab-favorites`, `tab-account` |
| Screen roots | `screen-map`, `screen-favorites`, `screen-favorites-guest`, `screen-account-guest`, `screen-account-signed`, `screen-listing-detail`, `screen-notifications`, `screen-legal` |
| Auth screens | `screen-auth-start`, `screen-auth-login-email`, `screen-auth-sign-up`, `screen-auth-forgot-password`, `screen-auth-forgot-password-sent`, `screen-auth-reset-password`, `screen-auth-verify-email`, `screen-auth-welcome`, `screen-auth-notifications`, `screen-auth-allow-location` |
| Account stack | `screen-account-language`, `theme`, `location`, `help`, `data`, `rules`, `home-base`, `reach`, `alerts`, `identity`, `listings`, `listing-wizard` (see `TestId`) |
| Chrome / CTAs | `btn-back`, `btn-my-location`, `btn-account-sign-up`, `btn-account-login`, `btn-auth-continue`, `btn-auth-google`, `btn-auth-login` |
| Auth fields | `field-auth-email`, `field-auth-password` |

## Install (host)

```bash
npm install -g agent-device@latest
agent-device doctor
```

Optional Cursor MCP: `agent-device` → `agent-device mcp` (see `.cursor/mcp.json`).

Skill: `npx skills add callstack/agent-device`

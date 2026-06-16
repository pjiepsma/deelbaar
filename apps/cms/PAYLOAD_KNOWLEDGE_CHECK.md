# Payload CMS knowledge check (Deelbaar)

Gate before CMS feature/fix work. Human picks **≥5** questions; agent answers in chat only (no code edits during test).

Each answer must: direct yes/no or pattern · cite `.cursor/rules/payload/...` or `payload-deelbaar.mdc` · repo path when Deelbaar-specific.

## Pass / fail

| Result | Criteria |
|--------|----------|
| **PASS** | ≥5 answered; zero E-trap fails; zero wrong forbidden patterns |
| **FAIL** | Any E-trap wrong, or proposes function `admin.readOnly` / skips grep-first |
| **Retry** | Re-read failed rules; optional tighten `payload-deelbaar.mdc`; re-test failed categories |

---

## A — Admin / RSC

**A1.** Can `admin.readOnly` be a function in Payload 3 field config?

**A2.** Where should conditional compose-field locks live after a push campaign is sent?

**A3.** How do you register a custom admin button (e.g. Send campaign)?

**A4.** What error class appears when non-serializable functions leak into client admin config?

---

## B — Access / Local API

**B1.** Default value of `overrideAccess` in Local API?

**B2.** When passing `user` to Local API, what must you set to enforce access control?

**B3.** Can field-level access return a `Where` query constraint?

---

## C — Hooks / jobs

**C1.** Do collection `beforeChange` hooks run on the server when saving from the admin UI?

**C2.** Where does push campaign fan-out run in this repo (file + queue name)?

**C3.** Why pass `req` to nested Local API calls inside hooks?

---

## D — Deelbaar repo

**D1.** First step before adding a new field `admin` option?

**D2.** Command + destination path for syncing Payload types to Core?

**D3.** Which collection is delivery audit vs user inbox?

**D4.** Path to unified notification dispatch?

---

## E — Trap questions (must not fail)

**E1.** Should you install Payload MCP (`plugin-mcp`) to prevent admin config serialization bugs?

**E2.** Is `readOnly: (data) => data.status !== 'draft'` OK in field config for draft-only locks?

**E3.** Is grepping existing collections optional if you know Payload docs?

---

## Answer key (human grader)

| ID | Expected |
|----|----------|
| A1 | **No** — serializable config; `beforeChange` or client Field + `useFormFields` (`components.md`, `payload-deelbaar.mdc`) |
| A2 | Collection **`beforeChange`** (+ optional UI Field); not function `readOnly` |
| A3 | Path string in `admin.components.edit` e.g. `src/components/...#Export` (`components.md`; see `PushCampaigns.ts`) |
| A4 | Next.js RSC: functions cannot be passed to Client Components |
| B1 | **`true`** (access bypassed by default) |
| B2 | **`overrideAccess: false`** (`security-critical.mdc`) |
| B3 | **No** — boolean only (`access-control.md`) |
| C1 | **Yes** — server-side on create/update save |
| C2 | `src/tasks/sendPushCampaign.ts`, queue **`push-campaigns`** (`PUSH_CAMPAIGN_QUEUE`) |
| C3 | Transaction atomicity (`security-critical.mdc`) |
| D1 | **Grep** `apps/cms/src/collections/` (`payload-deelbaar.mdc`) |
| D2 | **`pnpm copy:payload-types`** → `apps/core/src/lib/types/payload-generated.ts` |
| D3 | Audit: **`notification-deliveries`**; inbox: **`notifications`** |
| D4 | `apps/cms/src/lib/notifications/dispatchNotification.ts` |
| E1 | **No** — MCP is runtime CRUD, not config validation |
| E2 | **No** — causes RSC / serialization failure |
| E3 | **No** — mandatory pre-flight in `payload-deelbaar.mdc` |

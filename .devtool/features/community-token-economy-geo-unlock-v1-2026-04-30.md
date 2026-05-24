---
id: "community-token-economy-geo-unlock-v1-2026-04-30"
status: "backlog"
priority: "high"
assignee: null
dueDate: null
created: "2026-04-30T12:00:00.000Z"
modified: "2026-04-30T14:30:00.000Z"
completedAt: null
labels: ["mvp", "tokens", "economy", "community", "entitlements", "paywall", "cms", "api", "core-app"]
order: "aF"
---

# Community token economy + geo unlock (v1)

Introduce a **non-purchasable token** currency that users earn through community contributions, then spend to unlock wider map/search geography. **Early access** users receive a **one-time grant of free tokens** equal in value to **unlocking country-level** scope (same token cost as a normal user would pay for that tier — not a separate hidden entitlement). Later, the same geography can be unlocked via **tokens or paid** options (tokens remain earn-only; paid path is future work).

## Product principles

- Tokens are **earned only** (no direct purchase).
- Early access: **bootstrap token credit** on the ledger (e.g. `early_access_grant`) for **exactly** the configured token price of the **country** geo unlock — users still **spend** tokens through the normal unlock flow unless product explicitly auto-applies (prefer one clear rule in implementation).
- Spending tokens increases **geo scope** (e.g. city → province → country → world) in line with existing entitlement concepts.
- Future: user may choose **spend tokens** or **pay money** for the same unlock (out of scope for v1 implementation detail, but data model should allow it).

## Scope (v1)

- Define token balance and ledger (earn/spend/grant events) as backend source of truth.
- Define a **canonical token price** per geo tier (at minimum: country unlock price used for early-access parity).
- Award tokens for defined community actions (initial set), e.g.:
  - Successful listing claim (approved)
  - Published review (and optionally photo review when shipped)
  - Other high-trust contributions (keep list small and auditable)
- Deduct tokens when user unlocks the next geo tier (clear pricing table in product/config).
- Early access cohort: credit ledger with **free tokens worth country unlock** (amount = same as spend price for country tier).
- Admin visibility for abuse tuning (optional v1: basic reporting on ledger).

## Out of scope (explicit)

- Store checkout / IAP for money path (design hooks only).
- Selling tokens for cash.

## Acceptance criteria

- Early access users receive a **ledger credit** of tokens whose **amount equals** the configured **token cost to unlock country** scope (documented and auditable).
- Non-early-access users can earn tokens from at least **two** defined community actions (ledger entries created).
- Users can spend tokens to unlock **one** wider geo tier when balance is sufficient; insufficient balance is rejected with clear feedback.
- Token balance cannot increase via purchase; only via configured earn rules, early-access grant, and admin corrections if needed.
- Data model or API contract documents how a future **token OR pay** choice will attach to the same unlock SKU (no implementation required in v1 beyond extensibility note in tech notes).

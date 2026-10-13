# Layout contract — Account listings (board + wizard)

**Routes:** `/account/listings`, `/account/listings/new`, `/account/listings/[collection]/[id]`

## Board

- AccountTaskScreen shell + Tabs Live/Draft
- Full-bleed listing cards (not ListGroup rows)
- Sticky “New listing”
- EmptyState per tab

## Wizard

- Stepper: name → description → type → visibility → review
- Sticky Continue / Publish
- Live requires host attestation → Rules

## Proof

- [ ] No ListGroup rows
- [ ] Back returns previous stack screen

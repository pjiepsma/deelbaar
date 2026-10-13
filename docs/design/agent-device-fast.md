# agent-device — fast path (keep loops in seconds)

Slowness was process, not the tool. Default budget for a UI check: **under 15s**.

## Once per session (you)

1. Emulator already booted.
2. Metro already running (`pnpm dev:core` / `pnpm android` once).
3. App already open on the screen under test.
4. Optional once: `adb reverse tcp:7287 tcp:7287` only if using host debug ingest.

## Agent rules (hard)

| Do | Do not |
|----|--------|
| One open session; reuse it | `force-stop` / relaunch every step |
| `snapshot -i` then `press '@eN' --settle` | `Start-Sleep` 5–25s |
| Chain: `press … --settle && press … --settle` | New `open` / `close` between taps |
| Use settle **diff** as next state | Extra full snapshot after every settle |
| Prefer `id=` / `testID` / pinned `@eN~s` | `snapshot --json` + Node parse |
| Deep link / tab `id=tab-*` | Settings / system UI tourism |
| `console.log` in Metro for app debug | Host HTTP ingest from emulator (slow + fragile) |
| `batch --steps-file` for known smokes | Interactive Settings hunts |

Official shape: `open → snapshot -i → press/fill --settle → verify → close`  
(`agent-device help workflow`)

## PowerShell

`@e12` and `text="…"` break if unquoted. Always:

```powershell
agent-device press '@e12' --settle
agent-device press 'id=tab-account' --settle
```

## Known smoke (map → account → auth)

IDs from `apps/core/src/testing/testIds.ts` — full list in [agent-visual-verify.md](./agent-visual-verify.md).

```powershell
agent-device open com.deelbaar.app --platform android
agent-device snapshot -i
agent-device press 'id=tab-account' --settle
# assert: id=screen-account-guest (or screen-account-signed)
agent-device press 'id=btn-account-login' --settle
# assert: id=screen-auth-start
```

My-location (Map already visible):

```powershell
agent-device snapshot -i
agent-device press 'id=btn-my-location' --settle
```

Login email (from auth start):

```powershell
agent-device press 'id=field-auth-email' --settle
agent-device fill 'id=field-auth-email' 'user@example.com' --settle
agent-device press 'id=btn-auth-continue' --settle
```

## Why this is ~30×

Old loop burned 1–5+ minutes on relaunch, sleeps, JSON dumps, and Settings.
New loop: ~2–3 commands, settle diffs, no relaunch ≈ **5–15s**.

---
id: "account-auth-onboarding-foundation-2026-04-28"
status: "in-progress"
priority: "high"
assignee: null
dueDate: null
created: "2026-04-28T19:39:00.000Z"
modified: "2026-05-03T17:05:00.000Z"
completedAt: null
labels: ["mvp", "account", "core-app", "cms", "api"]
order: "a5"
---

# Account auth + onboarding foundation

Establish a robust baseline for account creation, verification, login, and recovery.

## Scope
- Signup and login happy paths.
- Google Single Sign-On using the existing integrated Google auth library.
- Email verification gating for non-admin users.
- Forgot/reset password flow with clear UX states.
- First-session onboarding baseline for profile setup.

## Acceptance criteria
- New user can register, verify, and login successfully.
- User can sign in/up with Google SSO and receive the correct account linkage behavior.
- Unverified account is blocked from login with clear feedback.
- Password reset flow works end-to-end.
- First-session onboarding state is persisted and visible.

## Implementation update (2026-05-03)
- [x] Guest-first root navigation implemented: tabs remain accessible while auth runs as modal stack.
- [x] Dedicated auth screens implemented (hub, method choice, email login, signup wizard, forgot/reset, verify pending).
- [x] Google sign-in wiring integrated via `react-native-google-auth` with backend handoff to `/users/google`.
- [x] Session persistence implemented with `expo-secure-store` and bootstrap hydration/cleanup.
- [x] Sign-up notifications permission step implemented after session creation (with verify-first defer to first login).
- [x] Profile screen trimmed from inline auth forms to clean guest/authenticated layouts.
- [ ] QA pass pending for acceptance criteria above (including cross-platform native auth + notification permissions behavior).

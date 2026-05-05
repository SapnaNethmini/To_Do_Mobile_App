# Sprint 6 — Device Testing and Hardening

> Part of to_do_mobile. Derived from: spec §13 (security), §15 (testing), §17 (acceptance), §18 (risks); plan Phases 9–10.
> Estimated duration: 1 week.
> Depends on: Sprint 5 (polished, web-parity-aligned app).

---

## Goal

Take the polished app through a multi-target test matrix (iOS Simulator, Android Emulator, and at least one physical device), close the security and quality-gate items the spec requires, and produce an artifact (Expo Go demo or EAS preview build) that ticks every box in `spec.md §17`.

## Scope (in)

- Run the Sprint Demo / acceptance walk on three targets: iOS Simulator, Android Emulator, ≥ 1 physical device on Expo Go.
- Token-redaction audit (no JWT in any log path).
- Production env enforcement: `apiUrl` must start with `https://` when `NODE_ENV === 'production'` (or equivalent build-profile flag).
- Final quality gates: `npx tsc --noEmit`, `npx eslint`, `npx jest --coverage`, `npm audit --omit=dev`.
- Coverage targets met (services + hooks ≥ 80%, components ≥ 60%, utils 100%).
- Optional: EAS preview build for Android.
- README updated with run instructions for emulator and physical-device flows.
- Final acceptance walk against `spec.md §17`.

## Scope (out)

- New features.
- Refresh tokens, push notifications, biometrics, offline writes, telemetry — all v2 per spec §19.

## Prerequisites

- Sprint 5 complete; demo script from Sprint 5 passes on at least one device.
- Backend stable; the spec §5 edits from Sprint 2 have been merged for long enough that no web-app regressions have surfaced.
- Access to all three test targets.
- (Optional) Expo / EAS account if Task 8 will be executed.

## Tasks

1. **Multi-target verification matrix**
   - Targets: iOS Simulator, Android Emulator (AVD), ≥ 1 physical device on Expo Go.
   - Cases per target (per plan Phase 9.2):
     - Cold start when logged out → `/login`.
     - Register → auto-login → Dashboard.
     - Logout → `/login`.
     - Login → kill app → reopen → still logged in.
     - Airplane-mode optimistic create → list rolls back, toast fires.
     - Pull-to-refresh.
     - Detail edit + delete with confirm.
     - Filter tabs each show correct subset.
     - Theme toggle (system / light / dark).
     - Manually corrupted token → next call 401 → bounced to `/login`.
   - Verify: matrix grid (3 targets × 10 cases) is fully ticked; at least the physical-device column is 100% green.

2. **Token & log redaction audit**
   - Files: every `console.log` / `console.error` site; `src/api/client.ts`.
   - Action: grep for `Authorization`, `token`, `jwt`, `password`. If any logged values could leak secrets, replace with `<redacted>` or remove the log. If using Reactotron / Flipper / `axios` debug, confirm they don't echo the header.
   - Verify: a manual login + request walk-through produces zero log lines containing the JWT prefix `eyJ`.

3. **Lock down production HTTPS**
   - Files: `src/config/env.ts`.
   - Action: extend the Zod schema so when production (detect via `Constants.expoConfig?.extra.appEnv === 'production'` or equivalent EAS build profile flag), `apiUrl` must satisfy `z.string().url().refine(u => u.startsWith('https://'))`. Throw at boot otherwise.
   - Verify: temporarily set a `http://` URL with the production flag and observe a hard boot failure.

4. **Native cleartext + ATS posture**
   - Files: `app.config.ts`.
   - Action: Android — set `usesCleartextTraffic: false` for the production build profile; allow only for dev. iOS — do not add a blanket `NSAllowsArbitraryLoads`; if any HTTP host is required during dev, scope an exception to it.
   - Verify: production build does not connect to any `http://` URL; dev build still connects to LAN.

5. **Run final quality gates**
   - Commands:
     ```
     npx tsc --noEmit
     npx eslint . --ext .ts,.tsx
     npx jest --coverage
     npm audit --omit=dev
     ```
   - Targets per spec §15: services + hooks ≥ 80%, components ≥ 60%, utils 100%.
   - Verify: all four commands exit 0; coverage report meets the targets; no high or critical audit advisories.

6. **Risk-log review against spec §18**
   - Action: walk each risk in `spec.md §18` and `create_plan.md` Risk Log. For each, confirm the mitigation is observably in place (test, code reference, or note).
   - Verify: every risk row has a concrete mitigation pointer in the codebase or this sprint's notes.

7. **README**
   - Files: `README.md` at the project root.
   - Action: short, dev-focused. Sections: requirements (Node, Expo Go), env setup (`EXPO_PUBLIC_API_URL` matrix from spec §6), how to run on iOS Sim / Android Emulator / physical device, how to point at the local backend (and what backend changes from spec §5 must already be applied), test command, lint/typecheck commands.
   - Verify: a developer who's never seen the project can clone, install, and reach the login screen on a phone within 15 minutes.

8. **(Optional) EAS preview build**
   - Commands:
     ```
     npm i -g eas-cli
     eas login
     eas build:configure
     eas build -p android --profile preview
     ```
   - Action: build profiles per `create_plan.md` step 10.4 — `development`, `preview`, `production`, each with the right `EXPO_PUBLIC_API_URL`.
   - Verify: an APK installable on a phone produces the same demo behavior as Expo Go.

9. **Final acceptance walk**
   - Action: tick every box in `spec.md §17` end-to-end on the physical device.
   - Verify: the section is fully ticked. Any failures block sprint closure — fix or document as a v2 carry-over.

## Definition of Done

- [ ] Sprint 1–5 Definition of Done items still pass.
- [ ] Multi-target test matrix from Task 1 fully green on at least the physical-device column.
- [ ] No JWTs visible in any log output during a full login + CRUD + logout walk.
- [ ] Production env build refuses to start with a `http://` API URL.
- [ ] `npx tsc --noEmit`, `npx eslint`, `npx jest --coverage`, `npm audit --omit=dev` all exit 0.
- [ ] Coverage targets per spec §15 met.
- [ ] Risk-log items from spec §18 each have a verified mitigation.
- [ ] `README.md` exists and is sufficient for a fresh developer to run the app.
- [ ] `spec.md §17` acceptance checklist fully ticked.
- [ ] (Optional) An EAS preview APK exists and demos the same behavior as Expo Go.

## Risks & Mitigations

| Risk                                                              | Mitigation                                                                |
|-------------------------------------------------------------------|---------------------------------------------------------------------------|
| Coverage targets short by a few percent                           | Add focused tests on the lowest-covered hook/service first; never inflate by snapshotting trivial render output. |
| Audit reports high/critical in a transitive dep                   | Bump or pin per advisory; if no fix exists, document the known issue and risk for v2. |
| iOS-only or Android-only bug surfaces this late                   | Use the matrix from Task 1 to surface platform divergence; allocate a half-day buffer in the sprint for fixes. |
| Production env asserts break dev flow                             | Detect environment via build profile flag (`appEnv`), not `NODE_ENV` directly; default dev profile to `appEnv: 'development'`. |
| Redaction sweep misses a `console.log` in a niche path            | Grep for `eyJ` (the JWT prefix) in test output, not just static `Authorization` strings. |

## Demo script

1. From a clean clone, follow the README to install and run on a physical device. Verify the device reaches the login screen within ~15 minutes.
2. Run the full matrix from Task 1 on iOS Sim, Android Emulator, and the physical device. Mark each cell.
3. Trigger a token corruption (debug helper) → verify 401 redirect on all three targets.
4. From a terminal, run `npx tsc --noEmit && npx eslint . --ext .ts,.tsx && npx jest --coverage && npm audit --omit=dev` → all four green.
5. Show the coverage report; point out that services + hooks ≥ 80%, components ≥ 60%, utils 100%.
6. Toggle a debug build with `EXPO_PUBLIC_API_URL=http://example.com` and `appEnv='production'` → app fails to boot with a clear env error.
7. Open `spec.md §17` and walk every checkbox live; tick each as it's verified.
8. (Optional) Install the EAS preview APK on a fresh Android phone → app behaves identically.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This is a **pre-implementation planning repository**. No source code exists yet — only design documents under `.claude/`. Future instances starting work here should treat the docs as the source of truth and follow Phase 1 of the plan to bootstrap the actual Expo project.

## Document hierarchy (read in this order)

1. **`.claude/todo_mobile_blueprint.md`** — full architectural blueprint with rationale, code examples, trade-offs. Reach for this when you need to understand *why* a decision was made.
2. **`.claude/specs/spec.md`** — distilled, build-ready specification. Locks the stack, folder structure, API contract, acceptance criteria. **No substitutions allowed without updating both the spec and the blueprint.**
3. **`.claude/plans/create_plan.md`** — step-by-step execution plan with Files / Commands / Verify gates per phase. Drive implementation from this.

If a spec/plan disagrees with the blueprint, the spec wins (it's the locked contract); raise the conflict explicitly rather than silently following one.

## Project context

This mobile app is **one of two clients** sharing a single backend:

- **Web app** (existing, working): `C:\Users\sapna\Desktop\TO_DO\To_do_web` — React + Vite + TS + Tailwind frontend, Express + SQLite backend.
- **Mobile app** (this repo): React Native + Expo client.

The mobile app **reuses the existing backend at `../To_do_web/server` without forking it**. Same REST endpoints, same Zod validation rules, same error envelope. Do not stand up a second backend or duplicate database logic on-device.

## Locked architectural decisions

These are decided — do not relitigate without updating the spec:

- **Expo Router** (file-based) for navigation, not React Navigation directly.
- **`@tanstack/react-query` v5** owns server state (todo list + mutations); React Context owns auth state only.
- **`expo-secure-store`** for the JWT (Keychain/Keystore-backed). Never `AsyncStorage` for tokens.
- **`Authorization: Bearer <jwt>`** header for mobile auth. Web continues to use httpOnly cookies — the backend supports both.
- **NativeWind v4** for styling, mirroring the web app's Tailwind tokens (Slate/Indigo, dark-mode, rounded-xl cards).
- **TypeScript strict** with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`.
- Files ≤ ~150 lines; one responsibility per file; routes in `app/` stay thin and delegate to `src/`.

## Required backend changes (apply once, in Phase 4)

Before mobile auth can work, four backwards-compatible edits to `../To_do_web/server` are required (full diff in `spec.md §5` and `create_plan.md` Phase 4):

1. `auth.mw.ts` — accept JWT from `Authorization: Bearer` header in addition to cookie.
2. `auth.ctrl.ts` — return `{ user, token }` in login response body.
3. `app.ts` + `.env` — expand CORS allowlist to include LAN dev origins.
4. `server.ts` — bind `0.0.0.0` so devices on LAN can reach it.

After applying, **re-run the web app's full flow** (register/login/logout/CRUD) to confirm no regressions before moving on.

## Network configuration (the `localhost` trap)

A device cannot reach the dev server via `localhost` — pick the right URL per target. This matrix lives in the spec but is the most common source of confusion:

| Target              | `EXPO_PUBLIC_API_URL`                      |
|---------------------|---------------------------------------------|
| iOS Simulator       | `http://localhost:4000/api`                 |
| Android Emulator    | `http://10.0.2.2:4000/api`                  |
| Physical (Expo Go)  | `http://<LAN-IP>:4000/api`                  |
| Production          | `https://api.yourdomain.com/api`            |

Phone and dev machine must share Wi-Fi; if AP isolation blocks it, use `npx expo start --tunnel`.

## Development commands (post-bootstrap)

These don't work yet — they will after Phase 1 of the plan creates `package.json`:

```bash
npx expo start                # Metro + QR code
npx expo start --clear        # nuke Metro cache
npx expo start --tunnel       # if LAN routing fails
npx tsc --noEmit              # typecheck
npx eslint . --ext .ts,.tsx   # lint
npx jest                      # run all tests
npx jest src/api              # run a folder
npx jest -t "normalizeApiError"  # run by test name
```

## Working on this repo

- When implementing: drive from `create_plan.md`, advance phase-by-phase, satisfy each `Verify` gate before moving on.
- When the user asks a "why" question: cite the blueprint section.
- When the user asks "what should I build next": cite the plan's current phase.
- When code disagrees with the spec: the spec is the contract — fix the code or, if the spec is wrong, propose updating the spec first.
- The blueprint and spec already include code samples for the harder pieces (axios interceptors, AuthContext, optimistic React Query mutations, SecureStore wrapper). Copy them rather than reinventing.

## Git workflow (strict)

**Base branch:** `main`. **Default remote:** `origin` on GitHub.

### Feature work (anything that touches application code)

1. Every new feature gets a **tag** (a short label, e.g. `ui-redesign`, `optimistic-toggle`, `theme-picker`).
2. The tag becomes the branch slug: `feat/<tag>` for features, `fix/<tag>` for bug fixes.
3. **Always start a feature branch from `main`.** `git checkout main && git pull && git checkout -b feat/<tag>`.
4. **Before creating a new branch, the current branch must be fully shipped** — committed, pushed, and have a PR open against `main`. No half-finished work left behind.
5. Commits follow Conventional Commits: `feat: …`, `fix: …`, `chore: …`, `docs: …`, `refactor: …`, `test: …`. Pick the verb that matches the change.
6. Push and open a PR with `gh pr create --base main`.

### Exempt from the branch rule

These can be committed on the current branch (whatever it is) — no new feature branch required:

- `CLAUDE.md`
- `.claude/skills.md` (or any skills file)
- Slash commands under `.claude/commands/`
- **Anything under `.claude/`** (specs, plans, blueprints, sprints, agents)

Rationale: these are meta-files about how the project is run, not the product itself. Forcing a feature branch for a docs tweak just creates ceremony.

### When in doubt

Use `/commit_message` (see `.claude/commands/commit_message.md`) — it implements the rules above end-to-end: detects the kind of change, drafts the right commit message, and decides whether a PR is needed.

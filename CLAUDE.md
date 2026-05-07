# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

This is a fully-implemented React Native + Expo mobile app — one of two clients sharing a single backend:

- **Web app**: `C:\Users\sapna\Desktop\TO_DO\To_do_web` — React + Vite + TS + Tailwind, Express + SQLite backend.
- **Mobile app** (this repo): React Native + Expo client consuming the same REST API.

The mobile app **reuses the existing backend at `../To_do_web/server`** without forking it. Same endpoints, same Zod validation rules, same error envelope. Do not stand up a second backend.

## Development commands

```bash
npx expo start              # start Metro + QR code
npx expo start --android    # open in Android emulator
npx expo start --ios        # open in iOS simulator
npx expo start --clear      # nuke Metro cache
npx expo start --tunnel     # if LAN routing fails (physical device)

npx tsc --noEmit            # typecheck
npx eslint . --ext .ts,.tsx # lint (no-any is an error)
npx jest                    # run all tests
npx jest src/api            # run tests in a folder
npx jest -t "normalizeApiError"  # run by test name
```

## Architecture

### Navigation — `app/` (Expo Router file-based)

```
app/
  _layout.tsx          # root layout: loads fonts, mounts all providers
  (auth)/              # unauthenticated routes (redirect out when authed)
    login.tsx
    register.tsx
  (app)/               # protected routes (redirect to login when unauthed)
    index.tsx          # dashboard: todo list + filter tabs + FAB
    settings.tsx
    todos/[id].tsx     # todo detail / edit screen
```

Routes stay thin — all logic lives in `src/`.

### Source — `src/`

| Path | Responsibility |
|------|---------------|
| `api/client.ts` | Axios instance: JWT header injection via request interceptor, 401 token-clear via response interceptor |
| `api/auth.api.ts` / `todos.api.ts` | Per-resource endpoint functions; `todos.api.ts` normalizes snake_case → camelCase |
| `api/errors.ts` | `normalizeApiError` — maps Axios errors to a typed `ApiError` |
| `context/AuthContext.tsx` | Auth state machine (`loading → authenticated/unauthenticated`), boots by calling `/auth/me` with stored token |
| `context/ThemeContext.tsx` | Light/dark/system toggle, persisted to AsyncStorage |
| `hooks/useTodos.ts` | All React Query hooks: `useTodoList`, `useTodoDetail`, `useCreateTodo`, `useUpdateTodo`, `useDeleteTodo` with optimistic updates |
| `services/token.storage.ts` | `expo-secure-store` wrapper keyed `todo.jwt`, accessibility `AFTER_FIRST_UNLOCK` |
| `theme/` | Design tokens (palette, spacing, radii, typography, shadows) + `useTheme()` hook |
| `schemas/` | Zod schemas for auth and todo forms |
| `types/` | Branded types: `TodoId`, `UserId`; `ApiError` shape |
| `components/ui/` | Base components: `Button`, `Input`, `Card`, `Badge`, `Skeleton`, `EmptyState`, `Toast` |
| `components/todos/` | Feature components: `TodoItem`, `TodoForm`, `FilterTabs`, `ProgressSection` |
| `config/env.ts` | Zod-validated `EXPO_PUBLIC_API_URL` |
| `config/queryClient.ts` | React Query `QueryClient` singleton |

### State ownership

| What | Tool |
|------|------|
| Server state (todos) | React Query v5 (`src/hooks/useTodos.ts`) |
| Auth | React Context (`src/context/AuthContext.tsx`) |
| Theme mode | React Context + AsyncStorage |
| Form state | React Hook Form + Zod resolvers |

### Design decisions (do not relitigate without updating `.claude/specs/spec.md`)

- **Expo Router** for navigation — not React Navigation directly.
- **`expo-secure-store`** for the JWT — never `AsyncStorage` for tokens.
- **`Authorization: Bearer <jwt>`** on every request — the backend accepts both Bearer and cookie.
- **`StyleSheet.create` + typed theme module** — no NativeWind or Tailwind. `useTheme()` returns the resolved light/dark token set.
- **TypeScript strict** with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. ESLint enforces no `any`.
- Files ≤ ~150 lines; one responsibility per file.

## Network configuration

A physical device cannot reach the dev server via `localhost`:

| Target | `EXPO_PUBLIC_API_URL` |
|--------|----------------------|
| iOS Simulator | `http://localhost:4000/api` |
| Android Emulator | `http://10.0.2.2:4000/api` |
| Physical device (Expo Go) | `http://<LAN-IP>:4000/api` |
| Production | `https://api.yourdomain.com/api` |

Device and machine must share Wi-Fi; if AP isolation blocks it, use `--tunnel`.

## Backend requirements

The backend (`../To_do_web/server`) needs these four edits for mobile auth (already applied — verify before re-applying):

1. `auth.mw.ts` — accept JWT from `Authorization: Bearer` in addition to cookie.
2. `auth.ctrl.ts` — return `{ user, token }` in login response body.
3. `app.ts` + `.env` — CORS allowlist includes LAN dev origins.
4. `server.ts` — binds `0.0.0.0`.

After any backend change, re-run the full web flow (register/login/logout/CRUD) to confirm no regressions.

## Reference docs

- `.claude/todo_mobile_blueprint.md` — rationale behind architectural decisions.
- `.claude/specs/spec.md` — locked spec (stack, folder structure, API contract, acceptance criteria). If code disagrees with the spec, fix the code; if the spec is wrong, propose updating it first.

## Git workflow

**Base branch:** `main`. **Default remote:** `origin`.

### Feature work

1. One feature branch per feature: `feat/<tag>` or `fix/<tag>` off `main`.
2. **Ship the current branch before starting a new one** — committed, pushed, PR open.
3. Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
4. Open PRs with `gh pr create --base main`.

### Exempt from branch rule (commit directly on current branch)

- `CLAUDE.md`, anything under `.claude/` (specs, plans, blueprints, sprints, commands, skills).

### When in doubt

Use `/commit_message` — it detects change type, drafts the message, and decides whether a PR is needed.

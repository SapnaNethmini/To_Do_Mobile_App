# TODO Mobile — Implementation Spec

> Build-ready specification distilled from `.claude/todo_mobile_blueprint.md`. This document defines **what to build, in what order, and what "done" means** for each piece. Refer back to the blueprint for rationale and code examples.

**Project:** `C:\Users\sapna\Desktop\TO_DO\To_do_mobile`
**Backend (reused, no fork):** `C:\Users\sapna\Desktop\TO_DO\To_do_web\server`
**Web client (style reference):** `C:\Users\sapna\Desktop\TO_DO\To_do_web\client`

---

## 1. Scope

### In scope (v1)
- React Native + Expo SDK 50+ app, TypeScript strict.
- Auth: Register, Login, Logout, persistent session, `/auth/me` rehydrate.
- Todos: list (with filter All/Active/Completed + cursor pagination), create, read, update (title/description/completed), delete.
- Per-user data isolation enforced by existing backend.
- Light + dark themes matching the web app's Slate/Indigo palette.
- Real-device testing via Expo Go.

### Out of scope (v1)
- Refresh tokens, push notifications, biometrics, offline writes, social login, web build target.

---

## 2. Stack (locked)

| Concern        | Choice                                    |
|----------------|-------------------------------------------|
| Runtime        | Expo SDK ≥ 50, React Native               |
| Language       | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Navigation     | Expo Router (file-based, typed routes)    |
| HTTP           | `axios` + interceptors                    |
| Server state   | `@tanstack/react-query` v5                |
| Auth state     | React Context (`AuthProvider`)            |
| Token storage  | `expo-secure-store`                       |
| Cache          | `@react-native-async-storage/async-storage` |
| Validation     | `zod` + `react-hook-form` + `@hookform/resolvers/zod` |
| Styling        | `StyleSheet.create` + `src/theme/` tokens (no NativeWind / Tailwind) |
| Icons          | `@expo/vector-icons`                      |
| Animations     | `react-native-reanimated` v3              |
| Safe area / gestures | `react-native-safe-area-context`, `react-native-gesture-handler` |

Substitutions are not allowed without updating this spec and the blueprint.

---

## 3. Folder Structure (must match)

```
To_do_mobile/
├── app/                       # Expo Router routes
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx          # dashboard
│   │   ├── todos/[id].tsx
│   │   └── settings.tsx
│   └── +not-found.tsx
├── src/
│   ├── api/                   # client.ts, auth.api.ts, todos.api.ts, errors.ts
│   ├── components/            # ui/, todos/, layout/
│   ├── context/               # AuthContext.tsx, ThemeContext.tsx
│   ├── hooks/                 # useAuth.ts, useTodos.ts, ...
│   ├── services/              # auth.service.ts, token.storage.ts
│   ├── config/                # env.ts, queryClient.ts
│   ├── theme/                 # palette.ts, theme.ts, spacing.ts, radii.ts, typography.ts, shadows.ts, useTheme.ts, recipes.ts
│   ├── schemas/               # auth.schema.ts, todos.schema.ts
│   ├── types/                 # todo.ts, user.ts, api.ts
│   └── utils/
├── assets/
├── app.config.ts
├── babel.config.js
├── tsconfig.json
└── .env.example
```

**Rules**
- ≤ ~150 lines per file, one responsibility per file.
- `app/` routes are thin shells; logic lives in `src/`.
- `api/` returns DTOs; `services/` orchestrates side effects.

---

## 4. Backend Contract (consumed verbatim)

Base URL configured via `EXPO_PUBLIC_API_URL`. Endpoints (per web blueprint §6):

| Method | Path                  | Auth | Body / Query                                  |
|--------|-----------------------|------|-----------------------------------------------|
| POST   | `/auth/register`      | —    | `{ username, email, password }`               |
| POST   | `/auth/login`         | —    | `{ email, password }` → `{ user, token }`     |
| POST   | `/auth/logout`        | ✓    | —                                             |
| GET    | `/auth/me`            | ✓    | —                                             |
| GET    | `/todos`              | ✓    | `?status=all\|active\|completed&limit&cursor` |
| POST   | `/todos`              | ✓    | `{ title, description? }`                     |
| GET    | `/todos/:id`          | ✓    | —                                             |
| PATCH  | `/todos/:id`          | ✓    | `{ title?, description?, completed? }`        |
| DELETE | `/todos/:id`          | ✓    | —                                             |

**Success envelope:** `{ data: <payload> }`
**Error envelope:** `{ error: { code, message, fields? } }`
**Auth header:** `Authorization: Bearer <jwt>` (mobile only — web continues to use cookies).

---

## 5. Required Backend Changes

> Backwards compatible. Web app must continue working unchanged.

1. **`auth.mw.ts`:** accept JWT from `Authorization: Bearer <token>` when cookie absent.
2. **`auth.ctrl.ts` login:** return `{ user, token }` in body in addition to setting the cookie.
3. **CORS allowlist:** add LAN dev origins to `CORS_ORIGIN` (e.g. `http://192.168.x.x:8081`, `:19006`).
4. **`server.ts`:** bind to `0.0.0.0` (or omit host) so devices on LAN can reach it.
5. **No DB schema changes.**

Verify after change: web register/login/logout/CRUD all still pass.

---

## 6. Configuration

### `.env.example`
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api          # Android emulator default
# EXPO_PUBLIC_API_URL=http://localhost:4000/api       # iOS simulator
# EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/api     # physical device on Wi-Fi
# EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api  # production
```

### Environment matrix
| Target              | API URL                           |
|---------------------|-----------------------------------|
| iOS Simulator       | `http://localhost:4000/api`       |
| Android Emulator    | `http://10.0.2.2:4000/api`        |
| Physical (Expo Go)  | `http://<LAN-IP>:4000/api`        |
| Production          | `https://api.yourdomain.com/api`  |

### `src/config/env.ts`
- Reads `Constants.expoConfig.extra.apiUrl`.
- Validates with Zod: `z.string().url()`. Production build asserts `https`.
- Fail fast at boot.

---

## 7. Data Model (client types)

```ts
// src/types/user.ts
export type User = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

// src/types/todo.ts
export type Todo = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

// src/types/api.ts
export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  status: number;
};

export type Paginated<T> = { items: T[]; nextCursor: string | null };
```

---

## 8. Validation Schemas (mirror backend)

`src/schemas/auth.schema.ts`
- `loginSchema`: `email` (lowercase trim, valid), `password` (min 1).
- `registerSchema`: `username` (3–20, `^[a-zA-Z0-9_]+$`), `email` (lowercase trim, ≤255, valid), `password` (8–72, must contain upper/lower/digit/symbol).

`src/schemas/todos.schema.ts`
- `createTodoSchema`: `title` (1–120, trimmed), `description?` (≤1000).
- `updateTodoSchema`: all fields optional.

Use `z.infer` for input types. Server is still source of truth — surface `error.fields` on inputs.

---

## 9. API Layer

### `src/api/client.ts`
- `axios.create({ baseURL: env.apiUrl, timeout: 10_000 })`.
- **Request interceptor:** read token from SecureStore, set `Authorization: Bearer <token>` if present.
- **Response interceptor:** on 401, clear SecureStore; reject with `normalizeApiError(err)`.

### `src/api/errors.ts`
- `normalizeApiError(unknown): ApiError` — collapses Axios + network + unknown into uniform shape with `{ code, message, fields?, status }`.

### `src/api/auth.api.ts`
- `register`, `login`, `me`, `logout` — typed wrappers returning unwrapped `data`.

### `src/api/todos.api.ts`
- `list({ status, cursor, limit })`, `create`, `update`, `remove` — typed wrappers.

---

## 10. State Management

| State                         | Owner                          |
|-------------------------------|--------------------------------|
| Auth status, current user     | `AuthContext` + SecureStore    |
| Todo list, mutations          | React Query                    |
| Theme                         | `ThemeContext` + AsyncStorage  |
| Form state                    | `react-hook-form`              |
| Modals, toasts                | local `useState`               |

### React Query defaults (`src/config/queryClient.ts`)
- `queries`: `retry: 2`, `staleTime: 30_000`, `refetchOnReconnect: 'always'`.
- `mutations`: `retry: 0`.

### `src/hooks/useTodos.ts`
- `useTodoList(status)` → `useQuery`.
- `useCreateTodo`, `useUpdateTodo`, `useDeleteTodo` → `useMutation` with **optimistic updates and rollback** (`onMutate` snapshots, `onError` restores, `onSettled` invalidates).
- Query key shape: `['todos', 'list', status]`.

---

## 11. Authentication Flow

### `src/services/token.storage.ts`
- Wraps `expo-secure-store` with `get`, `set`, `clear`. Key: `todo.jwt`. `keychainAccessible: AFTER_FIRST_UNLOCK`.

### `src/context/AuthContext.tsx`
- States: `'loading' | 'authenticated' | 'unauthenticated'`.
- On mount: read token → if present, call `/auth/me` to rehydrate user; on failure clear and go unauthenticated.
- `login(email, password)` → call API → store token → set state.
- `register(input)` → call API → auto-login.
- `logout()` → best-effort API call → always clear SecureStore + Query cache + state.

### Auth gating (Expo Router)
- `app/(app)/_layout.tsx`: while `loading`, return `null` (splash visible). If `unauthenticated`, `<Redirect href="/(auth)/login" />`. Otherwise `<Stack />`.
- `app/(auth)/_layout.tsx`: if `authenticated`, redirect to `/(app)`.

---

## 12. UI / UX

### Theme module (`src/theme/`)
- `palette.ts`: raw color steps extracted from `../To_do_web/client/tailwind.config.cjs` + `client/src/index.css` (Slate, Indigo, Violet, Emerald, Red — only the steps actually referenced by the web recipes). Source-of-truth comment points back at the web files for traceability.
- `theme.ts`: `light` + `dark` semantic token sets (`bg`, `surface`, `surfaceMuted`, `border`, `borderStrong`, `text`, `textMuted`, `primary`, `primaryGradient`, `primaryRing`, `danger`, `success`, etc.) consuming `palette`. Values mirror the web `.card` / `.btn-*` / `.badge-*` / `.input` recipes; dark-mode translucent surfaces use RGBA to match web's `bg-slate-800/80` exactly.
- `spacing.ts`, `radii.ts`, `typography.ts`, `shadows.ts`: numeric scales matching the Tailwind defaults the web recipes actually use (`rounded-xl: 12`, `rounded-lg: 8`, 4-pt spacing, `shadow-sm` / `shadow-md` mapped to RN `shadowOffset`/`shadowOpacity`/`shadowRadius` + Android `elevation`).
- `useTheme.ts`: `useTheme()` returns `themes[useColorScheme() ?? 'light']`. Components consume color tokens via the hook; spacing/radii/shadows are imported as scalars.
- `recipes.ts`: typed style helpers `cardStyle(theme)`, `btnPrimaryStyle(theme)`, `btnSecondaryStyle(theme)`, `btnDangerStyle(theme)`, `btnGhostStyle(theme)`, `inputStyle(theme)`, `badgeOpenStyle(theme)`, `badgeDoneStyle(theme)`, `alertErrorStyle(theme)` — one-to-one with web's CSS recipes. `.btn-primary`'s indigo→violet gradient renders via `expo-linear-gradient`.
- Load Inter (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`) via `expo-font` in root layout; hold splash until fonts + auth ready.

### Styling rule
**No NativeWind, no Tailwind on mobile.** All component styles are written as `StyleSheet.create` objects, or inline objects when a value depends on `theme`. The web app continues to use Tailwind; the mobile app mirrors its visual tokens, not its mechanism. The web's stationery PNG background (`/backgrounds/stationery.png` with a CSS radial-gradient mask) is rendered full-bleed at low opacity on mobile — the radial mask is web-only and intentionally not reproduced.

### Component library (`src/components/ui/`)
- `Button` — variants: primary | secondary | ghost | danger; sizes; loading state; haptics on press.
- `Input` — label, helper, error, leftIcon; wraps `TextInput`.
- `Card` — rounded-2xl, hairline border, soft shadow (light), 16px padding.
- `Skeleton` — shimmer block.
- `Badge`, `Toast` (via `react-native-toast-message`), `EmptyState`.
- All touch targets ≥ 44pt.

### Screens (`app/`)
| Route                | Behavior                                                                 |
|----------------------|--------------------------------------------------------------------------|
| `(auth)/login`       | Email + password form; Zod-validated; field-level + toast errors         |
| `(auth)/register`    | Username + email + password with strength hints                          |
| `(app)/index`        | Filter tabs (All/Active/Completed), `FlatList`, skeletons, pull-to-refresh, FAB to add |
| `(app)/todos/[id]`   | Edit form: title, description, completed toggle, delete (confirm sheet)  |
| `(app)/settings`     | User info, theme toggle (system/light/dark), Logout                      |
| `+not-found`         | Friendly fallback with link home                                         |

### UX must-haves
- Skeletons (not spinners) for initial loads.
- Optimistic toggle/delete with rollback on failure.
- Pull-to-refresh via `RefreshControl`.
- Inline edit on title tap (parity with web).
- `KeyboardAvoidingView` on auth + edit screens.
- Reanimated `Layout` springs on list mutations.
- Light haptics on success / error.
- Safe areas respected everywhere.

---

## 13. Security

| Item                        | Requirement                                                              |
|-----------------------------|--------------------------------------------------------------------------|
| JWT at rest                 | `expo-secure-store` only — never AsyncStorage                            |
| JWT in transit              | HTTPS in production, enforced by env Zod schema                          |
| Logging                     | Never log `Authorization` header or login response body                  |
| 401 handling                | Interceptor clears token; AuthContext flips to unauthenticated           |
| Cleartext (Android)         | `usesCleartextTraffic: false` in prod; dev-only network config exception |
| iOS ATS                     | No blanket `NSAllowsArbitraryLoads`; scope to dev hosts only             |
| Deep links                  | Never accept JWT via deep link                                           |
| `expoConfig.extra`          | Public — no secrets stored there (API URL + flags only)                  |

---

## 14. TypeScript Rules

1. `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
2. No `any`. Use `unknown` + narrowing.
3. Path aliases `@/api`, `@/hooks`, `@/types`, etc.
4. Branded IDs: `type UserId = string & { __brand: 'UserId' }`, same for `TodoId`.
5. Typed routes via `experiments.typedRoutes: true`.
6. React Query generics: `useQuery<T, ApiError>`.

---

## 15. Testing

| Layer        | Tooling                                  | Required for v1 |
|--------------|------------------------------------------|------------------|
| Unit         | `jest` + `@testing-library/react-native` | ✓ — schemas, utils, hooks |
| API          | `msw` + `jest`                           | ✓ — interceptors, error normalize |
| Integration  | RN Testing Library + Query wrappers      | ✓ — login flow, todo CRUD |
| E2E          | Maestro / Detox                          | optional         |
| Manual       | Expo Go (Android + iOS)                  | ✓ — required before sign-off |

**Coverage:** services + hooks ≥ 80%, components ≥ 60%, utils 100%.

---

## 16. Implementation Phases

Each phase is a checkpoint — do not advance until it passes its acceptance criteria.

### Phase 1 — Foundation
- Init Expo TS app, install deps from blueprint §6.1.
- Configure Babel (Reanimated plugin **last**), Inter fonts via `expo-font` (Regular/Medium/SemiBold/Bold), splash, app icon. **No NativeWind/Tailwind setup.**
- Build the theme module (`src/theme/` — palette, theme, spacing, radii, typography, shadows, useTheme, recipes) by extracting tokens from `../To_do_web/client/tailwind.config.cjs` + `client/src/index.css`.
- `app.config.ts` reads `EXPO_PUBLIC_API_URL`; `src/config/env.ts` Zod-validates it.
- Strict `tsconfig.json` + path aliases + ESLint + Prettier.
- ✅ **Done when:** `npx expo start` boots, QR opens in Expo Go, `env.apiUrl` logs cleanly.

### Phase 2 — Navigation skeleton
- Root `_layout.tsx` with provider tree: SafeArea → GestureHandler → QueryClient → Auth → Theme.
- `(auth)` and `(app)` route groups with redirect-gated layouts.
- Placeholder screens stubbed.
- ✅ **Done when:** unauth user lands on `/login`; toggling fake auth flips to `(app)`.

### Phase 3 — API layer
- Axios instance + interceptors.
- `auth.api.ts`, `todos.api.ts` with full typings.
- `normalizeApiError` + unit tests.
- ✅ **Done when:** debug button hits `/auth/me`, gets 401, error is normalized.

### Phase 4 — Backend changes
- Apply §5 changes to `To_do_web/server`.
- Re-test web app: register, login, logout, CRUD all still pass.
- ✅ **Done when:** mobile can login from Expo Go and receive `{ user, token }`.

### Phase 5 — Auth flow
- SecureStore wrapper; `AuthContext` with rehydrate.
- Login + Register screens with `react-hook-form` + Zod.
- Field-level error rendering from `error.fields`; toast for `error.message`.
- Logout clears storage, Query cache, state.
- ✅ **Done when:** login persists across app reload; logout returns to `/login`; expired token handled.

### Phase 6 — Todo screens
- Dashboard `FlatList` with filter tabs, skeleton, empty state, pull-to-refresh.
- FAB → modal route to create.
- Inline checkbox toggle.
- Detail screen edit + delete with confirm.
- ✅ **Done when:** full CRUD round-trip works on a real device.

### Phase 7 — State + UX polish
- Optimistic updates with rollback for toggle/update/delete.
- Toasts on success/error.
- Reanimated layout transitions.
- Dark mode + theme persistence.
- Haptics.
- ✅ **Done when:** airplane-mode toggle test rolls back optimistically; transitions feel smooth.

### Phase 8 — Web parity review
- Side-by-side comparison: typography, spacing, card shape, color contrast (light + dark).
- Empty state copy and visuals match.
- ✅ **Done when:** screenshots show no jarring inconsistencies.

### Phase 9 — Device testing
- iOS simulator + Android emulator + ≥ 1 physical device.
- Token persistence, 401 recovery, pull-to-refresh, optimistic rollback.
- ✅ **Done when:** all checks in §17 pass on at least one physical device.

### Phase 10 — Hardening
- `npm audit`; pin Expo SDK.
- Verify no token logs.
- Prod env asserts `https://`.
- Lint, typecheck, tests green.
- Optional: EAS preview build.
- ✅ **Done when:** §17 checklist fully ticked.

---

## 17. Acceptance Criteria

- [ ] `npx expo start` boots cleanly; QR opens in Expo Go on a real device.
- [ ] Register: weak passwords rejected with field-level errors; duplicates show `CONFLICT`.
- [ ] Login: JWT stored in SecureStore; persists across app restart.
- [ ] `/auth/me` rehydrates user on cold start.
- [ ] Logout: clears SecureStore + Query cache + state; returns to `/login`.
- [ ] Expired/tampered token: 401 interceptor clears state and redirects.
- [ ] Todo CRUD works for the authenticated user.
- [ ] Filter tabs (All/Active/Completed) work; cursor pagination loads more.
- [ ] Cross-user todo access returns 404 (parity with web).
- [ ] Optimistic updates roll back on network failure (verify with airplane mode).
- [ ] Pull-to-refresh works on the list.
- [ ] Skeletons (not spinners) for initial loads.
- [ ] Empty state matches web copy + style.
- [ ] Dark mode follows system; user override persists.
- [ ] Touch targets ≥ 44pt; safe areas respected on notch devices.
- [ ] No `any` in TS; strict mode passes; ESLint clean.
- [ ] Prod env requires HTTPS API URL (Zod-enforced).
- [ ] No tokens in logs.
- [ ] Backend §5 changes merged; web app still passes its own acceptance checklist.

---

## 18. Risks & Mitigations

| Risk                                                   | Mitigation                                                |
|--------------------------------------------------------|-----------------------------------------------------------|
| LAN connectivity issues during dev (AP isolation)      | Document `--tunnel` fallback; use personal hotspot if needed |
| Token leakage in Reactotron / Flipper logs             | Redact `Authorization` header; review before merging      |
| Expo Go SDK lag behind RN releases                     | Pin Expo SDK in `package.json`; upgrade in batches        |
| Mobile sessions outliving 15-min access TTL → frequent re-logins | Track UX impact; ship refresh tokens in v2          |
| Design drift from web app                              | Phase 8 explicit parity review with screenshots           |

---

## 19. Out-of-Scope / Future (v2+)

- Refresh token rotation (`/auth/refresh`).
- Push notifications via `expo-notifications`.
- Offline writes via `@tanstack/query-async-storage-persister` + outbox.
- Biometric unlock (`expo-local-authentication`).
- EAS Update for OTA JS updates.
- Sentry / PostHog telemetry.

---

**Status:** Spec approved — proceed with Phase 1.

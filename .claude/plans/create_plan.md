# TODO Mobile — Implementation Plan

> Concrete, step-by-step execution plan derived from `.claude/specs/spec.md`. Each step lists the exact files to create/modify, the commands to run, and the verification check that gates the next step. Work top-down — do not skip phases.

**Project root:** `C:\Users\sapna\Desktop\TO_DO\To_do_mobile`
**Backend root (existing):** `C:\Users\sapna\Desktop\TO_DO\To_do_web\server`
**Web client (style ref):** `C:\Users\sapna\Desktop\TO_DO\To_do_web\client`

---

## Plan Conventions

- Every step lists: **Files**, **Commands**, **Verify**.
- Move to the next step only when **Verify** passes.
- `cwd` is the mobile project root unless noted.
- All file paths are relative to the project root.
- Where the spec already provides code (blueprint §6.1, §8.1, §10.1, §10.2, etc.), copy from there — don't re-invent.

---

## Pre-flight — Environment check (15 min)

**Steps**
1. Confirm Node.js LTS ≥ 20: `node -v`.
2. Confirm `npm` ≥ 10: `npm -v`.
3. Install Expo Go on a phone (iOS App Store / Google Play).
4. Install Android Studio with an AVD **or** Xcode with iOS Simulator (at least one).
5. Find your machine's LAN IP — Windows: `ipconfig` → IPv4 of the active adapter (e.g. `192.168.1.42`). Note it for later.
6. Verify the existing backend runs: `cd ../To_do_web/server && npm run dev` — see it listening on `:4000`.
7. From the same Wi-Fi the phone uses, hit `http://<LAN-IP>:4000/healthz` from the phone's browser. If it 200s, networking is good.

**Verify**
- ✅ Phone can reach `http://<LAN-IP>:4000/healthz`.
- ✅ Web app at `http://localhost:5173` still works against the backend.

---

## Phase 1 — Foundation

### 1.1 Initialize Expo TS app

**Commands**
```bash
npx create-expo-app@latest . --template blank-typescript
```

**Verify** `package.json`, `tsconfig.json`, `app.json` exist; `npx expo start` opens DevTools.

### 1.2 Install dependencies (per spec §2 / blueprint §6.1)

**Commands**
```bash
npx expo install expo-router expo-linking expo-constants expo-secure-store \
  expo-status-bar expo-splash-screen expo-font expo-haptics expo-image \
  react-native-safe-area-context react-native-screens react-native-gesture-handler \
  react-native-reanimated

npm i axios @tanstack/react-query zod react-hook-form @hookform/resolvers \
  @react-native-async-storage/async-storage \
  react-native-toast-message @expo/vector-icons \
  @expo-google-fonts/inter

npm i nativewind tailwindcss
npx tailwindcss init

npm i -D @types/react typescript eslint prettier eslint-config-expo \
  jest @testing-library/react-native @testing-library/jest-native ts-jest \
  msw babel-plugin-module-resolver
```

**Verify** `npm ls --depth=0` shows all packages without `UNMET` warnings.

### 1.3 Configure Expo, Babel, Metro, NativeWind

**Files**
- `app.config.ts` — replace `app.json`. Set `name`, `slug`, `scheme: "todo"`, `plugins: ["expo-router", "expo-secure-store"]`, `experiments.typedRoutes: true`, `extra.apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000/api"`.
- `babel.config.js` — preset `babel-preset-expo` with `jsxImportSource: 'nativewind'`, preset `nativewind/babel`, plugin `react-native-reanimated/plugin` **last**, `module-resolver` with alias `@ → ./src`.
- `metro.config.js` — wrap `getDefaultConfig` with `withNativeWind` pointing to `./global.css`.
- `tailwind.config.js` — `content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}']`, `presets: [require('nativewind/preset')]`, `darkMode: 'class'`, extend with theme tokens (placeholder; real values land in 1.5).
- `global.css` — `@tailwind base; @tailwind components; @tailwind utilities;`.
- `nativewind-env.d.ts` — `/// <reference types="nativewind/types" />`.

**Verify** `npx expo start --clear` boots without parser errors.

### 1.4 Strict TypeScript + path aliases + linting

**Files**
- `tsconfig.json` — extend `expo/tsconfig.base`; set `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`; `paths: { "@/*": ["src/*"] }`.
- `.eslintrc.js` — extends `expo`, plugin rules forbidding `any`.
- `.prettierrc`.
- `.gitignore` — add `.env`, `node_modules`, `.expo`, `dist`, `web-build`, `ios/Pods`, `android/build`.

**Verify** `npx tsc --noEmit` passes on the empty app skeleton.

### 1.5 Theme tokens + fonts

**Files**
- `src/theme/colors.ts` — copy values from spec §12 / blueprint §11.1.
- `src/theme/spacing.ts` — copy 4-pt grid from blueprint §11.1.
- `src/theme/typography.ts` — Inter family + sizes.
- `src/theme/index.ts` — re-export.
- Update `tailwind.config.js` to consume `colors`, `borderRadius` (`xl: 20`, `2xl: 28`), `fontFamily` Inter.

**Verify** `import { colors } from '@/theme'` resolves; Tailwind class `bg-surface` compiles in a test view.

### 1.6 Validated env config

**Files**
- `.env.example` — content from spec §6.
- `src/config/env.ts` — read `Constants.expoConfig?.extra`, Zod-validate `apiUrl: z.string().url()`. Fail fast.

**Verify** `console.log(env.apiUrl)` prints the expected URL on app boot.

### 1.7 Smoke run

**Commands**
```bash
npx expo start
```
Press `a` for Android emulator or scan QR on phone.

**Verify** App boots in Expo Go showing default screen; no red box.

---

## Phase 2 — Navigation skeleton

### 2.1 Provider tree at the root

**Files**
- `app/_layout.tsx` — wrap with: `GestureHandlerRootView` → `SafeAreaProvider` → `QueryClientProvider` → `AuthProvider` → `ThemeProvider` → `Slot`. Hold splash via `expo-splash-screen` until fonts loaded (Inter via `@expo-google-fonts/inter`) and auth status resolved.
- `src/config/queryClient.ts` — `new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 30_000, refetchOnReconnect: 'always' }, mutations: { retry: 0 } } })`.
- `src/context/AuthContext.tsx` — stub with `status: 'loading' | 'authenticated' | 'unauthenticated'` + `useAuth` hook. Real impl in Phase 5.
- `src/context/ThemeContext.tsx` — stub returning system color scheme.

### 2.2 Route groups + gating

**Files**
- `app/(auth)/_layout.tsx` — `<Stack>`; redirect to `/(app)` if `authenticated`.
- `app/(auth)/login.tsx` — placeholder with "Login" text + button that flips fake auth state for now.
- `app/(auth)/register.tsx` — placeholder.
- `app/(app)/_layout.tsx` — while `loading` return `null`; if `unauthenticated` `<Redirect href="/(auth)/login" />`; else `<Stack>`.
- `app/(app)/index.tsx` — placeholder dashboard.
- `app/(app)/todos/[id].tsx` — placeholder detail.
- `app/(app)/settings.tsx` — placeholder with logout button.
- `app/+not-found.tsx` — friendly fallback with link home.

**Verify**
- ✅ Cold start lands on `/(auth)/login`.
- ✅ Toggling fake auth flips to dashboard; refreshing keeps state in memory.
- ✅ `/(app)` cannot be reached when unauthenticated.

---

## Phase 3 — API layer (no backend changes yet)

### 3.1 Token storage wrapper

**Files**
- `src/services/token.storage.ts` — copy from blueprint §10.1.

### 3.2 Axios instance + interceptors + error normalizer

**Files**
- `src/api/client.ts` — copy from blueprint §8.1; reads token from storage on each request; on 401 clears storage.
- `src/api/errors.ts` — `normalizeApiError` from blueprint §8.2.
- `src/types/api.ts` — `ApiError`, `Paginated<T>` from spec §7.

### 3.3 Resource modules

**Files**
- `src/types/user.ts`, `src/types/todo.ts` — from spec §7.
- `src/api/auth.api.ts` — `register`, `login`, `me`, `logout` from blueprint §8.3.
- `src/api/todos.api.ts` — `list`, `create`, `update`, `remove` from blueprint §8.3.

### 3.4 Smoke test the API layer

**Files**
- Add a temporary debug button on `app/(auth)/login.tsx` that calls `authApi.me()` and toasts the normalized error.

**Verify**
- ✅ Tapping the button (no token stored) returns a normalized 401 `ApiError` with `code: "UNAUTHORIZED"`.
- ✅ Network errors (kill the backend, retry) normalize to `code: "NETWORK_ERROR"`.

### 3.5 Unit test the normalizer

**Files**
- `src/api/__tests__/errors.test.ts` — covers AxiosError-with-data, AxiosError-no-response, and unknown.
- `jest.config.js` — preset `jest-expo`, `setupFilesAfterEach: ['@testing-library/jest-native/extend-expect']`.

**Verify** `npx jest src/api` passes.

---

## Phase 4 — Backend changes (one-shot, backwards compatible)

> Touches `../To_do_web/server`. Apply all four, then re-verify the web app.

### 4.1 Header fallback in auth middleware

**File** `../To_do_web/server/src/presentation/middleware/auth.mw.ts`

Replace the cookie-only token read with:
```ts
const cookieToken = req.cookies?.access;
const headerToken = req.headers.authorization?.startsWith('Bearer ')
  ? req.headers.authorization.slice(7)
  : undefined;
const token = cookieToken ?? headerToken;
if (!token) throw new DomainError('UNAUTHORIZED', 'Missing token', 401);
```

### 4.2 Return token in login body

**File** `../To_do_web/server/src/presentation/controllers/auth.ctrl.ts` (login handler)
- After signing the JWT and setting the cookie, include the token in the response body:
```ts
res.cookie('access', token, cookieOpts);
res.status(200).json({ data: { user: toUserDto(user), token } });
```

### 4.3 CORS allowlist

**File** `../To_do_web/server/.env`
- Update `CORS_ORIGIN` to comma-separated list including `http://localhost:5173` (web) and your LAN dev origins (`http://<LAN-IP>:8081`, `http://<LAN-IP>:19006`).

**File** `../To_do_web/server/src/presentation/app.ts`
- Replace single-origin CORS with the allowlist function from spec §5 / blueprint §14.3.

### 4.4 Bind to all interfaces

**File** `../To_do_web/server/src/server.ts`
- Ensure `app.listen(env.PORT, '0.0.0.0', ...)` (or `app.listen(env.PORT, ...)` with no host).

### 4.5 Verify backwards compatibility

**Verify**
- ✅ Web app: register, login, logout, full CRUD all still pass.
- ✅ Backend integration tests: `cd ../To_do_web/server && npm test` — green.
- ✅ From phone browser: `http://<LAN-IP>:4000/healthz` returns 200.

---

## Phase 5 — Authentication flow

### 5.1 Real `AuthContext`

**Files**
- `src/context/AuthContext.tsx` — replace stub with full impl from blueprint §10.2:
  - On mount: read token → call `/auth/me` → set state.
  - `login(email, password)` → API → store token → set state.
  - `register(input)` → API → auto-login.
  - `logout()` → best-effort API → clear storage + Query cache + state.
- `src/hooks/useAuth.ts` — re-export from context.

### 5.2 Validation schemas

**Files**
- `src/schemas/auth.schema.ts` — `loginSchema`, `registerSchema` from spec §8 / blueprint §13.

### 5.3 Reusable form primitives

**Files**
- `src/components/ui/Button.tsx` — variants primary/secondary/ghost/danger, loading, haptics.
- `src/components/ui/Input.tsx` — label, error, helperText, leftIcon; wraps `TextInput`; min height 44pt.
- `src/components/ui/Toast.tsx` — wrapper around `react-native-toast-message`.
- Mount `<Toast />` in `app/_layout.tsx` root.

### 5.4 Login + Register screens

**Files**
- `app/(auth)/login.tsx` — `useForm({ resolver: zodResolver(loginSchema) })`. On submit call `auth.login`. Field errors from `error.fields`; top-level message into toast. `KeyboardAvoidingView`. Link to `/register`.
- `app/(auth)/register.tsx` — same shape with `registerSchema` + password strength hint.

### 5.5 Settings → Logout

**Files**
- `app/(app)/settings.tsx` — show user email/username; theme toggle; Logout button calls `auth.logout()`.

### 5.6 Verify

- ✅ Register flow creates a user and auto-logs in.
- ✅ Wrong-password login surfaces the toast message but **not** which field was wrong.
- ✅ Killing and re-opening the app keeps the session.
- ✅ Manually deleting the SecureStore token (via debug helper) → next request returns 401 → user lands on `/login`.
- ✅ Logout clears storage, Query cache, redirects to `/login`.

---

## Phase 6 — Todo screens

### 6.1 React Query hooks

**Files**
- `src/hooks/useTodos.ts` — from blueprint §9:
  - `useTodoList(status)` (`useQuery`).
  - `useCreateTodo`, `useUpdateTodo`, `useDeleteTodo` with **optimistic updates + rollback** (`onMutate` snapshot, `onError` restore, `onSettled` invalidate).
  - Query key: `['todos', 'list', status]`.

### 6.2 Components

**Files**
- `src/components/ui/Card.tsx` — rounded-2xl, hairline border, soft shadow, 16pt padding.
- `src/components/ui/Skeleton.tsx` — Reanimated shimmer block.
- `src/components/ui/EmptyState.tsx` — illustration placeholder + heading + CTA.
- `src/components/ui/Badge.tsx` — pill variants.
- `src/components/todos/FilterTabs.tsx` — segmented control: All / Active / Completed.
- `src/components/todos/TodoItem.tsx` — checkbox toggle, inline title, trailing delete; optimistic via `useUpdateTodo` / `useDeleteTodo`.
- `src/components/todos/TodoForm.tsx` — title + description inputs validated by `createTodoSchema`.

### 6.3 Dashboard

**Files**
- `app/(app)/index.tsx`:
  - Header with user avatar/menu.
  - `<FilterTabs />` controlling local `status` state.
  - `<FlatList>` of `<TodoItem />` with `RefreshControl` (pull-to-refresh = `refetch`).
  - Skeletons during initial load (3–5 placeholder cards).
  - `<EmptyState />` when zero items.
  - FAB at bottom-right → router push to a modal route `/(app)/todos/new` (or local modal state).

### 6.4 Detail screen

**Files**
- `app/(app)/todos/[id].tsx`:
  - Fetch todo by id (`useQuery`).
  - Form to edit title / description / completed.
  - Delete button with confirm action sheet (`Alert.alert`).
  - On save → `useUpdateTodo` → navigate back.

### 6.5 Schemas

**Files**
- `src/schemas/todos.schema.ts` — `createTodoSchema`, `updateTodoSchema` from spec §8.

### 6.6 Verify

- ✅ Create a todo on a real device; appears in list immediately (optimistic).
- ✅ Toggle completion → instant UI update; survives refetch.
- ✅ Delete with airplane mode on → reverts on failure.
- ✅ Pull-to-refresh works.
- ✅ Empty state visible after deleting all todos.
- ✅ Filter tabs change the visible set; pagination fetches more if seeded with > limit.

---

## Phase 7 — State + UX polish

### 7.1 Animations

**Files**
- Apply `Layout` / `FadeIn` / `FadeOut` from `react-native-reanimated` to `<TodoItem />` so insert/remove animates.

### 7.2 Toasts everywhere

- Surface `error.message` from every mutation `onError`.
- Success toasts on create/delete (light haptic).

### 7.3 Theme polish

**Files**
- `src/context/ThemeContext.tsx`:
  - Modes: `system | light | dark`, persisted in AsyncStorage under `todo.theme`.
  - Apply by setting NativeWind class on root view.
- `app/(app)/settings.tsx` — theme picker.

### 7.4 Haptics

- Light impact on toggle / create / save.
- Notification haptic (warning) on mutation error.

### 7.5 Keyboard + safe areas

- `KeyboardAvoidingView` (behavior `padding` iOS, `height` Android) on Login, Register, TodoForm, Detail.
- Verify all screens use `useSafeAreaInsets` or `SafeAreaView` for top/bottom.

### 7.6 Verify

- ✅ List mutations animate smoothly (no layout jank).
- ✅ Theme toggle persists across restart.
- ✅ Toggling system theme while app is open updates UI when mode is `system`.
- ✅ Notch/home-indicator clearance correct on iPhone 14+, Pixel 7+.

---

## Phase 8 — Web parity review

### 8.1 Visual diff session

- Open the web app at `http://localhost:5173` next to the Expo Go preview.
- For each shared concept (Login form, Dashboard list row, Empty state, Toast, Buttons, Cards), screenshot side-by-side in light + dark.

### 8.2 Resolve drift

**Likely tweaks**
- Color values (slate-500 vs slate-400 in dark mode).
- Card corner radius (web `rounded-xl` = 12px vs mobile `rounded-2xl` = 28px — pick one).
- Button padding.
- Empty state copy strings.

### 8.3 Verify

- ✅ Spot-check screenshots show no jarring inconsistencies.
- ✅ Identical empty-state and error-message copy.

---

## Phase 9 — Device testing

### 9.1 Targets

- iOS Simulator (Xcode).
- Android Emulator (AVD).
- ≥ 1 physical device on Expo Go.

### 9.2 Test matrix per device

- Cold start when logged out → lands on Login.
- Register → auto-login → lands on Dashboard.
- Logout → back to Login.
- Login → kill app → reopen → still logged in.
- Toggle airplane mode → optimistic create → list rolls back, toast fires.
- Pull-to-refresh.
- Navigate to detail → edit → delete (with confirm).
- Filter tabs each show correct subset.
- Theme toggle (system/light/dark).
- Manually expire token (set bogus value via debug action, or wait 15 min) → next call 401 → redirected to Login.

### 9.3 Verify

- ✅ All cells in the matrix pass on at least the physical device.
- ✅ No console warnings about reanimated, gesture handler, or unhandled promise rejections.

---

## Phase 10 — Hardening

### 10.1 Security review

- Grep for `console.log` near token / Authorization → remove.
- Confirm `tokenStorage` is the only path that touches SecureStore.
- Confirm 401 interceptor clears state reliably (test by mutating token in storage).

### 10.2 Production env enforcement

**Files**
- `src/config/env.ts` — when `NODE_ENV === 'production'` (or `app.config.ts` flag), require `apiUrl` to start with `https://`. Fail boot otherwise.

### 10.3 Quality gates

**Commands**
```bash
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
npx jest --coverage
npm audit --omit=dev
```

**Targets** (from spec §15):
- services + hooks ≥ 80% coverage
- components ≥ 60%
- utils 100%

### 10.4 (Optional) EAS preview build

**Commands**
```bash
npm i -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

### 10.5 Verify (final)

Walk the entire **§17 Acceptance Criteria** in `spec.md`. Tick each box.

---

## Concurrency & Parallelization Notes

Phases that **can overlap if multiple developers**:

| Track A (one dev)         | Track B (parallel)                                              |
|---------------------------|-----------------------------------------------------------------|
| Phase 1 → 2 → 3           | (idle — bootstrapping is sequential)                            |
| Phase 4 (backend changes) | Phase 5.2 + 5.3 (schemas + UI primitives) on a feature branch   |
| Phase 5.1 + 5.4           | Phase 6.2 (todo components) — mock data until 6.1 lands         |
| Phase 6.1 + 6.3 + 6.4     | Phase 7.3 (theme persistence) is independent                    |
| Phase 8 + 9               | Phase 10.1 + 10.2 (security review + env enforcement)           |

Solo developer: do strictly top-to-bottom.

---

## Risk Log (live during implementation)

Track these here as they materialize:

- [ ] LAN reachability fails → fall back to `npx expo start --tunnel`.
- [ ] Reanimated red-screens on first run → confirm plugin is **last** in `babel.config.js`.
- [ ] `expo-secure-store` errors on Web → don't ship to web; guard with `Platform.OS !== 'web'` if a web preview is unavoidable.
- [ ] Token leaking into Reactotron / Flipper logs → redact before merge.
- [ ] Backend `auth.mw.ts` change inadvertently breaks cookie-only web requests → integration tests in Phase 4.5 must pass.

---

## Done Definition

The plan is complete when:
1. All Phase 1–10 verifications tick green.
2. `spec.md §17` acceptance checklist is fully ticked.
3. Web app continues to pass its own acceptance checklist (no regressions from §4 backend changes).
4. README updated with run instructions for both emulator and physical-device flows.

---

**Status:** Plan ready — execute Phase 1.

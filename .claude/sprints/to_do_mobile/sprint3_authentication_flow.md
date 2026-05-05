# Sprint 3 — Authentication Flow

> Part of to_do_mobile. Derived from: spec §8, §10, §11.4 (component primitives), §13; plan Phase 5.
> Estimated duration: 1 week.
> Depends on: Sprint 2 (API client, token storage, backend `Authorization` support).

---

## Goal

Replace the stub `AuthContext` with the real one: users can register, log in, and log out; the JWT survives app restart; an expired or tampered token redirects them back to `/login`. Form validation matches the backend rules and surfaces field-level errors next to inputs.

## Scope (in)

- Real `AuthContext` with `'loading' | 'authenticated' | 'unauthenticated'` state machine.
- Cold-start rehydrate via `/auth/me`.
- Login screen with `react-hook-form` + `loginSchema`, field-level errors, toast for top-level errors.
- Register screen with `registerSchema` and password strength hint.
- Logout from Settings clears SecureStore + Query cache + state.
- UI primitives needed for forms: `Button`, `Input`, `Toast` mount.
- Wired into existing route gating from Sprint 1.

## Scope (out)

- Refresh tokens (deferred to v2, per spec §19).
- Biometric unlock (v2).
- Todo screens / data (Sprint 4).
- Theme picker UI (Sprint 5).

## Prerequisites

- Sprint 2 complete: API client returns normalized errors; backend accepts `Authorization: Bearer`.
- A registered test user exists, or the backend permits new registrations (it does, per spec §4).
- `react-native-toast-message` already installed in Sprint 1.

## Tasks

1. **Build auth validation schemas**
   - Files: `src/schemas/auth.schema.ts`.
   - Action: `loginSchema` and `registerSchema` per spec §8 — mirror backend Zod rules (email lowercase+trim, password 8–72 with upper/lower/digit/symbol, username 3–20 `[a-zA-Z0-9_]`). Export `LoginInput` / `RegisterInput` via `z.infer`.
   - Verify: unit tests assert that weak passwords and bad usernames fail; `"  Foo@Example.COM  "` normalizes to `"foo@example.com"`.

2. **Build `Button`, `Input`, `Toast` UI primitives**
   - Files: `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Toast.tsx`; mount toaster in `app/_layout.tsx`.
   - Action: `Button` variants primary/secondary/ghost/danger, sizes, `loading` state, light haptic on press. `Input` exposes `label`, `error`, `helperText`, `leftIcon`; min height 44pt. `Toast` is a thin wrapper around `react-native-toast-message`.
   - Verify: a storybook screen (or the login screen draft) shows all variants in light + dark.

3. **Replace `AuthContext` stub with real implementation**
   - Files: `src/context/AuthContext.tsx`, `src/hooks/useAuth.ts`.
   - Action: full impl from blueprint §10.2 — on mount read token, call `/auth/me`, set state; `login`, `register`, `logout` methods. `logout` is best-effort on the network call but always clears local state.
   - Verify: with a valid token in SecureStore, app cold-starts → status flips from `loading` → `authenticated` and user info is available.

4. **Build the Login screen**
   - Files: `app/(auth)/login.tsx`.
   - Action: `useForm({ resolver: zodResolver(loginSchema) })`. On submit call `useAuth().login`. On `ApiError`, set `error.fields` onto the form via `setError`; pass `error.message` to a toast. `KeyboardAvoidingView` + "Don't have an account?" link to `/register`. Remove the Sprint 1 fake-login button.
   - Verify: wrong credentials → toast reads "Invalid credentials" (server's generic message); the screen does **not** indicate which field was wrong.

5. **Build the Register screen**
   - Files: `app/(auth)/register.tsx`.
   - Action: same shape as Login but with `registerSchema`. Show password strength hint (count of satisfied regexes). On success the AuthContext auto-logs the user in.
   - Verify: weak password highlights field with the specific failure (e.g. "symbol required"); duplicate email returns `CONFLICT` and surfaces under the email input.

6. **Wire Logout into Settings**
   - Files: `app/(app)/settings.tsx`.
   - Action: show `user.username` and `user.email` from `useAuth()`. Logout button calls `auth.logout()` then navigates to `/(auth)/login`. Also calls `queryClient.clear()` to reset cached data (will matter from Sprint 4 onward).
   - Verify: Logout returns to `/login`; SecureStore key `todo.jwt` is empty afterwards.

7. **Cold-start rehydrate end-to-end**
   - Action: log in on a real device; force-quit the app; reopen.
   - Verify: app boots straight into `/(app)` without flashing the login screen (splash is held until `status` resolves).

8. **Token-expiry / 401 cleanup**
   - Action: with the app running and authenticated, manually corrupt the stored token (debug helper that writes garbage to SecureStore). Trigger any authenticated request.
   - Verify: response interceptor receives 401 → clears SecureStore → AuthContext flips to `unauthenticated` → user lands on `/(auth)/login`.

## Definition of Done

- [ ] All Sprint 1 + Sprint 2 Definition of Done items still pass.
- [ ] Schema unit tests green.
- [ ] Register a brand-new user from the device → land on Dashboard placeholder.
- [ ] Wrong-password message is generic (no field-specific reveal).
- [ ] Duplicate-email register surfaces under the email input.
- [ ] Force-quit + reopen keeps the user logged in.
- [ ] Corrupt-token test redirects to `/login`.
- [ ] Logout clears SecureStore (`null` on next read) and Query cache.
- [ ] No token value appears in `console.log`, Reactotron, or Metro logs (manual grep).

## Risks & Mitigations

| Risk                                                          | Mitigation                                                              |
|---------------------------------------------------------------|-------------------------------------------------------------------------|
| Brief login-screen flash on cold start before rehydrate       | Hold splash until `status !== 'loading'` (per spec §10.3); don't render `(app)` while loading. |
| Form errors don't map to inputs                               | Standardize on `error.fields[fieldName]` from the normalized `ApiError`; `setError(name, { message: fields[name][0] })` in a small helper. |
| AuthContext + React Query cache get out of sync after logout  | `logout()` calls both `tokenStorage.clear()` **and** `queryClient.clear()`. |
| 401 fires while user is mid-keystroke in a form               | Interceptor only redirects via state change, not via direct navigation, so the form unmounts naturally. |

## Demo script

1. Open the app (cold start, never logged in) → `/login` appears.
2. Tap "Don't have an account?" → register a new user with a valid password.
3. Observe auto-login → Dashboard placeholder.
4. Force-quit the app, reopen → directly on Dashboard placeholder (no login flash).
5. Open Settings → tap Logout → returns to `/login`.
6. Try logging in with the wrong password → toast reads "Invalid credentials"; no field highlight.
7. Log in with the correct password → Dashboard.
8. (Debug) Trigger token corruption → next request bounces to `/login`.

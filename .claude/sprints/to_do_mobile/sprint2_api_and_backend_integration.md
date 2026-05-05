# Sprint 2 — API Layer and Backend Integration

> Part of to_do_mobile. Derived from: spec §4, §5, §7, §9; plan Phases 3–4.
> Estimated duration: 1 week.
> Depends on: Sprint 1 (foundation, providers, env config).

---

## Goal

Stand up a typed API client that talks to the existing backend, and apply the four backwards-compatible backend changes that let the mobile app authenticate with `Authorization: Bearer <jwt>` — verified by hitting `/auth/me` from a real device and getting a normalized 401.

## Scope (in)

- Typed shared types (`User`, `Todo`, `ApiError`, `Paginated<T>`).
- `tokenStorage` wrapper around `expo-secure-store`.
- Axios instance with request/response interceptors (auth header, 401 cleanup, error normalization).
- `auth.api.ts` and `todos.api.ts` resource modules with typed responses.
- Unit tests for `normalizeApiError`.
- Backend edits in `../To_do_web/server`: Bearer-header fallback, login-returns-token, CORS allowlist, bind `0.0.0.0`.
- Smoke verification: phone hits `/auth/me` and observes a normalized 401.

## Scope (out)

- Real login/register UI (Sprint 3).
- React Query hooks for todos (Sprint 4).
- AuthContext rehydrate logic — still a stub from Sprint 1 (full impl in Sprint 3).

## Prerequisites

- Sprint 1 complete and merged.
- Write access to `../To_do_web/server`.
- Web app at `http://localhost:5173` runs and passes its own register/login/CRUD flow against the backend (baseline before changes).
- LAN IP of dev machine known; phone confirmed reachable to backend `:4000` (per Sprint 1 risk log).

## Tasks

1. **Add shared types**
   - Files: `src/types/user.ts`, `src/types/todo.ts`, `src/types/api.ts`.
   - Action: Copy verbatim from spec §7. Brand `UserId` and `TodoId` per spec §14.
   - Verify: `npx tsc --noEmit` passes; types importable via `@/types/*`.

2. **Implement token storage**
   - Files: `src/services/token.storage.ts`.
   - Action: copy from blueprint §10.1 — `get`, `set`, `clear` wrapping `expo-secure-store`, key `todo.jwt`, `keychainAccessible: AFTER_FIRST_UNLOCK`.
   - Verify: from a debug button, `set("hello")` then `get()` returns `"hello"`; `clear()` returns `null` on next `get()`.

3. **Build axios client + interceptors**
   - Files: `src/api/client.ts`.
   - Action: copy from blueprint §8.1. `baseURL: env.apiUrl`, `timeout: 10_000`. Request interceptor pulls token from storage and sets `Authorization: Bearer <token>` if present. Response interceptor: on 401 clear storage; reject with `normalizeApiError(err)`.
   - Verify: a request without a token shows no `Authorization` header; with a token it appears.

4. **Implement error normalizer**
   - Files: `src/api/errors.ts`, `src/api/__tests__/errors.test.ts`, `jest.config.js`.
   - Action: copy `normalizeApiError` from blueprint §8.2. Tests cover `AxiosError` with `response.data.error`, `AxiosError` with no `response` (network failure), and a plain `Error`. `jest.config.js` uses `jest-expo` preset.
   - Verify: `npx jest src/api` passes all three cases.

5. **Build resource modules**
   - Files: `src/api/auth.api.ts`, `src/api/todos.api.ts`.
   - Action: copy from blueprint §8.3. Return `data.data` payloads with explicit generics so call sites get `User`, `Todo[]`, etc.
   - Verify: `authApi.me`, `todosApi.list`, etc. all typecheck against the types from Task 1.

6. **Backend: header fallback in `auth.mw.ts`**
   - Files: `../To_do_web/server/src/presentation/middleware/auth.mw.ts`.
   - Action: per spec §5.1 — read token from cookie first, fall back to `Authorization: Bearer <token>`; throw `UNAUTHORIZED` only if both are absent.
   - Verify: backend integration tests `cd ../To_do_web/server && npm test` still pass.

7. **Backend: return token in login response**
   - Files: `../To_do_web/server/src/presentation/controllers/auth.ctrl.ts` (login handler).
   - Action: per spec §5.2 — keep `res.cookie('access', token, …)`, also include `token` in `res.json({ data: { user, token } })`.
   - Verify: `curl` against `/auth/login` returns both `Set-Cookie` and `data.token`.

8. **Backend: CORS allowlist + bind 0.0.0.0**
   - Files: `../To_do_web/server/.env`, `../To_do_web/server/src/presentation/app.ts`, `../To_do_web/server/src/server.ts`.
   - Action: comma-separated `CORS_ORIGIN`, allowlist function in `app.ts` (per spec §5.3), `app.listen(env.PORT, '0.0.0.0', …)` (or omit host).
   - Verify: phone browser hits `http://<LAN-IP>:4000/healthz` → 200.

9. **Re-verify the web app**
   - Action: with all four backend edits applied, walk register → login → logout → full CRUD on `http://localhost:5173`.
   - Verify: no regressions vs. the baseline captured in Prerequisites.

10. **Smoke-test the mobile API layer end-to-end**
    - Files: temporary debug button in `app/(auth)/login.tsx`.
    - Action: button calls `authApi.me()` and toasts the normalized error code + message.
    - Verify: with no token, toast reads `UNAUTHORIZED`; with backend killed, toast reads `NETWORK_ERROR`.

## Definition of Done

- [ ] `npx jest src/api` passes (≥ 3 normalizer cases).
- [ ] `npx tsc --noEmit` and ESLint clean.
- [ ] Backend integration tests still green after spec §5 edits.
- [ ] Web app's full register/login/CRUD flow still passes (no regressions).
- [ ] From a physical device on Expo Go, the debug button surfaces a normalized 401 and a normalized network error.
- [ ] All Sprint 1 Definition of Done items still pass (no regressions).
- [ ] No `Authorization` header values appear in any log output.

## Risks & Mitigations

| Risk                                                              | Mitigation                                                            |
|-------------------------------------------------------------------|-----------------------------------------------------------------------|
| Header-fallback edit breaks cookie-only requests                  | Task 9 explicitly re-runs the web flow before sprint closes.          |
| LAN AP isolation on the test Wi-Fi                                | Use a personal hotspot or `npx expo start --tunnel` (note: tunnel needs the backend publicly reachable). |
| Login response shape change breaks web client expectations        | Web ignores body fields it doesn't read — adding `token` is additive; test in Task 9. |
| Env mismatch (`EXPO_PUBLIC_API_URL` points at wrong target)       | Verify the matrix in spec §6: `localhost` (iOS sim), `10.0.2.2` (AVD), LAN IP (device). |

## Demo script

1. Backend running on dev machine, bound to `0.0.0.0:4000`, with all four spec §5 edits.
2. Web app at `http://localhost:5173` — perform register + login + create todo. Confirm it still works.
3. From a `curl` shell:
   ```
   curl -i -X POST http://<LAN-IP>:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"<existing>","password":"<existing>"}'
   ```
   Observe: 200 response includes both `Set-Cookie: access=…` and `"token": "<jwt>"` in JSON.
4. Open the mobile app on a real device via Expo Go.
5. Tap the debug "Ping /auth/me" button → toast displays `UNAUTHORIZED` (normalized 401, since no token is stored).
6. Stop the backend, tap again → toast displays `NETWORK_ERROR`.

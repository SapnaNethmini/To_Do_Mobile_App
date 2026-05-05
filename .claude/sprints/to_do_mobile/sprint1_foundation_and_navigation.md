# Sprint 1 — Foundation and Navigation

> Part of to_do_mobile. Derived from: spec §2–§6, §11–§12, §14, §16; plan Phases 1–2.
> Estimated duration: 1 week.
> Depends on: none.

---

## Goal

Bootstrap a strict-TypeScript Expo app with the locked stack installed, theme tokens loaded, and a redirect-gated navigation shell so an unauthenticated user lands on `/login` and a (faked) authenticated user lands on the Dashboard.

## Scope (in)

- Initialized Expo SDK ≥ 50 + TypeScript project at the repo root.
- All locked dependencies installed (Expo Router, React Query, axios, Zod, react-hook-form, SecureStore, Reanimated, gesture handler, safe-area-context, vector-icons, Inter font, `expo-linear-gradient`, AsyncStorage, Toast).
- `app.config.ts`, `babel.config.js` (Reanimated plugin **last**), `metro.config.js` configured. **No NativeWind, no Tailwind.**
- Strict `tsconfig.json` with `@/*` path alias; ESLint + Prettier configured.
- Theme module (`palette.ts`, `theme.ts`, `spacing.ts`, `radii.ts`, `typography.ts`, `shadows.ts`, `useTheme.ts`, `recipes.ts`) extracted from the web app's Tailwind config + `client/src/index.css` recipes. All component styles use `StyleSheet.create` + the theme module.
- Validated env config (`src/config/env.ts`) reading `EXPO_PUBLIC_API_URL`.
- Provider tree at `app/_layout.tsx` (GestureHandler → SafeArea → QueryClient → Auth stub → Theme stub → Slot).
- Route groups `(auth)` and `(app)` with redirect-gated `_layout.tsx` files.
- Placeholder screens: `(auth)/login`, `(auth)/register`, `(app)/index`, `(app)/todos/[id]`, `(app)/settings`, `+not-found`.

## Scope (out)

- Real auth (Sprint 3).
- Real API calls (Sprint 2).
- Todo CRUD UI (Sprint 4).
- Dark-mode persistence and animations (Sprint 5).

## Prerequisites

- Node.js LTS ≥ 20, npm ≥ 10.
- Expo Go installed on a physical phone, **or** Android Studio AVD / Xcode iOS Simulator available.
- Existing backend at `../To_do_web/server` runs on `:4000` and `/healthz` is reachable from the test device's network (per plan Pre-flight).

## Tasks

1. **Initialize Expo TS app**
   - Files: `package.json`, `tsconfig.json`, `app.json` (created by template).
   - Action: `npx create-expo-app@latest . --template blank-typescript`.
   - Verify: `npx expo start` opens DevTools without errors.

2. **Install locked dependencies**
   - Files: `package.json`, `package-lock.json`.
   - Action: run the three install blocks from `create_plan.md` step 1.2 (expo-* via `npx expo install`, runtime deps via `npm i`, dev deps via `npm i -D`).
   - Verify: `npm ls --depth=0` shows no `UNMET` warnings.

3. **Configure Expo, Babel, Metro**
   - Files: `app.config.ts` (replaces `app.json`), `babel.config.js`, `metro.config.js`.
   - Action: per spec §6 and `create_plan.md` step 1.3 — `scheme: "todo"`, `plugins: ["expo-router", "expo-secure-store"]`, `experiments.typedRoutes: true`, `extra.apiUrl` from env, Reanimated plugin **last** in `babel.config.js`. Standard Expo Metro config (`getDefaultConfig(__dirname)`) — no NativeWind preset, no Tailwind, no `withNativeWind` wrapper, no `global.css`.
   - Verify: `npx expo start --clear` boots without parser errors; a placeholder `<View style={{ backgroundColor: '#fff', flex: 1 }} />` renders.

4. **Lock TypeScript strictness + path aliases**
   - Files: `tsconfig.json`, `.eslintrc.js`, `.prettierrc`, `.gitignore`.
   - Action: extend `expo/tsconfig.base`; set `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`; add `paths: { "@/*": ["src/*"] }`. ESLint extends `expo` and forbids `any`. `.gitignore` covers `.env`, `.expo`, `dist`, `node_modules`, native build dirs.
   - Verify: `npx tsc --noEmit` passes on the empty skeleton.

5. **Build the theme module and load Inter font**
   - Files: `src/theme/palette.ts`, `src/theme/theme.ts`, `src/theme/spacing.ts`, `src/theme/radii.ts`, `src/theme/typography.ts`, `src/theme/shadows.ts`, `src/theme/useTheme.ts`, `src/theme/recipes.ts`, `src/theme/index.ts`. Load Inter (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`) via `expo-font` + `@expo-google-fonts/inter`, holding splash until fonts ready.
   - Action: copy values verbatim from spec §12 / blueprint §11.1 (palette extracted from `../To_do_web/client/tailwind.config.cjs` + `client/src/index.css` — Slate / Indigo / Violet / Emerald / Red, only the steps the web recipes actually use). `useTheme()` returns `themes[useColorScheme() ?? 'light']`. `recipes.ts` mirrors web's `.card`, `.btn-primary` (gradient via `expo-linear-gradient`), `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.input`, `.badge-open`, `.badge-done`, `.alert-error`. Add a leading comment in `palette.ts` pointing at the web source files for traceability.
   - Verify: `import { useTheme, palette, spacing, radii, recipes } from '@/theme'` resolves; a sample `<View style={recipes.cardStyle(useTheme())} />` renders correctly in light and dark via system theme switch.

6. **Validate env at boot**
   - Files: `.env.example`, `src/config/env.ts`.
   - Action: `.env.example` content per spec §6. `env.ts` reads `Constants.expoConfig?.extra` and Zod-validates `apiUrl: z.string().url()`.
   - Verify: invalid URL → app fails fast with a clear error; valid URL → `console.log(env.apiUrl)` prints expected value.

7. **Build provider tree**
   - Files: `app/_layout.tsx`, `src/config/queryClient.ts`, `src/context/AuthContext.tsx` (stub), `src/context/ThemeContext.tsx` (stub).
   - Action: providers in this nesting order — `GestureHandlerRootView` → `SafeAreaProvider` → `QueryClientProvider` → `AuthProvider` (stub with `status: 'loading' | 'authenticated' | 'unauthenticated'`, fake toggle for now) → `ThemeProvider` → `Slot`. Hold splash via `expo-splash-screen` until Inter loads + auth status resolves.
   - Verify: app boots; provider order shown in React DevTools tree.

8. **Add route groups with auth gating**
   - Files: `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(app)/_layout.tsx`, `app/(app)/index.tsx`, `app/(app)/todos/[id].tsx`, `app/(app)/settings.tsx`, `app/+not-found.tsx`.
   - Action: `(app)/_layout.tsx` returns `null` while loading, `<Redirect href="/(auth)/login" />` when unauthenticated, `<Stack />` when authenticated. `(auth)/_layout.tsx` symmetrically redirects authenticated users to `/(app)`. Login screen shows a "Fake login" button that flips the stub auth state.
   - Verify: cold start → `/login`; tap fake login → `/(app)`; deep link to `/(app)` while logged out → bounced to `/login`.

## Definition of Done

- [ ] `npx expo start` boots cleanly; QR opens in Expo Go on a real device.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npx eslint . --ext .ts,.tsx` passes.
- [ ] All eight tasks above complete.
- [ ] Folder layout matches spec §3 (`app/`, `src/api`, `src/components`, `src/config`, `src/context`, `src/hooks`, `src/services`, `src/theme`, `src/schemas`, `src/types`, `src/utils` — even if some are empty stubs).
- [ ] No native module warnings (Reanimated, gesture handler) in the Metro logs.
- [ ] Cold start lands on `/login`; fake auth toggle reaches `/(app)`; refresh stays on `/login` when logged out.

## Risks & Mitigations

| Risk                                                          | Mitigation                                                                 |
|---------------------------------------------------------------|----------------------------------------------------------------------------|
| Reanimated red-screens on first run                           | Confirm `react-native-reanimated/plugin` is the **last** entry in `babel.config.js`; run `npx expo start --clear`. |
| Theme tokens drift from web on visual review (Sprint 5)       | Single source of truth in `src/theme/palette.ts` with a comment pointing at `../To_do_web/client/tailwind.config.cjs` and `client/src/index.css` so future syncs stay traceable. |
| LAN networking can't reach laptop from the device             | Fall back to `npx expo start --tunnel`; defer real network test to Sprint 2. |
| `expoConfig.extra` missing on first boot                      | `env.ts` Zod parse fails fast — fix `app.config.ts` rather than catching.   |

## Demo script

1. Run `npx expo start` from the project root.
2. Scan the QR code with Expo Go on a phone.
3. Observe: app boots to a "Login" screen with a "Fake login" button.
4. Tap **Fake login** → app routes to the placeholder Dashboard screen.
5. Quit and relaunch the app → returns to "Login" (no persistence yet — that's Sprint 3).
6. Switch system theme to dark → background tone updates (theme tokens applied).

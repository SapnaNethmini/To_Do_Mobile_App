# Sprint 5 — UX Polish and Web Parity

> Part of to_do_mobile. Derived from: spec §11.4–§11.5 (UX must-haves), §12 (theme + dark mode), §17 (parity items); plan Phases 7–8.
> Estimated duration: 1 week.
> Depends on: Sprint 4 (working CRUD on the dashboard + detail screens).

---

## Goal

Take the working app from "functionally correct" to "feels right and matches the web app" — animated list mutations, persistent dark mode with an in-app toggle, success/error toasts everywhere, haptics, and a side-by-side visual diff against the web client to close any drift in colors, spacing, copy, and component shapes.

## Scope (in)

- Reanimated `Layout` / `FadeIn` / `FadeOut` transitions on todo insert/remove.
- Toasts for every mutation success and failure.
- Light haptics on toggle/create/save; warning haptic on errors.
- Real `ThemeContext`: `system | light | dark` with AsyncStorage persistence under `todo.theme`.
- Theme picker UI in Settings.
- `KeyboardAvoidingView` audited on every form-bearing screen (Login, Register, TodoForm, Detail).
- Safe-area audit on all screens (notched devices).
- Web parity diff session: screenshot the web app and the mobile app side-by-side in light + dark, fix drift in tokens, copy, and component shapes.

## Scope (out)

- Multi-device test matrix (Sprint 6).
- Production hardening, env asserts, audits (Sprint 6).
- New features beyond what Sprint 4 already shipped.

## Prerequisites

- Sprint 4 complete and demoable.
- Web app running locally so it can be screenshot for parity comparisons.
- Test devices: at least one phone with a notch / home indicator (iPhone 14+ or modern Android).

## Tasks

1. **Animate todo insert/remove**
   - Files: `src/components/todos/TodoItem.tsx`, `app/(app)/index.tsx` (FlatList item wrapper).
   - Action: wrap each row in an `Animated.View` with `entering={FadeIn.duration(180)}` and `exiting={FadeOut.duration(150)}`. Use Reanimated `Layout` so reordering animates. Keep animations short and on the UI thread (`worklet`s).
   - Verify: creating a todo fades it in; deleting fades it out without dropping frames; toggling `completed` doesn't reflow the list jankily.

2. **Toasts everywhere**
   - Files: `src/hooks/useTodos.ts` (mutation `onError` / `onSuccess`), other mutation call sites.
   - Action: success toast on create / save / delete (short, present-tense — "Todo created", "Todo deleted"). Error toast surfaces `error.message` from the normalized `ApiError`. Add a small helper `toastError(err: ApiError)` so this stays one-line at call sites.
   - Verify: every mutation result either shows a toast or is silent by deliberate choice (toggle is silent; create/delete show success toasts).

3. **Add haptics**
   - Files: any component triggering meaningful actions; `src/utils/haptics.ts` for a thin wrapper.
   - Action: light impact on toggle/create/save (`Haptics.impactAsync(ImpactFeedbackStyle.Light)`); warning notification on error (`Haptics.notificationAsync(NotificationFeedbackType.Warning)`); none on logout/navigation.
   - Verify: real-device tap on the checkbox produces a subtle vibration; failure produces a stronger one.

4. **Real `ThemeContext` with persistence**
   - Files: `src/context/ThemeContext.tsx`, `app/_layout.tsx` (apply NativeWind class on root view based on resolved mode).
   - Action: state is `'system' | 'light' | 'dark'`. Persist user choice in AsyncStorage under key `todo.theme`. Resolve to actual `light/dark` by reading `useColorScheme()` when mode is `system`. Expose `mode`, `setMode`, and the resolved `colorScheme`.
   - Verify: kill app with mode set to `dark`; relaunch → app boots in dark before any flash; toggle iOS / Android system theme while mode is `system` → app updates live.

5. **Theme picker in Settings**
   - Files: `app/(app)/settings.tsx`.
   - Action: segmented control with three options (System / Light / Dark) bound to `setMode`. Show currently resolved scheme as a small subtitle so users see what System resolves to.
   - Verify: switching the toggle updates the entire app immediately and persists across app restart.

6. **Keyboard handling audit**
   - Files: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(app)/todos/[id].tsx`, the create-todo modal route.
   - Action: each form-bearing screen wrapped in `KeyboardAvoidingView` (`behavior='padding'` iOS, `'height'` Android). Inputs use `returnKeyType='done'` (single-line) or `'next'` chaining. "Done" key submits the form on the final input.
   - Verify: on a physical phone, the keyboard never covers the active input; tapping Done submits.

7. **Safe-area audit**
   - Files: every screen file under `app/`.
   - Action: ensure the top header respects `useSafeAreaInsets().top` (or use `<SafeAreaView edges={['top']}>`). FAB on Dashboard sits above the home indicator (`bottom` inset). Modal headers don't collide with the notch.
   - Verify: visual check on at least one notched iOS device and one Android with on-screen home bar.

8. **Web parity diff session**
   - Action: with the web app at `http://localhost:5173` and Expo Go on a phone (or simulator), capture matched screenshots in both light and dark for: Login, Register, Dashboard (with rows), Empty state, Detail, Settings, Toast, Buttons (all variants), Cards.
   - Likely tweaks (per spec §11):
     - Slate-500 vs slate-400 for muted text in dark mode.
     - Button corner radius and padding.
     - Empty-state copy (must match web verbatim).
     - Card shadow vs flat in dark mode.
     - Filter tab pill shape.
   - Verify: a colleague who hasn't seen the work can flip between web and mobile screenshots without spotting jarring differences.

9. **Run the existing Sprint 1–4 verification suite**
   - Action: re-run unit tests and a manual smoke walk on a real device.
   - Verify: no regressions; coverage on `src/components` ≥ 60%.

## Definition of Done

- [ ] Sprint 1–4 Definition of Done items still pass.
- [ ] Inserting / deleting a todo animates smoothly (no layout jank, ≥ 55 fps).
- [ ] Every mutation result has a defined outcome — success toast, error toast, or silent (intentional).
- [ ] Haptics fire on success and error per Task 3.
- [ ] Theme persists across cold start; live system-theme change is reflected when mode is `system`.
- [ ] Theme picker visible in Settings and works.
- [ ] No keyboard covers an active input on any form screen.
- [ ] Safe-area review passed on at least one notched iOS and one modern Android.
- [ ] Web-vs-mobile parity screenshots reviewed; identified drift fixed.
- [ ] Empty-state copy matches the web app verbatim.

## Risks & Mitigations

| Risk                                                              | Mitigation                                                                  |
|-------------------------------------------------------------------|-----------------------------------------------------------------------------|
| Reanimated `Layout` causes flicker on Android                     | Tune `duration`; ensure the parent uses `removeClippedSubviews={false}` for the list during animation. |
| AsyncStorage rehydrate races first paint, causing a theme flash   | Block first paint until theme is resolved (extend the splash-screen hold from Sprint 1). |
| Haptics on every interaction feels noisy                          | Restrict to mutations and errors; never per-keystroke or per-scroll.        |
| Parity drift snowballs into a redesign                            | Time-box the diff session; only tweak tokens and copy, not architecture.    |

## Demo script

1. Log in on a real device. Toggle the system theme — app follows.
2. Open Settings → switch theme to Dark explicitly. Quit and relaunch → still dark.
3. Switch back to System.
4. Create a todo "Pay rent" → fade-in animation; success toast; light haptic.
5. Toggle complete → strikethrough animates; light haptic.
6. Toggle airplane mode on → try to delete the row → row snaps back; warning haptic; error toast.
7. Disable airplane mode → pull-to-refresh.
8. Open the web app side-by-side on a laptop. Compare the dashboard row, the empty state (after deleting all), and the buttons. They look like the same product.
9. Open Login. Type into the password field — the keyboard never covers it. Tap Done → submit fires.

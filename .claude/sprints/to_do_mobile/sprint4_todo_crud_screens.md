# Sprint 4 — Todo CRUD Screens

> Part of to_do_mobile. Derived from: spec §4 (todo endpoints), §7–§8, §9 (state), §10 (FlatList list), §11.4–§11.5, §12 (screens); plan Phase 6.
> Estimated duration: 2 weeks.
> Depends on: Sprint 3 (working auth + UI primitives).

---

## Goal

Deliver the product's heart: an authenticated user can list (filtered), create, edit, complete, and delete their todos on a real device, with optimistic updates that roll back on network failure and pull-to-refresh that re-syncs from the backend.

## Scope (in)

- React Query hooks: `useTodoList(status)`, `useCreateTodo`, `useUpdateTodo`, `useDeleteTodo` — all four mutations optimistic with rollback.
- `Card`, `Skeleton`, `EmptyState`, `Badge` UI primitives.
- `FilterTabs`, `TodoItem`, `TodoForm` todo components.
- Dashboard (`app/(app)/index.tsx`) with FlatList, filter tabs, FAB to create, pull-to-refresh, skeletons during load, empty state.
- Detail screen (`app/(app)/todos/[id].tsx`) with edit form + delete confirm.
- Cursor pagination on the list (`?limit&cursor`).
- Todo validation schemas (`createTodoSchema`, `updateTodoSchema`) wired into `react-hook-form`.

## Scope (out)

- Visual parity polish vs the web app (Sprint 5).
- Reanimated layout transitions on insert/remove (Sprint 5).
- Dark-mode persistence + theme toggle UI (Sprint 5).
- Offline writes (deferred to v2).

## Prerequisites

- Sprint 3 complete: authenticated user can reach `(app)` reliably.
- Backend's todo endpoints already verified by the web app per spec §4.
- Test account has at least 0 todos (start fresh) and the ability to create > `limit` to exercise pagination.

## Tasks

1. **Add todo schemas**
   - Files: `src/schemas/todos.schema.ts`.
   - Action: `createTodoSchema` (`title` 1–120 trimmed, `description?` ≤ 1000), `updateTodoSchema` (same fields all optional, plus `completed?: boolean`). Export `z.infer` types.
   - Verify: schema unit tests assert empty title rejected, 121-char title rejected, valid input accepted.

2. **Build React Query todo hooks**
   - Files: `src/hooks/useTodos.ts`.
   - Action: copy patterns from blueprint §9. Query key: `['todos', 'list', status]`. Each mutation: `onMutate` snapshots prev → applies optimistic patch; `onError` restores; `onSettled` invalidates the list. `useDeleteTodo` removes by id; `useCreateTodo` prepends.
   - Verify: unit test (with `msw`) — mutation that 500s rolls back the cached list to its pre-mutation state.

3. **Build presentational primitives**
   - Files: `src/components/ui/Card.tsx`, `src/components/ui/Skeleton.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/ui/Badge.tsx`.
   - Action: `Card` rounded-2xl, hairline border, soft shadow (light) / none (dark), 16pt padding. `Skeleton` is an animated shimmer block. `EmptyState` shows icon + heading + body + optional CTA. `Badge` pill variants for filter selection state.
   - Verify: each rendered in both light and dark mode in a dev sandbox or storybook screen.

4. **Build todo-specific components**
   - Files: `src/components/todos/FilterTabs.tsx`, `src/components/todos/TodoItem.tsx`, `src/components/todos/TodoForm.tsx`.
   - Action: `FilterTabs` is a segmented control with All / Active / Completed and a controlled `value`. `TodoItem` shows checkbox + title (strikethrough when completed) + trailing delete icon; tap on row → navigate to detail; checkbox calls `useUpdateTodo` optimistically. `TodoForm` is a controlled `react-hook-form` form with `title` and `description` inputs validated by `createTodoSchema`.
   - Verify: tapping the checkbox flips the strikethrough instantly; restoring backend after a forced 500 reverts the row.

5. **Build the Dashboard**
   - Files: `app/(app)/index.tsx`.
   - Action: header (user avatar + Settings link). Local `status` state controlling `<FilterTabs />`. `<FlatList>` of `<TodoItem />` rendered from `useTodoList(status).data?.items ?? []`. `RefreshControl` calls `refetch`. While first-load is pending, show 3–5 skeleton cards. When list is empty, show `<EmptyState />` (copy and visuals to align with web in Sprint 5; placeholder copy is fine here). FAB at bottom-right opens a modal route (or local modal) hosting `<TodoForm />`.
   - Verify: full create / list / toggle / delete loop runs on a real device.

6. **Build the Detail screen**
   - Files: `app/(app)/todos/[id].tsx`.
   - Action: fetch todo via `useQuery(['todos', 'detail', id], () => todosApi.get(id))` (add `todosApi.get` if not already present). Editable form (`updateTodoSchema`) for title, description, completed. Save → `useUpdateTodo` → navigate back. Delete button shows `Alert.alert` confirm; on confirm → `useDeleteTodo` → navigate back.
   - Verify: editing a todo persists after pull-to-refresh; deleting removes it from the dashboard list.

7. **Cursor pagination**
   - Files: `src/hooks/useTodos.ts` (extend `useTodoList` to `useInfiniteTodoList` or layered hook), `app/(app)/index.tsx` (wire `onEndReached`).
   - Action: use `@tanstack/react-query` `useInfiniteQuery`; `getNextPageParam: last => last.nextCursor`. `<FlatList onEndReached>` triggers `fetchNextPage` when not already fetching.
   - Verify: seed > limit todos via the API; scroll to the end of the list; observe a network call fetching the next page; new rows append.

8. **Smoke test on a real device**
   - Action: walk the Demo script below on a physical phone via Expo Go.
   - Verify: all steps succeed without console errors.

## Definition of Done

- [ ] Sprint 1–3 Definition of Done items still pass.
- [ ] Schema + hook unit tests green; coverage on `src/hooks` ≥ 80%.
- [ ] On a physical device: create, toggle complete, edit title, delete — all visible immediately (optimistic) and reconciled by the backend.
- [ ] Pull-to-refresh works.
- [ ] Filter tabs each show the correct subset.
- [ ] Pagination loads more rows on scroll-to-end when more than `limit` exist.
- [ ] Airplane-mode test: starting a delete with no network → row reappears with toast.
- [ ] Empty state displays after deleting all todos for the user.
- [ ] No "Possible Unhandled Promise Rejection" or Reanimated warnings in Metro logs.

## Risks & Mitigations

| Risk                                                                  | Mitigation                                                                                  |
|-----------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| Optimistic state diverges from server after error                      | Always `invalidateQueries` in `onSettled`, even on success, so the next idle re-fetch reconciles. |
| Pagination state breaks when filter changes                            | Query key includes `status`; switching filter spawns a fresh `InfiniteQuery`.               |
| `FlatList` re-renders all rows on every list change                    | `keyExtractor: t => t.id`, memoize `<TodoItem />` with `React.memo` on `id + completed + title + updatedAt`. |
| Detail screen tries to render before its query resolves                | Show a centered `<Skeleton />` block while `isPending`; treat 404 as "not found" empty state. |
| Backend `/todos/:id` 404 leaks ownership info                          | Spec §4 requires cross-user access to return 404 — UI just shows "Todo not found". Don't add detection logic. |

## Demo script

1. Log in on a real device.
2. Dashboard shows skeleton cards briefly, then the list (or empty state).
3. Tap the FAB → fill title "Buy milk" → Save. Row appears immediately at the top.
4. Tap the row → Detail screen → edit description → Save. Description updates.
5. Pull down on the dashboard → spinner → list re-syncs.
6. Tap the checkbox on "Buy milk" → strikethrough applies instantly.
7. Switch filter to "Completed" → only completed todos remain visible.
8. Switch filter back to "All". Long-press / tap delete on "Buy milk" → confirm → row disappears.
9. Toggle airplane mode on. Try to delete another row → row briefly disappears, then snaps back with an error toast.
10. Disable airplane mode. Pull-to-refresh → state matches the backend.

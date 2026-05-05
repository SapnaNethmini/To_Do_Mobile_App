---
description: Execute a sprint file end-to-end — implement its tasks, verify each, and stop at the Definition of Done
argument-hint: <sprint number or filename> (e.g. "1", "sprint3", or "sprint3_authentication_flow")
---

# /run_sprint

Pick up a sprint file from `.claude/sprints/<project_name>/` and execute it: do the tasks in order, verify each against its acceptance check, and stop only when every item in the sprint's **Definition of Done** is observably true.

User-supplied argument: `$ARGUMENTS` — sprint number (`3`), bare slug (`sprint3`), or full filename (`sprint3_authentication_flow.md`). If empty, **resume** the next unfinished sprint (see Step 1).

---

## Step 1 — Identify the target sprint

1. Resolve `<project_name>` the same way `/create_sprint` does — `package.json:name` if present, otherwise the lowercased + snake_cased project root directory name.
2. List `.claude/sprints/<project_name>/sprint*.md` ordered by `N`.
3. If `$ARGUMENTS` is set:
   - Pure number `N` → match `sprint{N}_*.md` (one file).
   - `sprint{N}` → same.
   - Full filename → use as-is.
   - If no match, **stop** and tell the user which sprints exist.
4. If `$ARGUMENTS` is empty:
   - Find the lowest-numbered sprint whose Definition of Done has any unchecked `- [ ]` item.
   - That's the target. If all sprints are complete, tell the user and exit.

State the resolved target file path before doing anything else.

---

## Step 2 — Load context

Read in this order. Skip whatever doesn't exist; don't guess.

1. The target sprint file (full read).
2. `.claude/specs/spec.md` — spec sections referenced in the sprint header.
3. `.claude/plans/create_plan.md` — phase(s) referenced in the sprint header.
4. `.claude/todo_mobile_blueprint.md` (or repo-root blueprint) — only the sections cited in the sprint or spec.
5. `CLAUDE.md` for guardrails.
6. The previous sprint file, if `N > 1` — its Definition of Done must already be green; if not, **stop** and report the gap (do not run a sprint whose dependencies aren't met).

---

## Step 3 — Confirm prerequisites

Walk the sprint's **Prerequisites** section. For each item:

- If it's an environment claim (`Node ≥ 20`, `Expo Go installed`), verify with a command where possible.
- If it's a dependency claim (`Sprint N-1 complete`), confirm via the prior sprint's Definition of Done.
- If it requires user action (e.g. "EAS account"), surface it and **ask the user to confirm** before continuing.

If anything is unmet that you cannot verify or fix yourself, stop and ask.

---

## Step 4 — Plan execution

Before writing code, restate:

1. The sprint number, title, and goal (one sentence each).
2. The ordered task list (just titles + a phrase each).
3. Any task that requires **destructive or external action** (modifying another repo, running `npm install`, applying backend changes, EAS builds). These warrant explicit confirmation in Step 5.

Use task tracking for the duration of execution: create one task per sprint Task, mark each `in_progress` when you start it, `completed` when its Verify passes. This keeps progress legible if the conversation is long.

---

## Step 5 — Execute tasks in order

For each task in the sprint:

1. **Read the Task block** — note `Files`, `Action`, `Verify`.
2. **Confirmation gate** — for any task that:
   - Modifies files outside the current project (e.g. Sprint 2 touches `../To_do_web/server`).
   - Runs `npm install` / `expo install` / `git push` / EAS build / anything that publishes or rewrites lockfiles.
   - Deletes files or directories.
   …pause and confirm with the user before running.
3. **Apply the action** — write the files exactly. Where the spec or blueprint provides code (axios interceptors, AuthContext, etc.), copy from there rather than reinventing. Keep file size ≤ ~150 lines per the project's rule.
4. **Run the Verify check** — execute the test, command, or behavioral assertion the task specifies. If it requires running the app on a device, prepare the necessary commands (e.g. `npx expo start --tunnel`) and ask the user to confirm the device-side observation.
5. **On failure** — diagnose the root cause; do not silently retry. If the fix is non-trivial or implies a spec change, stop and report.
6. **Move on only when Verify passes.** Update the task list.

Do **not** skip tasks because they look small, and do not reorder them unless a task explicitly says "may run in parallel with X."

---

## Step 6 — Run Definition of Done

After the last task, walk the sprint's **Definition of Done** checklist top to bottom. For each item:

- Verify it concretely (run the command, observe the behavior, read the file).
- Tick the box in the sprint file by editing `- [ ]` → `- [x]`.
- If it cannot be ticked, stop and report which items are open and why. Do **not** mark the sprint complete with unchecked items.

The sprint is closed only when every box is `[x]`.

---

## Step 7 — Report back

Output:

1. The sprint just completed (number + title).
2. A list of files created / modified, with absolute paths.
3. Any tests added and their results.
4. Any deviations from the sprint plan, with rationale.
5. The next sprint to run, derived from the file ordering.
6. A one-line invocation hint: `/run_sprint {N+1}`.

---

## Stopping conditions

You **must stop and surface to the user** (not silently work around) when:

- A prerequisite is not met and cannot be made true automatically.
- A Verify check fails and the fix would change the spec or blueprint.
- A task requires external services (EAS, app stores, third-party APIs) the user hasn't authorized.
- A task touches another repo (e.g. `../To_do_web/server`) without explicit user confirmation in the current session.
- The previous sprint's Definition of Done is not fully ticked.
- The sprint file references a spec section that doesn't exist (drift between docs).
- You can't get a definitive Verify result (e.g. needs a physical device the user must operate).

In all stop cases, report exactly what you tried, what failed, and what input you need.

---

## What not to do

- Don't paraphrase or skip Verify checks. They're the only proof a task is real.
- Don't run multiple sprints in one invocation. One sprint per `/run_sprint`.
- Don't edit the spec, plan, or blueprint as a shortcut to making a sprint pass — those documents are the contract. Surface the conflict instead.
- Don't tick a Definition of Done box without an observable check.
- Don't add features, refactors, or tests outside the sprint's scope, even if they look like easy wins. They land in the sprint that owns them.
- Don't run `npm install`, `expo install`, `eas build`, or anything that touches another repo without confirming with the user first.
- Don't mark a sprint complete if any verification was deferred or "we'll fix it later." Open items mean an open sprint.

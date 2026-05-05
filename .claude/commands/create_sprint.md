---
description: Generate sprint files for the current project from its blueprint/spec/plan
argument-hint: [optional: number of sprints to produce, e.g. "6"]
---

# /create_sprint

Generate a sprint breakdown for **this project** and write one file per sprint into `.claude/sprints/<project_name>/`. Each sprint file is a self-contained, executable plan that a developer (or future Claude) can pick up without re-reading the whole spec.

User-supplied argument (optional): `$ARGUMENTS` — if a number is provided, produce exactly that many sprints. Otherwise, **you decide** the right count based on the project's complexity (typical range: 4–8 sprints).

---

## Step 1 — Read the project's planning docs

Before writing anything, read the planning docs in this priority order. Use only what exists; skip what doesn't:

1. `.claude/specs/spec.md` — the locked contract (authoritative).
2. `.claude/plans/create_plan.md` (or any `.claude/plans/*.md`) — phase breakdown.
3. `.claude/todo_mobile_blueprint.md` (or the blueprint at the repo root / `.claude/`) — rationale + code samples.
4. `CLAUDE.md` — project-level guardrails.
5. `README.md` if present.

If none of these exist, **stop and tell the user** — sprints can't be derived without a spec or plan.

---

## Step 2 — Determine the project name

Derive `<project_name>` for the output path:

1. If a `name` field exists in `package.json` → use it (kebab-case, lowercased).
2. Else, use the project's root directory name (lowercased, spaces and dashes replaced with `_`).
3. Strip any leading punctuation.

Example: directory `To_do_mobile` → `<project_name>` = `to_do_mobile`.

---

## Step 3 — Decide the sprint count

If the user passed a number in `$ARGUMENTS`, use it.

Otherwise pick a count that satisfies all of:

- Each sprint is **1–2 weeks of focused work** for one developer.
- Each sprint is **independently testable** — it ships something demonstrable, not a half-finished refactor.
- Sprints align with phase boundaries in the plan when possible (don't split a phase mid-flight).
- Phase 1 (foundation/bootstrap) is almost always its own sprint.
- Final sprint covers hardening, testing, and acceptance.

Rules of thumb:
- Plan with 4–6 phases → 4 sprints.
- Plan with 7–10 phases → 5–6 sprints.
- Plan with > 10 phases → 7–8 sprints, grouping related phases.

State your chosen count and why before writing files.

---

## Step 4 — Name each sprint

Each sprint gets a short, descriptive snake_case title that names the **outcome**, not the activity.

Good: `foundation_and_navigation`, `authentication_flow`, `todo_crud_screens`, `device_testing_and_hardening`.
Bad: `sprint_one`, `do_things`, `phase_3_and_4`.

File naming: `sprint{N}_{title}.md` — e.g. `sprint1_foundation_and_navigation.md`. Sprint number `N` starts at 1, no leading zero.

---

## Step 5 — Write the sprint files

For each sprint, create `.claude/sprints/<project_name>/sprint{N}_{title}.md` using the template below.

> Create the `.claude/sprints/<project_name>/` directory if it doesn't exist. **Do not overwrite existing sprint files** — if a file already exists, ask the user whether to skip, overwrite, or version it as `sprint{N}_{title}.v2.md`.

### Sprint file template

```markdown
# Sprint {N} — {Human-Readable Title}

> Part of <project_name>. Derived from: spec §{sections}, plan Phase(s) {phase numbers}.
> Estimated duration: {1 week | 2 weeks}.
> Depends on: {previous sprint name(s) or "none"}.

---

## Goal

One-sentence statement of what this sprint delivers. The reader should know in 10 seconds whether this sprint matters for what they need.

## Scope (in)

- Concrete deliverable 1
- Concrete deliverable 2
- ...

## Scope (out)

- Things explicitly deferred to a later sprint, with the sprint number where they land

## Prerequisites

- Code, infra, or backend changes that must already be merged
- Environment / accounts / access required (e.g. Expo Go installed, backend reachable on LAN)

## Tasks

Numbered, ordered list of work items. Each task: **what to do** + **which files** + **verify**.

1. **{Task title}**
   - Files: `path/to/file.ts`, `path/to/other.tsx`
   - Action: one or two sentences
   - Verify: the concrete check that proves it's done
2. ...

## Definition of Done

Checklist that must be fully ticked before the sprint closes. Tie each item to something observable (a test passing, a behavior visible in the app, a command exiting 0).

- [ ] Item 1
- [ ] Item 2
- [ ] All tasks above complete
- [ ] No regressions in previous sprints' Definition of Done

## Risks & Mitigations

| Risk                              | Mitigation                                  |
|-----------------------------------|---------------------------------------------|
| Most-likely-to-bite-us thing      | What to do when it does                     |

## Demo script

A short, ordered list of actions a stakeholder can perform to see the sprint's output working. Keep it under 8 steps.

1. Open …
2. Tap …
3. Observe …
```

---

## Step 6 — Report back to the user

After writing all files, output:

1. The chosen sprint count and the reasoning.
2. The list of files created (with absolute paths).
3. A one-line summary per sprint (number + title + goal).
4. A flag for any sprint that has external prerequisites the user needs to act on (e.g. "Sprint 2 requires backend changes from spec §5").

---

## Quality bar for the generated sprints

- Each sprint must be **independently demoable**. If you can't write a meaningful Demo script, the sprint is too small or too infrastructural — merge it with a neighbor.
- Each task must reference **specific files or commands** from the spec/plan, not vague intentions.
- Definition of Done items must be **observable**, not aspirational ("typecheck passes" not "code is high quality").
- Do **not** invent requirements outside the spec. If the spec doesn't cover something, leave it out and note it as out-of-scope.
- Sprints must form a **dependency chain** — sprint N+1 should be unblocked by sprint N's deliverables, with no circular references.
- The total work covered across all sprints must equal the work in the plan — no gaps, no duplication.

---

## What not to do

- Don't write a single mega-file with all sprints. One file per sprint.
- Don't number sprints with leading zeros (`sprint1_…`, not `sprint01_…`).
- Don't put sprint files anywhere other than `.claude/sprints/<project_name>/`.
- Don't paraphrase the spec into sprints — reference its sections by number.
- Don't invent acceptance criteria the spec doesn't already specify; cite the spec's §17 (or equivalent) for definition-of-done items.
- Don't proceed if the spec/plan is missing — ask the user to supply one or run the planning commands first.

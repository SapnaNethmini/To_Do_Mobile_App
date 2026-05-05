---
description: Commit current changes with a Conventional Commit message, then push and open a PR if the change requires one
argument-hint: [optional: short tag/label for the change, e.g. "ui-redesign"]
---

# /commit_message

End-to-end "ship what's in the working tree" command. Detects what kind of change is staged, writes the right commit message, and — if the change is feature work — pushes and opens a PR against `main`. The full workflow rules live in `CLAUDE.md` under "Git workflow (strict)"; this command implements them.

User-supplied argument: `$ARGUMENTS` — optional short tag/label (e.g. `ui-redesign`, `optimistic-toggle`). Used to construct the branch name (`feat/<tag>`) and as a hint for the commit subject. If empty, derive a tag from the diff (snake-case, ≤ 3 words).

---

## Step 0 — Repo sanity check

1. Run `git rev-parse --is-inside-work-tree` — if not a git repo, **stop** and tell the user to run `git init && git remote add origin <url>` first. Don't initialize on their behalf without confirmation.
2. Run `git remote -v` — confirm `origin` exists and points at GitHub. If missing, **stop** and ask.
3. Run `gh auth status` — confirm `gh` is authenticated. If not, surface the `gh auth login` instruction and stop.

---

## Step 1 — Read the working tree

In parallel:

- `git status --short` — what's modified / untracked.
- `git diff` — unstaged changes.
- `git diff --cached` — staged changes.
- `git branch --show-current` — current branch.
- `git log -n 5 --oneline` — recent commit style on this repo (helps match tone).

If the working tree is clean, **stop** — nothing to commit.

---

## Step 2 — Classify the change

Walk the file list and bucket each path. The classification drives the rest of the workflow.

| Path pattern                                        | Bucket             | Workflow                    |
|-----------------------------------------------------|--------------------|------------------------------|
| `CLAUDE.md`                                         | `meta`             | commit on current branch     |
| `.claude/**` (specs, plans, sprints, commands, etc.)| `meta`             | commit on current branch     |
| `skills.md`, `.claude/skills.md`                    | `meta`             | commit on current branch     |
| Anything else (`app/**`, `src/**`, `package.json`, config, assets) | `feature` | feature-branch flow          |

**Mixed change rule:** if the staged diff contains *both* feature paths and meta paths, **stop** and ask the user whether to:
- (a) split into two commits (recommended) — meta first on current branch, then re-stage feature paths and continue, OR
- (b) treat the whole thing as `feature` (everything goes on the feature branch).

Don't silently mix.

---

## Step 3a — `meta` workflow (commit on current branch)

For docs/`.claude/` changes only — no branch switch, no PR required.

1. Stage explicitly by file (never `git add -A` / `git add .` — avoids leaking secrets or untracked feature work).
2. Pick a Conventional Commit type:
   - `docs:` for `CLAUDE.md`, blueprint, spec, plan, sprint files, READMEs.
   - `chore:` for slash commands, agents, settings under `.claude/commands/`, `.claude/agents/`, `.claude/settings*.json`.
3. Commit message format (HEREDOC, single-quoted) — see Step 5.
4. **Do not push automatically** for meta commits. Mention to the user that the commit is local; if they want it pushed, they can run `git push` or call this command again with the feature workflow.
5. Skip Step 4 (no branch creation) and skip the PR step.

---

## Step 3b — `feature` workflow (branch + commit + push + PR)

### 3b.1 — Decide the branch

- If the current branch already starts with `feat/` or `fix/`: keep working on it. Commit + push + (open PR if not already open, otherwise add the new commit to the existing PR).
- If the current branch is `main` (or any non-feature branch): a new branch is required. Go to 3b.2.

### 3b.2 — Switch to `main` and start a fresh branch

**Pre-switch check.** Before leaving the current branch:

- If there are **uncommitted changes that are not for the new feature**, stop and ask. Don't auto-stash — the user might lose track of what they had.
- If the current branch has unpushed commits, stop and surface them: tell the user to commit/push/PR the current branch first per the workflow rule in `CLAUDE.md`.
- If the current branch has open changes that *are* the new feature you're about to commit, stash them (`git stash push -m "pre-branch <tag>"`), do the branch creation, then `git stash pop`.

**Branch creation:**

```bash
git checkout main
git pull --ff-only origin main      # fail loudly if main has diverged locally
git checkout -b feat/<tag>          # or fix/<tag> for bug fixes
```

Tag derivation:
- Use `$ARGUMENTS` if provided.
- Else derive from the diff (snake-case, ≤ 3 words, e.g. `theme-picker`, `optimistic-delete`). Keep slugs lowercase, hyphen-separated.

Type derivation:
- `feat/` for new behavior or new screens.
- `fix/` for bug fixes (commit messages also use `fix:`).
- `chore/` for dependency bumps or build config not tied to user-visible features.

### 3b.3 — Stage and commit

Stage feature files explicitly (never `git add -A`). Commit with the right Conventional type.

### 3b.4 — Push

```bash
git push -u origin feat/<tag>
```

### 3b.5 — Open a PR

Check first: `gh pr list --head feat/<tag> --base main --json number,url`.

- If no PR exists, create one (template in Step 6).
- If a PR already exists, `gh pr view <number> --web` and tell the user the new commit is now part of it.

---

## Step 4 — (covered above by 3a / 3b)

---

## Step 5 — Commit message format

**Subject line** (≤ 72 chars):

```
<type>(<scope>): <imperative summary>
```

- `<type>`: one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`.
- `<scope>` *(optional)*: short noun pointing at the area, e.g. `auth`, `todos`, `api`, `theme`. Skip if it would just repeat the type.
- Subject in **imperative mood** ("add X", not "added X").
- No trailing period.

**Body** (optional but encouraged for non-trivial commits):

- One blank line after subject.
- Wrap at ~72 chars.
- Explain the **why**, not the **what** — the diff already shows the what.
- Reference relevant spec / sprint sections when the change implements a planned item: `Implements spec §10.2`, `Closes sprint3 §Task 4`.

**Footer** — always end with:

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Example — feature commit:**

```
feat(auth): persist JWT in SecureStore and rehydrate on cold start

Replaces the Sprint 1 stub with the real AuthContext. On app boot
we read the token from SecureStore, call /auth/me to rehydrate the
user, and only then drop the splash screen — preventing the login
flash that was visible during testing.

Implements spec §10 and sprint3 Task 3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Example — meta commit:**

```
docs: tighten git workflow rules in CLAUDE.md

Clarifies that .claude/** changes are exempt from the feature-branch
rule and points readers at /commit_message for the enforced flow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Pass the message via single-quoted HEREDOC** so backticks and `$` aren't expanded:

```bash
git commit -m "$(cat <<'EOF'
feat(auth): persist JWT in SecureStore and rehydrate on cold start

…body…

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Step 6 — PR template

```bash
gh pr create --base main --head feat/<tag> \
  --title "<same-as-commit-subject-or-tighter>" \
  --body "$(cat <<'EOF'
## Summary

- Bullet describing the user-visible change (1 line).
- Bullet describing the technical change (1 line).
- (Optional) Bullet describing any follow-ups intentionally deferred.

## Why

One short paragraph. Cite the spec / sprint / blueprint section that
motivated this work — readers should know whether this implements an
agreed plan or proposes something new.

## Test plan

- [ ] `npx tsc --noEmit` clean
- [ ] `npx eslint . --ext .ts,.tsx` clean
- [ ] `npx jest <relevant-path>` green
- [ ] Manual: <one or two device-side checks if this is UI work>

## Notes

- Spec sections referenced: §X
- Sprint task: sprint{N} §Task {M}
- (Anything else a reviewer should know — known limitations, follow-ups.)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

After creation, print the PR URL so the user can open it.

---

## Hard rules

- **Never** `git push --force` to `main` or to a shared branch. If a force push is needed on a feature branch (e.g. after a rebase), use `--force-with-lease` and only on `feat/*` / `fix/*`.
- **Never** skip hooks (`--no-verify`, `--no-gpg-sign`) unless the user explicitly asks. Pre-commit failures mean the commit didn't land — fix and re-commit, don't `--amend` to hide it.
- **Never** stage with `git add -A` / `git add .` — name files explicitly so secrets and stray untracked work don't slip in.
- **Never** create a feature branch off another feature branch. Always start from a freshly pulled `main`.
- **Never** open a PR with the body Claude couldn't actually fill in (no placeholders like `<TODO>` left behind).
- **Never** create a commit that mixes `meta` and `feature` paths without explicit user permission (see Step 2 mixed-change rule).

---

## Stopping conditions

Stop and surface to the user when:

- Not in a git repo, or no `origin` remote, or `gh` not authenticated.
- The change is mixed (meta + feature) and no decision yet on how to split.
- Current branch is non-`main` and non-`feat/*`/`fix/*` and has unpushed commits — needs human decision.
- `git pull --ff-only` on `main` fails (local `main` has diverged) — don't paper over with `pull --rebase` silently.
- `gh pr create` fails due to repo permissions or branch protection — surface the error verbatim.
- A commit hook blocks the commit — fix the underlying issue, don't bypass.

---

## Final report

After a successful run, output:

1. Type of workflow taken: `meta` or `feature`.
2. Branch name (and whether it was created or reused).
3. Commit SHA + subject.
4. Push status (skipped for meta, or `pushed to origin/feat/<tag>`).
5. PR URL (or `no PR — meta change`).
6. Anything the user needs to do next (e.g. "request a review on the PR", or "remember to merge before starting the next feature").

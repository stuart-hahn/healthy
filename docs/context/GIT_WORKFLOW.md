# Git workflow — commit + GitHub

## Message style (required)

Follow **`skills/caveman-commit/SKILL.md`**: Conventional Commits, imperative subject, terse; body only for why, breaking changes, or migrations.

**Agents**: Read that skill for **every** suggested message—including after implementing code, when the user says **`/caveman-commit`**, or when staging—so caveman-style lines stay the default. Generate the subject (and body if needed) before `git commit` / `npm run ship`.

## `/caveman-commit` + staging (Cursor)

This repo’s **project hook** `.cursor/hooks/stage-on-caveman-commit.sh` runs on **`beforeSubmitPrompt`**: if the submitted user prompt contains the literal **`/caveman-commit`**, it runs **`git add -A`** at the repo root. Then paste the generated message and run **`git commit -m '…'`** (or **`npm run ship -- '…'`**, which also stages). Reload Cursor after changing `.cursor/hooks.json` if the hook does not fire.

## One-shot: commit and push

Requires **`origin`** pointing at GitHub (see root `README.md`).

```bash
npm run ship -- 'feat(ui): add session form'
```

Runs: `git add -A` → `git commit -m "…"` → `git push`. **`pre-commit`** runs lint-staged; **`pre-push`** runs full lint, typecheck, and tests.

If the tree is clean, `ship` exits with an error (nothing to do).

## `git push` (pre-push)

**`pre-push`** runs `scripts/husky-pre-push-stage-check.sh` first:

1. **`git add -A`** — stages all changes (tracked + untracked).
2. If the index still differs from **`HEAD`** (uncommitted work), the hook **exits with an error** and prints steps: use **`/caveman-commit`** in Cursor (or `skills/caveman-commit/SKILL.md`), then **`git commit`**, then push again.

**`/caveman-commit` cannot run inside git hooks** — Cursor skills need the IDE/agent. **Husky `pre-push`** only stages and enforces “commit before push.” **Cursor** may stage earlier when you actually send **`/caveman-commit`** (see above).

**Bypass** (e.g. push without committing local WIP): `SKIP_CAVEMAN_STAGED_CHECK=1 git push`  
**Husky off entirely**: `HUSKY=0 git push`

## Push only (commits already made)

```bash
git push
```

## What is not automated

- **No auto-commit on file save** — avoids junk history and half-broken commits.
- Hooks do **not** invoke the AI for commit text; **`/caveman-commit`** stays a Cursor step before `git commit`.
- Agents should still **propose** caveman lines after substantive edits (`skills/caveman-commit/SKILL.md`).

## CI

Pushes to GitHub run **`.github/workflows/ci.yml`** (install, format check, lint, typecheck, test, build).

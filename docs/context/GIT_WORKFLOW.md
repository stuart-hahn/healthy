# Git workflow — commit + GitHub

## Default: `git push` does everything

**`pre-push`** runs **`scripts/husky-pre-push-auto-commit.sh`** first:

1. **`git add -A`**
2. If the index still differs from **`HEAD`**, **`git commit -m "…"`** using:
   - **`COMMIT_MSG`** env var if set, else
   - **`npx tsx scripts/print-auto-commit-message.ts`** — deterministic Conventional-Commits-style subject from **staged paths** (not AI; logic in `src/lib/git/autoCommitMessage.ts`, tests in `src/lib/git/autoCommitMessage.test.ts`)
3. Then **`npm run lint`**, **`npm run typecheck`**, **`npm test`**; push proceeds if all pass.

**`pre-commit`** (lint-staged) still runs on that auto-commit.

### Hand-crafted messages (optional)

For a specific subject on this push only:

```bash
COMMIT_MSG='feat(ui): add deload toggle' git push
```

**`/caveman-commit`** in Cursor still works for **human-written** messages you paste into **`COMMIT_MSG=… git push`** or into a manual `git commit` if you disable automation (bypass below).

### `/caveman-commit` + early staging (Cursor)

Project hook **`.cursor/hooks/stage-on-caveman-commit.sh`**: submitting a prompt that contains **`/caveman-commit`** runs **`git add -A`**. Optional; **`git push`** already stages everything.

## One-shot: commit and push (explicit message)

```bash
npm run ship -- 'feat(ui): add session form'
```

Runs: **`git add -A`** → **`git commit`** → **`git push`**. Use when you want a guaranteed message without **`COMMIT_MSG`**.

If the tree is clean, **`ship`** exits with an error (nothing to do).

## Bypass automation

- **Push without committing local WIP** (only commits already on `HEAD` reach the remote):  
  **`SKIP_CAVEMAN_STAGED_CHECK=1 git push`**
- **Disable all Husky hooks for one command**: **`HUSKY=0 git push`**

## Message style (when you write it yourself)

Follow **`skills/caveman-commit/SKILL.md`**: Conventional Commits, imperative subject, terse; body only for why, breaking changes, or migrations.

## CI

Pushes to GitHub run **`.github/workflows/ci.yml`** (install, format check, lint, typecheck, test, build).

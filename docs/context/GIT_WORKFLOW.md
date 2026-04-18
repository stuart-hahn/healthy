# Git workflow — commit + GitHub

## Message style (required)

Follow **`skills/caveman-commit/SKILL.md`**: Conventional Commits, imperative subject, terse; body only for why, breaking changes, or migrations.

Agents: generate the subject (and body if needed) with that skill before committing.

## One-shot: commit and push

Requires **`origin`** pointing at GitHub (see root `README.md`).

```bash
npm run ship -- 'feat(ui): add session form'
```

Runs: `git add -A` → `git commit -m "…"` → `git push`. **`pre-commit`** runs lint-staged; **`pre-push`** runs full lint, typecheck, and tests.

If the tree is clean, `ship` exits with an error (nothing to do).

## Push only (commits already made)

```bash
git push
```

## What is not automated

- **No auto-commit on file save** — avoids junk history and half-broken commits.
- Hooks do **not** write messages; you or the AI still supply the caveman-commit line.

## CI

Pushes to GitHub run **`.github/workflows/ci.yml`** (install, format check, lint, typecheck, test, build).

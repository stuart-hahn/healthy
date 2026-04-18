#!/usr/bin/env sh
# Auto-stage and require a commit before push (pairs with /caveman-commit in Cursor).
# Bypass: SKIP_CAVEMAN_STAGED_CHECK=1 git push
set -e
cd "$(git rev-parse --show-toplevel)"

if [ -n "${SKIP_CAVEMAN_STAGED_CHECK:-}" ]; then
  exit 0
fi

git add -A

if ! git diff-index --quiet HEAD --; then
  echo "" >&2
  echo "pre-push: uncommitted changes — ran git add -A. Commit before push." >&2
  echo "" >&2
  echo "  /caveman-commit runs only in Cursor (not from git hooks)." >&2
  echo "  1. Cursor: /caveman-commit — or skills/caveman-commit/SKILL.md" >&2
  echo "  2. git commit -m 'type(scope): subject'" >&2
  echo "  3. git push" >&2
  echo "" >&2
  echo "  One-shot: npm run ship -- 'type(scope): subject'" >&2
  echo "  Skip this check: SKIP_CAVEMAN_STAGED_CHECK=1 git push" >&2
  echo "" >&2
  exit 1
fi

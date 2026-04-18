#!/usr/bin/env bash
# Stage all, commit with message, push to origin. Message must follow skills/caveman-commit.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "error: no git remote 'origin'. Add GitHub remote first (see README)." >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "usage: npm run ship -- '<type(scope): subject>'" >&2
  echo "  see skills/caveman-commit/SKILL.md" >&2
  exit 1
fi

MSG="$*"

if git diff --quiet && git diff --cached --quiet; then
  echo "error: nothing to commit (clean tree). Nothing to push." >&2
  exit 1
fi

git add -A
git commit -m "$MSG"
git push

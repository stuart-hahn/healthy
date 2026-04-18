#!/usr/bin/env sh
# Pre-push: git add -A, then auto-commit if index differs from HEAD (deterministic message).
# Bypass: SKIP_CAVEMAN_STAGED_CHECK=1 git push (no add/commit; push existing commits only).
# One-shot override: COMMIT_MSG='feat(ui): tweak form' git push
set -e
cd "$(git rev-parse --show-toplevel)"

if [ -n "${SKIP_CAVEMAN_STAGED_CHECK:-}" ]; then
  exit 0
fi

git add -A

if git diff-index --quiet HEAD --; then
  exit 0
fi

if [ -n "${COMMIT_MSG:-}" ]; then
  MSG="$COMMIT_MSG"
else
  MSG="$(npx tsx scripts/print-auto-commit-message.ts)"
fi

git commit -m "$MSG"

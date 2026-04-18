#!/usr/bin/env bash
# When user sends /caveman-commit, stage everything (optional; git push pre-hook also git add -A).
# Pairs with docs/context/GIT_WORKFLOW.md.
set +e
payload="$(cat)"

if ! printf '%s' "$payload" | grep -qF '/caveman-commit'; then
  echo "{}"
  exit 0
fi

root="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$root" ] || [ ! -d "$root" ]; then
  echo "{}"
  exit 0
fi

( cd "$root" && git add -A ) >/dev/null 2>&1

echo "{}"
exit 0

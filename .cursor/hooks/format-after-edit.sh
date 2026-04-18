#!/usr/bin/env bash
# Best-effort Prettier on saved/edited files. Fails open if tooling is missing.
set +e
payload="$(cat)"

path=""
if command -v jq >/dev/null 2>&1; then
  path="$(echo "$payload" | jq -r '.filePath // .path // .file // empty' 2>/dev/null)"
fi

if [[ -n "$path" && -f "$path" ]] && [[ "$path" =~ \.(ts|tsx|js|jsx|json|md|mdc|yml|yaml)$ ]]; then
  if [[ -x "./node_modules/.bin/prettier" ]]; then
    "./node_modules/.bin/prettier" --write "$path" >/dev/null 2>&1
  elif command -v npx >/dev/null 2>&1; then
    npx --yes prettier --write "$path" >/dev/null 2>&1
  fi
fi

echo "{}"

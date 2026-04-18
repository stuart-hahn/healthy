#!/usr/bin/env bash
# Warn-only: detect common secret patterns in submitted prompts. Adjust regexes for your org.
set +e
payload="$(cat)"
text=""
if command -v jq >/dev/null 2>&1; then
  text="$(echo "$payload" | jq -r '.. | strings' 2>/dev/null | tr '\n' ' ')"
fi

if echo "$text" | grep -qiE '(sk-[a-zA-Z0-9]{20,}|BEGIN (RSA |OPENSSH )?PRIVATE KEY|api[_-]?key\s*[:=]\s*[^\\s]+)'; then
  echo '{"userMessage":"Possible secret in prompt — remove before sending."}'
  exit 0
fi

echo "{}"

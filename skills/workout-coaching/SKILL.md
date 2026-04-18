---
name: workout-coaching
description: >
  UX and copy for algorithmic coaching — suggestions, disclosures, supportive tone.
  Trigger: "coaching UX", "suggestion card", "RPE", "why this weight", "algorithm label".
---

# Skill: Workout coaching UX

## Purpose

Make automated suggestions **trustworthy and ignorable** — never preachy or opaque.

## Inputs

- Type of suggestion (weight bump, rep add, deload hint, rest).
- Underlying data summary (e.g. "last 3 sessions", date of last attempt).

## Outputs

- Short labels: `Suggested · from your history` + optional `Why` line.
- Empty states for new users (no history): seed from preset defaults, explain briefly.

## Steps

1. Check `docs/references/COACHING_UX.md` for tone and disclosure rules.
2. Ensure keyboard and screen-reader friendly controls for accepting/editing/dismissing.
3. Add `prefers-reduced-motion` safe transitions only.

## Guardrails

- Fixed medical disclaimer available in app shell or settings.
- Avoid weight-shaming or streak coercion as the primary motivator.

---
name: progressive-overload
description: >
  Implement progressive overload, PR detection, and next-session weight/rep suggestions.
  Trigger: "progression", "overload", "suggest weight", "PR", "deload", "volume trend".
---

# Skill: Progressive overload

## Purpose

Keep progression logic **testable**, **transparent**, and aligned with `docs/references/PROGRESSIVE_OVERLOAD.md`.

## Inputs

- Last N logged sets for an exercise (weight, reps, optional RPE/RIR, date).
- Equipment minimum increment (e.g. 2.5 lb).
- Template default rep range and progression rule id.

## Outputs

- Suggested next session: sets, reps, target weight or rep tweak.
- Human-readable **reason string** for UI (not medical claims).

## Steps

1. Normalize units (store kg or lb consistently; document in types).
2. Implement one rule at a time (e.g. linear load first); unit test edge cases (first session, missed weeks).
3. Wire UI with disclosure copy per `docs/references/COACHING_UX.md`.

## Guardrails

- Suggestions are editable; user can dismiss or disable per exercise.
- Do not diagnose injury or prescribe rehab.

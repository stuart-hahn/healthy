# Reference: progressive overload (product logic)

Use this when implementing **suggestions**, **trends**, or **PR** detection. Not medical advice.

## Core idea

Systematically increase **stress** on the muscle/movement over time so adaptation continues. Stress proxies in-app:

- **Load** (weight)
- **Reps** at a given load
- **Sets** / volume (sets × reps × load)
- **Frequency** (sessions per week)
- **Technique quality** (subjective notes; optional RPE/RIR fields)

## Common progression patterns (for presets + algorithms)

1. **Linear load** — Same reps across sets; add smallest practical increment when all sets meet target at manageable RPE (e.g. +2.5–5 lb upper, +5–10 lb lower).
2. **Double progression** — Fix reps; when top of rep range hit at target RPE, add small load and reset toward bottom of range.
3. **Volume-first** — Add set or rep before load when recovery allows (often intermediate).
4. **Deload** — Planned reduction (e.g. 40–60% volume or load) every 4–8 weeks or when performance stalls — surface as a **user-controlled** toggle or calendar hint.

## Suggestion engine (MVP-friendly)

- Inputs: last **N** sessions for same exercise, user **equipment step** (2.5 vs 5 lb), optional **RPE target**.
- Output: proposed **next weight**, **reps**, **sets**, **rest hint**; always **editable**; show **why** (“last week 3×8 @ 135 completed at RPE 7”).
- Edge: first time exercise — seed from template defaults or bodyweight baseline.

## Anti-patterns to avoid in UX

- Unbounded “grind every session” without deload awareness.
- Shaming for missed sessions; prefer **consistency streaks** as optional.

# Reference: workout presets & templates

**Purpose**: “Best-in-class” **starting points** users can select and customize — not a certification of superiority, but **evidence-informed common patterns**.

## Categories (examples)

- **Strength-biased** — 5×5-style compounds, limited accessories, low–moderate volume.
- **Hypertrophy-biased** — Moderate load, 6–12 rep zones, higher set volume.
- **Full body / frequency** — 2–3×/week full body for time-crunched users.
- **Upper / lower** — 4-day split.
- **PPL** — Push / pull / legs rotation.

## Each preset should define

- **Name + one-line intent** (who it’s for).
- **Default weekly split** (which days optional — app may ignore “day of week” v1).
- **Exercises** with: movement pattern, suggested starting **sets × reps**, **progression rule id**, optional **substitutions** (e.g., bench ↔ dumbbell bench).

## Custom workouts

- User-defined exercises and templates live in the same **schema** as presets; presets are **bundled JSON** (or TS modules) shipped with the app, versioned with the app.

## Expansion

- Add presets via PR; review for inclusivity (equipment-limited alternatives).

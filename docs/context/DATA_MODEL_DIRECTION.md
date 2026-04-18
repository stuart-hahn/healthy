# Data model direction (evolving)

**Current**: `localStorage` — flat list of **sessions** with minimal fields.

**Target** (industry-aligned, implementation can phase):

- **Exercise** — Stable `id`, canonical name, optional muscle tags, equipment (barbell, dumbbell, machine, bodyweight).
- **Program / template** — Named collection of exercises with default **sets × reps × RPE/RIR** targets and **progression rule** (linear, double progression, etc.).
- **Workout instance** — Date, template or ad hoc, ordered **sets** logged: weight, reps, RPE/RIR optional, notes.
- **Progression snapshot** — Derived or stored metrics: ePR, best set, weekly volume per lift — for charts and suggestions.

**Storage migration**: Version keys (`workout-tracker:v2`, …), migrate on read, keep last good export path in mind.

**Privacy**: Prefer local-first; any future sync must be opt-in and documented in an ADR.

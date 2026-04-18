# Project context (living document)

**Purpose**: Durable facts the AI should not re-derive each session.

## Product

- **Mission**: Industry-standard **workout tracker** in the browser: users **log custom workouts** or pick **curated templates**, track **progressive overload** over time, and receive **editable suggestions** for weight, sets, reps, rest, and related training variables.
- **Principles**: Local-first privacy, transparent algorithmic coaching (not medical advice), fast logging, long-term adherence over novelty.
- **Detail**: See `docs/context/PRODUCT_VISION.md`, `docs/context/DATA_MODEL_DIRECTION.md`, and `docs/references/`.

## Architecture

- **Runtime**: **React** SPA (**Vite**), **TypeScript**, **nginx** static deploy via `Dockerfile`.
- **Data (now → target)**: Today: `localStorage` with versioned keys. **Target**: exercises, templates/presets, workout instances with sets; migrations between versions; optional **IndexedDB** if structured data outgrows JSON (decide in ADR before large blobs).
- **Domain logic**: Prefer **pure functions** in `src/` (e.g. `lib/progression/`) with unit tests; UI only orchestrates.
- **Presets**: Ship as versioned **bundled data** (JSON/TS); user templates share same schema.
- **Boundaries**: No backend required for core MVP; future sync/API is opt-in and ADR’d.

## Conventions

- **Branching**: Trunk-based, short-lived branches (`feat/`, `fix/`, `chore/`, `docs/`).
- **Releases**: **Semver**; Docker tags may track git tags.
- **Agents**: `AGENTS.md` + `docs/context/TEAM_PLAYBOOK.md` define roles and handoffs.

## Non-goals (current)

- Replacing medical or in-person coaching for injury rehabilitation.
- Shame-based motivation UX.
- **Note**: Cloud sync / accounts may be added later under explicit ADRs; not assumed today.

## Glossary

| Term                     | Meaning                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| **Preset / template**    | Reusable workout definition (exercises, defaults, progression rule id). |
| **Session / workout**    | One performed training log on a calendar day (may include many sets).   |
| **Progressive overload** | Planned increase in stress (load, volume, reps, etc.) over time.        |
| **Suggestion**           | Algorithmic next-step target; always editable and labeled in UI.        |

_Update this file when product or architecture changes materially._

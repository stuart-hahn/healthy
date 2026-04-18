# Project context (living document)

**Purpose**: Durable facts the AI should not re-derive each session.

## Product

- **Mission**: Industry-standard **workout tracker** in the browser: users **log custom workouts** or pick **curated templates** (later), track **progressive overload** over time, and receive **editable suggestions** for weight, sets, reps, rest, and related training variables.
- **Principles**: Local-first privacy, transparent algorithmic coaching (not medical advice), fast logging, long-term adherence over novelty.
- **Detail**: See `docs/context/PRODUCT_VISION.md`, `docs/context/DATA_MODEL_DIRECTION.md`, and `docs/references/`.

## Architecture

- **Runtime**: **React** SPA (**Vite**), **TypeScript**, **nginx** static deploy via `Dockerfile`.
- **Data (implemented)**: **`workout-tracker:v2`** in `localStorage` — `AppStateV2`: `exercises[]` (id, name, equipment, createdAt) and `sessions[]` (date, notes, `blocks[]` with `sets[]` of weight/reps/optional RPE). **v1** flat arrays migrate on first load; v1 key left in place for safety.
- **Domain logic**: **Pure functions** in `src/lib/progression/` (linear suggestion + `pickTopSet`); session helpers in `src/lib/sessions.ts`.
- **Presets**: Bundled in `src/data/presets.ts` (`BUNDLED_PRESETS`). Loading a preset merges exercises into the catalog (by normalized name) and walks the user through each movement with prefilled set × rep rows; advance after each **Save session**.
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

| Term                     | Meaning                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| **Exercise**             | Catalog row the user creates; referenced by sessions.                    |
| **Session**              | One training day log; contains one or more **blocks** (exercise + sets). |
| **Block**                | One exercise within a session (denormalized name + `sets`).              |
| **Preset / template**    | Reusable workout definition (future).                                    |
| **Progressive overload** | Planned increase in stress (load, volume, reps, etc.) over time.         |
| **Suggestion**           | Algorithmic next-step target; always editable and labeled in UI.         |

_Update this file when product or architecture changes materially._

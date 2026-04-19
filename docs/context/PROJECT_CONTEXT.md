# Project context (living document)

**Purpose**: Durable facts the AI should not re-derive each session.

## Product

- **Mission**: Industry-standard **workout tracker** in the browser: users **log custom workouts** or pick **curated templates** (later), track **progressive overload** over time, and receive **editable suggestions** for weight, sets, reps, rest, and related training variables.
- **Principles**: Local-first privacy, transparent algorithmic coaching (not medical advice), fast logging, long-term adherence over novelty.
- **Detail**: See `docs/context/PRODUCT_VISION.md`, `docs/context/DATA_MODEL_DIRECTION.md`, and `docs/references/`.

## Architecture

- **Runtime**: **React** SPA (**Vite**), **TypeScript**, **nginx** static deploy via `Dockerfile`.
- **Data (implemented)**: **`workout-tracker:v2`** in `localStorage` — `AppStateV2`: `exercises[]`, `sessions[]`, `templates[]` (custom reusable workouts: reps targets only), and **`settings`** (`weightUnit` lb/kg, `linearIncrement`, `targetReps` for linear hints). Older saves merge defaults on load. **v1** flat arrays migrate on first load; v1 key left in place for safety. **Backup**: JSON **export/import** in the UI (`buildExportEnvelope`, `parseImportedAppState` in `src/storage/importExport.ts`) — wrapped format `workout-tracker-export` v1; import validates structure, referential integrity, and clamps settings.
- **Domain logic**: **Pure functions** in `src/lib/progression/` (linear suggestion — load bump defers when **logged top-set RPE** is above the default ceiling; `pickTopSet`, `linearHintUiForExercise`); `src/lib/settings.ts` for defaults and normalization; session helpers in `src/lib/sessions.ts` (`mostRecentSession`, etc.); **post-save** “vs last time” per lift via `buildSessionSaveSummary` in `src/lib/sessionSaveSummary.ts`; **top-set “best”** copy via `evaluateTopSetPr` in `src/lib/topSetPr.ts` (heaviest single-set weight in history — not a competition standard). **Log form**: “Repeat last session” copies the latest `TrainingSession` into the draft.
- **Copy / safety**: Header and footer state that the app is **not medical advice**; per-block suggestions labeled **algorithmic**.
- **Presets**: Bundled in `src/data/presets.ts` (`BUNDLED_PRESETS`). Loading a preset merges exercises into the catalog (by normalized name) and prefills **all movements** in the session form; user enters weights and **Save session** once to store **one** `TrainingSession` with multiple **blocks**.
- **Session history UI**: **Session history** card lists all `TrainingSession`s newest-first (`sortSessionsByNewestFirst` in `src/lib/sessions.ts`); expand for full blocks/sets, **Use in log form** copies into the draft, **Remove** deletes. **History by exercise** still filters by one lift.
- **Lift trends (MVP)**: Under **History by exercise**, after picking a lift: table of last **12** logs with **volume** (Σ weight×reps for that block), **top set**, **set count**, plus inline **SVG sparkline** (older → newer). Logic in `src/lib/liftTrends.ts`.
- **Rest timer**: Optional countdown in **Log session** (presets 60–180s, custom 10–600s, Start / Pause / Resume / Reset / Skip). Default duration stored in `localStorage` key `workout-tracker:rest-seconds-default`. Completion uses short **vibration** when supported (`navigator.vibrate`). Display helper `formatSecondsAsMmSs` in `src/lib/restTimerFormat.ts`.
- **Post-save summary**: After **Save session**, a dismissible card shows **vs last time** per lift, **algorithmic next-session** linear hints (same rules as the log form), **Open in session history** (expands that day and scrolls), and per-lift **Lift history & trends** (selects the exercise and scrolls to trends).
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

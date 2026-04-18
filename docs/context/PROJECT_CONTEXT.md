# Project context (living document)

**Purpose**: Durable facts the AI should not re-derive each session.

## Product

- One sentence: **Workout Tracker** is a browser SPA for logging named workouts with date and notes; data persists in **localStorage** on the user’s device (no account, no server-side storage in v1).

## Architecture

- **Runtime**: **React 19** SPA built with **Vite 8**, TypeScript, static assets served by **nginx** in production (see `Dockerfile`).
- **Data**: `localStorage` key `workout-tracker:v1` — JSON array of workouts (`id`, `name`, `date`, `notes`, `createdAt`). No backend API yet.
- **Boundaries**: Deployable as a single container image (build → `dist` → nginx). Future: optional API + DB would replace or sync local state.

## Conventions

- Branching: trunk-based with short-lived branches (`feat/`, `fix/`, `chore/`, `docs/`).
- Releases: **semver** for tagged releases; Docker tags can mirror git tags.

## Non-goals

- User accounts, cloud sync, and social features (unless explicitly added later).
- Native mobile apps in v1.
- Replacing localStorage with IndexedDB unless scale or offline requirements demand it.

## Glossary

| Term        | Meaning                                                                |
| ----------- | ---------------------------------------------------------------------- |
| **Workout** | Logged session: display name, calendar date, optional free-text notes. |
| **SPA**     | Single-page app; client-side routing not required for current UI.      |

_Update this file when product or architecture changes._

# Workout Tracker

Browser-based workout log: name, date, and optional notes. Data stays in **localStorage** on the device (no sign-in). Built with **React**, **Vite**, and **TypeScript**; production image uses **nginx** to serve the static build.

This repo also keeps Cursor-oriented docs (`.cursor/`, `AGENTS.md`, `docs/context/`, etc.) from the original template.

## Quick start (local)

```bash
cd cursor-ai-project-template
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Quality checks

```bash
npm run format:check && npm run lint && npm run typecheck && npm test
```

## Docker

Build and run the production image (serves on port **8080**):

```bash
docker build -t workout-tracker .
docker run --rm -p 8080:80 workout-tracker
```

Then open `http://localhost:8080`.

## Layout

| Path                               | Role                                   |
| ---------------------------------- | -------------------------------------- |
| `src/`                             | React app (`App.tsx`, storage, styles) |
| `Dockerfile` + `docker/nginx.conf` | Multi-stage build + SPA static hosting |
| `.cursor/rules/*.mdc`              | Cursor rules                           |
| `docs/context/PROJECT_CONTEXT.md`  | Product + architecture context         |
| `docs/decisions/`                  | ADRs                                   |
| `AGENTS.md`                        | Agent / handoff roles                  |

## Conventions

- **Branches**: `feat/`, `fix/`, `chore/`, `docs/`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`).

## GitHub

Git is initialized here with an initial commit. Create the remote and push (replace `YOUR_USER`):

```bash
gh repo create YOUR_USER/workout-tracker --private --source=. --remote=origin --push
```

Without GitHub CLI: create an empty repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USER/workout-tracker.git
git push -u origin main
```

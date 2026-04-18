# Workout Tracker

Browser-based workout tracker focused on **templates**, **progressive overload**, and **transparent, editable suggestions** (weights, sets, reps, rest — not medical advice). Built with **React**, **Vite**, and **TypeScript**; production image uses **nginx** for static hosting.

## Autonomous development team

This repo is set up for **multi-agent and multi-session** work:

| Resource                                                                       | Purpose                                                    |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)                                                       | Roles (engineering + product/domain + coaching logic + UX) |
| [`docs/context/TEAM_PLAYBOOK.md`](docs/context/TEAM_PLAYBOOK.md)               | How agents sequence work and define done                   |
| [`docs/context/PRODUCT_VISION.md`](docs/context/PRODUCT_VISION.md)             | North star, pillars, safety                                |
| [`docs/context/DATA_MODEL_DIRECTION.md`](docs/context/DATA_MODEL_DIRECTION.md) | Evolving schema for exercises, sets, presets               |
| [`docs/references/`](docs/references/)                                         | Domain references (overload, presets, coaching UX)         |
| [`skills/`](skills/)                                                           | Installable skills — copy into `~/.agents/skills/`         |
| [`.cursor/rules/`](.cursor/rules/)                                             | Cursor Rules (delegation + workout domain + TS + tests)    |
| [`.cursor/hooks/`](.cursor/hooks/)                                             | Format + ESLint on save; secret guard on submit            |
| [`docs/context/GIT_WORKFLOW.md`](docs/context/GIT_WORKFLOW.md)                 | caveman-commit style, `npm run ship`, CI                   |

ADR: [`docs/decisions/0001-agent-team-and-product-north-star.md`](docs/decisions/0001-agent-team-and-product-north-star.md).

## Quick start (local)

From the repository root:

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Quality checks

```bash
npm run format:check && npm run lint && npm run typecheck && npm test
```

## Commit and push (GitHub)

Messages follow **`skills/caveman-commit/SKILL.md`**. With **`origin`** configured:

```bash
npm run ship -- 'chore: example commit message'
```

See [`docs/context/GIT_WORKFLOW.md`](docs/context/GIT_WORKFLOW.md). **`git push`** runs **pre-push**: auto-**`git add -A`**, then **fails** if you still need a commit (use **`/caveman-commit`** in Cursor, then `git commit`). GitHub runs **CI** (`.github/workflows/ci.yml`).

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
| `src/`                             | React app                              |
| `Dockerfile` + `docker/nginx.conf` | Multi-stage build + SPA static hosting |
| `.cursor/rules/*.mdc`              | Cursor rules                           |
| `docs/context/`                    | Product, architecture, team playbook   |
| `docs/references/`                 | Domain reference material for agents   |
| `docs/decisions/`                  | ADRs                                   |
| `skills/`                          | Agent skill definitions                |
| `AGENTS.md`                        | Agent roles and handoff contract       |

## Conventions

- **Branches**: `feat/`, `fix/`, `chore/`, `docs/`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`).

## GitHub

Create the remote and push (replace `YOUR_USER`):

```bash
gh repo create YOUR_USER/workout-tracker --private --source=. --remote=origin --push
```

Without GitHub CLI: create an empty repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USER/workout-tracker.git
git push -u origin main
```

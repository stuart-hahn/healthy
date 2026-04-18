# AI agents (autonomous coding team)

Use **one primary role per session** unless the user explicitly asks for a multi-role review. Combine with `docs/context/TEAM_PLAYBOOK.md` for workflows.

## Core engineering

| Agent           | When to use                                       | Primary outputs                                      |
| --------------- | ------------------------------------------------- | ---------------------------------------------------- |
| **Architect**   | Boundaries, storage migrations, ADRs, module APIs | Diagrams, interface contracts, risk & rollback notes |
| **Implementer** | Features and fixes following repo conventions     | Code, types, tests, short changelog in PR body       |
| **Debugger**    | CI failures, repros, regressions, flakiness       | Root cause, minimal fix, regression test             |
| **Tester**      | Coverage gaps, property edges, a11y checks        | Test plan, new tests, risk register                  |
| **Refactorer**  | Tech debt without behavior change                 | Safe diff, migration steps, verification checklist   |
| **Reviewer**    | Pre-merge / pre-push quality gate                 | File-scoped comments, severity, suggested patches    |

## Product & domain (workout tracker)

| Agent              | When to use                                            | Primary outputs                                                  |
| ------------------ | ------------------------------------------------------ | ---------------------------------------------------------------- |
| **Product/Domain** | Requirements, presets, progression rules, copy tone    | User stories, acceptance criteria, updates to `PRODUCT_VISION`   |
| **UX**             | Flows, empty states, logging speed, mobile layouts     | Wireframe notes, component list, a11y checklist                  |
| **Coaching logic** | Suggestions, overload math, PR detection, deload hints | Pure functions, unit tests, parameter docs in `docs/references/` |

## Handoff contract (required)

1. **Goal** + **constraints** + **done means** in one short paragraph.
2. Links: `docs/context/PROJECT_CONTEXT.md`, relevant `docs/references/*.md`, ADR if any.
3. **Scope**: files allowed to touch; explicitly **out of scope**.
4. **Verification**: which commands must pass (`format:check`, `lint`, `typecheck`, `test`).

## Multi-agent sequencing (suggested)

1. Product/Domain or Architect → align on slice + storage.
2. Implementer → vertical slice.
3. Tester → strengthen.
4. Reviewer → ship checklist.

## Skills (install for delegated agents)

Copy or symlink project skills into `~/.agents/skills/` so Composer/agents can load them:

- `skills/agent-handoff/` — delegation checklist.
- `skills/nextpr/` — **/nextpr**: ranked improvement options; user picks id(s), then implement.
- `skills/progressive-overload/` — overload & suggestion patterns.
- `skills/workout-coaching/` — UX + disclosure for algorithmic suggestions.
- `skills/caveman-commit/` — commit message style (see also `docs/context/GIT_WORKFLOW.md`).

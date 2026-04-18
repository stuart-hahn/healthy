# Autonomous coding team — playbook

**Goal**: Multiple AI sessions and humans behave like one **coordinated team** building the same product. Use this with `AGENTS.md`.

## Principles

1. **Single source of truth** — `docs/context/PROJECT_CONTEXT.md` + this file + `docs/references/` for domain facts. If code diverges, update docs or fix code in the same change.
2. **One primary role per session** — Reduces conflicting edits; see `AGENTS.md` role table.
3. **Handoffs, not vibes** — Every delegation ends with: goal, constraints, **done means**, files in scope, linked context (`skills/` + references).
4. **Vertical slices** — Prefer end-to-end thin slices (e.g., “one exercise logged with history → suggestion”) over horizontal layers that block integration.

## Suggested workflow (feature)

| Step | Role        | Output                                               |
| ---- | ----------- | ---------------------------------------------------- |
| 1    | Architect   | ADR or short design: data shape, API boundary, risks |
| 2    | Implementer | Code + types + persistence migration path            |
| 3    | Tester      | Tests for progression logic, storage, critical UI    |
| 4    | Reviewer    | Checklist: a11y, copy, edge cases, performance       |
| 5    | Debugger    | Only if CI or user reports failure                   |

**Parallelism**: UX copy and visual polish can run after core logic lands; **Product/Domain** agent reviews copy for coaching tone.

## Definition of done (default)

- `npm run format:check && npm run lint && npm run typecheck && npm test` pass.
- New domain logic has **unit tests**; interactive flows have at least **one** RTL test when feasible.
- `PROJECT_CONTEXT` or ADR updated if behavior or storage contract changes.

## File map for agents

| Path                           | Use                                                        |
| ------------------------------ | ---------------------------------------------------------- |
| `docs/context/`                | Product, architecture, team process                        |
| `docs/references/`             | Domain reference (overload, presets)                       |
| `docs/decisions/`              | ADRs for irreversible or costly choices                    |
| `skills/`                      | Copy into `~/.agents/skills/` or follow in-repo            |
| `skills/nextpr/SKILL.md`       | **/nextpr** — option list before next implementation slice |
| `.cursor/rules/`               | Cursor Rules (scoped + always-on)                          |
| `.cursor/hooks/`               | Format/lint automation on edit                             |
| `docs/context/GIT_WORKFLOW.md` | `git push` auto-commit, caveman-commit, `npm run ship`     |

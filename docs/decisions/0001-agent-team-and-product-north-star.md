# ADR 0001: Agent team setup and product north star

## Status

Accepted

## Context

The project aims for an industry-standard workout tracker with templates, progressive overload, and coaching-style suggestions. Multiple humans and AI sessions need shared context and repeatable processes.

## Decision

1. Document **product vision** and **data direction** under `docs/context/` and `docs/references/`.
2. Define **agent roles** in `AGENTS.md` and operational workflow in `TEAM_PLAYBOOK.md`.
3. Ship **in-repo skills** under `skills/` for handoff, progression logic, and coaching UX.
4. Keep **Cursor Rules** aligned (`.cursor/rules/`) and **hooks** for format/lint on edit.

## Consequences

- Feature work should update `PROJECT_CONTEXT.md` or an ADR when storage or user-facing contracts change.
- Agents should prefer vertical slices and cite reference docs when changing progression or preset behavior.

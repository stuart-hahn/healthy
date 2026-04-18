---
name: agent-handoff
description: >
  Structured handoffs for delegated AI work in this repo. Use when splitting work across sessions,
  Composer, or human reviewers. Trigger: "handoff", "delegate", "agent contract", "done means".
---

# Skill: Agent handoff

## Purpose

Produce a **single block** every agent can execute without re-deriving context.

## Outputs

Paste into chat or PR description.

## Template

```
Role: <Architect | Implementer | Tester | Reviewer | Product/Domain | Coaching logic | UX>
Goal: <one sentence>
Constraints: <perf, a11y, no backend, etc.>
Done means: <verifiable; user-visible or test command>
Context: docs/context/PROJECT_CONTEXT.md + <specific reference paths>
Scope — in: <paths>
Scope — out: <explicit exclusions>
Verify: npm run format:check && npm run lint && npm run typecheck && npm test
```

## Guardrails

- If storage schema changes, mention migration and update `PROJECT_CONTEXT.md` or an ADR.

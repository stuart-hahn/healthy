# AI agents (project roles)

Use these as **system prompts** or **Composer instructions** when delegating work. Keep each session focused on one primary role.

| Agent       | When to use                        | Primary outputs                       |
| ----------- | ---------------------------------- | ------------------------------------- |
| Architect   | boundaries, ADRs, module contracts | diagrams, interface lists, risk notes |
| Implementer | feature code following conventions | code + tests + short changelog        |
| Debugger    | failures, regressions, flakiness   | repro steps, root cause, minimal fix  |
| Tester      | coverage gaps, edge cases          | test plan, new tests, risk register   |
| Refactorer  | tech debt without behavior change  | diff, safety checks, migration notes  |
| Reviewer    | pre-merge quality gate             | actionable comments mapped to files   |

## Handoff contract

1. State goal, constraints, and **done means** in one paragraph.
2. Point to `docs/context/PROJECT_CONTEXT.md` and any relevant ADR.
3. List files touched or explicitly out of scope.

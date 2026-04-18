---
name: caveman-commit
description: >
  Ultra-compressed commit message generator. Conventional Commits. Subject ≤50 chars when possible;
  body only when "why" is not obvious. Triggers: /caveman-commit, "commit message", "write a commit",
  "generate commit", /commit, npm run ship. After implementing code: propose a message when git has
  local changes (unless user said no commits). Auto-triggers when user stages changes.
---

Write commit messages terse and exact. Conventional Commits format. No fluff. Why over what.

## Rules

**Subject line:**

- `<type>(<scope>): <imperative summary>` — `<scope>` optional
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Imperative mood: "add", "fix", "remove" — not "added", "adds", "adding"
- ≤50 chars when possible, hard cap 72
- No trailing period
- Match project convention for capitalization after the colon

**Body (only if needed):**

- Skip entirely when subject is self-explanatory
- Add body only for: non-obvious _why_, breaking changes, migration notes, linked issues
- Wrap at 72 chars
- Bullets `-` not `*`
- Reference issues/PRs at end: `Closes #42`, `Refs #17`

**What NEVER goes in:**

- "This commit does X", "I", "we", "now", "currently" — the diff says what
- "As requested by..." — use Co-authored-by trailer
- "Generated with Claude Code" or any AI attribution
- Emoji (unless project convention requires)
- Restating the file name when scope already says it

## Examples

Diff: new endpoint for user profile with body explaining the why

- ❌ "feat: add a new endpoint to get user profile information from the database"
- ✅

  ```
  feat(api): add GET /users/:id/profile

  Mobile client needs profile data without the full user payload
  to reduce LTE bandwidth on cold-launch screens.

  Closes #128
  ```

Diff: breaking API change

- ✅

  ```
  feat(api)!: rename /v1/orders to /v1/checkout

  BREAKING CHANGE: clients on /v1/orders must migrate to /v1/checkout
  before 2026-06-01. Old route returns 410 after that date.
  ```

## Auto-Clarity

Always include body for: breaking changes, security fixes, data migrations, anything reverting a prior commit. Never compress these into subject-only — future debuggers need the context.

## `git push` (repo hook)

**`pre-push`** runs `git add -A`, then **blocks** push if anything is still uncommitted vs `HEAD`. Printed steps point here and **`/caveman-commit`**. The hook **cannot** execute Cursor slash commands—generate the message in Cursor, then `git commit`, then push again. See `docs/context/GIT_WORKFLOW.md` (`SKIP_CAVEMAN_STAGED_CHECK=1` to bypass).

## After code changes (agents)

When implementation finishes and the working tree has uncommitted changes (or the user is about to commit), **read this skill** and output:

1. A fenced **commit message** ready to paste, or
2. One line: `npm run ship -- 'type(scope): subject'` (see `docs/context/GIT_WORKFLOW.md`)

unless the user asked not to commit. This skill does **not** run `git commit` by itself.

## Boundaries

Only generates the commit message. Does not run `git commit`, does not amend unless the user asks. **Husky `pre-push`** may run `git add -A` before you commit—see above. Output the message as a code block ready to paste. "stop caveman-commit" or "normal mode": revert to verbose commit style.

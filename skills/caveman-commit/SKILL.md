---
name: caveman-commit
description: >
  Terse Conventional Commits. Subject ≤50 chars when possible. Body only for why, breaking changes,
  migrations. Trigger: commit message, /caveman-commit, PR title, npm run ship.
---

# Skill: Caveman commit messages

## Subject

- Format: `<type>(<scope>): <imperative summary>` — scope optional
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Imperative: add / fix / remove — not added / adds
- ≤50 chars when possible; hard cap 72; no trailing period

## Body

- Omit when subject enough
- Add for: non-obvious **why**, breaking changes, migrations, security — wrap 72 cols, bullets `-`
- Refs: `Closes #42`, `Refs #17` at end

## Never

- "This commit…", I/we, "now", restating filename if scope has it
- AI attribution trailers

## Breaking / migrations

- Always body + `BREAKING CHANGE:` or `!` in type when appropriate — never subject-only for those

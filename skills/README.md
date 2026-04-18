# Project skills

Copy any `*/SKILL.md` folder into `~/.agents/skills/<skill-name>/` (or symlink) so Cursor / Composer agents can load them by name.

| Skill                   | Use for                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| `agent-handoff/`        | Delegation blocks, done means, scope                                          |
| `progressive-overload/` | Progression math, PRs, next-session targets                                   |
| `workout-coaching/`     | Suggestion UI, disclosures, tone                                              |
| `caveman-commit/`       | Terse Conventional Commits; agents use after code changes + `/caveman-commit` |
| `nextpr/`               | Prioritized “next PR” options; user picks, then build                         |

Copy or symlink each folder into `~/.agents/skills/<name>/` so Cursor / Composer can load them (including `/caveman-commit` and `/nextpr`).

See also `_TEMPLATE_SKILL.md` for creating new skills.

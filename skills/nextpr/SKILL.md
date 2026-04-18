---
name: nextpr
description: >
  Propose prioritized improvement options for this app before coding. User selects one; then implement.
  Trigger: /nextpr, "next PR", "nextpr", "what should we build next", "improvement options", "roadmap pick".
---

# Skill: Next PR options

## Purpose

Give the human **clear, comparable choices** for the next slice of work—aligned with `docs/context/PRODUCT_VISION.md`, `PROJECT_CONTEXT.md`, `DATA_MODEL_DIRECTION.md`, and `docs/references/`. **Do not write implementation code** in the same turn unless the user explicitly picks an option and asks to build.

## Before proposing

1. Skim **`docs/context/PROJECT_CONTEXT.md`** (current architecture + glossary).
2. Skim **`docs/context/PRODUCT_VISION.md`** and **`docs/references/`** (overload, presets, coaching UX).
3. If relevant, check **`docs/memory/DECISIONS_LOG.md`** and **`docs/decisions/`** for recent direction.
4. Glance at **`src/`** layout only if needed to judge feasibility (e.g. `App.tsx`, `lib/`, `storage/`).

## Output format (required)

1. **One short paragraph**: current product stage in your own words (2–4 sentences max).
2. **Options table** (or structured list) with **at least 5** and **at most 10** rows. Each option must include:
   - **Id** — `A`, `B`, `C`, … (stable labels for user reply).
   - **Name** — short title.
   - **User value** — what gets better for the lifter.
   - **Effort** — `S` / `M` / `L` (rough: sessions of work).
   - **Risk** — data migration, UX complexity, or scope creep (one line).
   - **Depends on** — `—` or brief note (e.g. “settings store before tuned suggestions”).
3. **Recommendation**: which 1–2 ids you’d ship first and **why** (3–5 sentences, ties to vision).
4. **Selection line**: exact instruction, e.g. `Reply with letter(s), e.g. "C" or "A + F".`

## Ranking rules

- Favor **vertical slices** (shippable UX + tests) over horizontal refactors unless refactor unblocks vision.
- Call out **local-first** and **non-medical** constraints where relevant.
- Include at least one option touching **progressive overload / coaching** and one touching **data safety or export** if not already solved.
- Avoid duplicate options; merge similar ideas into one row with bullets if needed.

## After the user selects

When the user replies with id(s), **then** switch to implementer mode: restate chosen scope, list files likely touched, run verification (`format:check`, `lint`, `typecheck`, `test`) after changes, update `PROJECT_CONTEXT.md` or ADR if contracts change.

## Guardrails

- Do not invent features that contradict **`NON-goals`** in `PROJECT_CONTEXT.md` without flagging them as “requires ADR / product decision.”
- Do not promise medical outcomes; coaching copy stays **suggestive + editable**.

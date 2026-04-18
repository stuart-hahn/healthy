import type { Exercise, WorkoutTemplate, WorkoutTemplateBlock } from "../../types/domain";

export type DraftSetLike = { reps: string };
export type DraftBlockLike = { exerciseId: string; sets: DraftSetLike[] };

export type BuildTemplateFromDraftResult =
  | { ok: true; template: WorkoutTemplate }
  | { ok: false; error: string };

function parseRepsTarget(value: string): number | null {
  const reps = Number.parseInt(value, 10);
  if (!Number.isFinite(reps)) return null;
  if (reps < 1) return null;
  return reps;
}

export function buildTemplateFromDraft(params: {
  name: string;
  exercises: Exercise[];
  draftBlocks: DraftBlockLike[];
  newId?: () => string;
  now?: () => string;
}): BuildTemplateFromDraftResult {
  const name = params.name.trim();
  if (!name) return { ok: false, error: "Template name is required." };

  const newId = params.newId ?? (() => crypto.randomUUID());
  const now = params.now ?? (() => new Date().toISOString());

  const blocks: WorkoutTemplateBlock[] = [];
  for (const db of params.draftBlocks) {
    if (!db.exerciseId) continue;
    const ex = params.exercises.find((e) => e.id === db.exerciseId);
    if (!ex) continue;
    const reps: number[] = [];
    for (const row of db.sets) {
      const r = parseRepsTarget(row.reps);
      if (!r) continue;
      reps.push(r);
    }
    if (reps.length === 0) continue;
    blocks.push({
      id: newId(),
      exerciseId: ex.id,
      exerciseName: ex.name,
      reps,
    });
  }

  if (blocks.length === 0) {
    return {
      ok: false,
      error:
        "Add at least one exercise with at least one set (reps filled) before saving a template.",
    };
  }

  const template: WorkoutTemplate = {
    id: newId(),
    name,
    createdAt: now(),
    blocks,
  };
  return { ok: true, template };
}

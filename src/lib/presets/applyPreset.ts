import type { AppStateV2, Exercise } from "../../types/domain";
import type { WorkoutPresetDefinition } from "../../types/preset";

export function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export type ApplyPresetResult = {
  next: AppStateV2;
  /** Parallel to `preset.movements` — id to use when logging. */
  exerciseIds: string[];
};

/**
 * Ensure each movement exists in the catalog (match by normalized name; reuse first match).
 * If name matches but equipment differs, existing row wins — user can edit catalog later.
 */
export function applyPresetToCatalog(
  state: AppStateV2,
  preset: WorkoutPresetDefinition,
  newId: () => string = () => crypto.randomUUID(),
  now: () => string = () => new Date().toISOString(),
): ApplyPresetResult {
  const exercises = [...state.exercises];
  const exerciseIds: string[] = [];

  for (const m of preset.movements) {
    const norm = normalizeExerciseName(m.name);
    let ex: Exercise | undefined = exercises.find((e) => normalizeExerciseName(e.name) === norm);
    if (!ex) {
      ex = {
        id: newId(),
        name: m.name.trim(),
        equipment: m.equipment,
        createdAt: now(),
      };
      exercises.push(ex);
    }
    exerciseIds.push(ex.id);
  }

  return {
    next: { ...state, exercises },
    exerciseIds,
  };
}

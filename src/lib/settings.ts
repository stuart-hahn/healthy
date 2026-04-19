import type { AppStateV2, UserSettings } from "../types/domain";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  weightUnit: "lb",
  linearIncrement: 5,
  targetReps: 5,
  maxRpeForLoadIncrease: 7,
  hintsDisabledExerciseIds: [],
};

const MAX_HINTS_DISABLED_IDS = 500;

/** Dedupe, cap length; used on merge and when persisting user changes. */
export function normalizeHintsDisabledExerciseIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of ids) {
    if (typeof x !== "string" || x.length === 0) continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
    if (out.length >= MAX_HINTS_DISABLED_IDS) break;
  }
  return out;
}

export function mergeUserSettings(state: AppStateV2): UserSettings {
  const merged = { ...DEFAULT_USER_SETTINGS, ...state.settings };
  merged.hintsDisabledExerciseIds = normalizeHintsDisabledExerciseIds(
    merged.hintsDisabledExerciseIds,
  );
  return merged;
}

/** Ensure loaded v2 state always has full settings object for persistence. */
export function normalizeAppStateV2(state: AppStateV2): AppStateV2 {
  const merged = mergeUserSettings(state);
  const exerciseIds = new Set(state.exercises.map((e) => e.id));
  const hintsDisabledExerciseIds = merged.hintsDisabledExerciseIds.filter((id) =>
    exerciseIds.has(id),
  );
  return {
    ...state,
    settings: { ...merged, hintsDisabledExerciseIds },
    templates: state.templates ?? [],
  };
}

export function clampUserSettings(partial: Partial<UserSettings>): Partial<UserSettings> {
  const out: Partial<UserSettings> = { ...partial };
  if (out.linearIncrement !== undefined) {
    if (!Number.isFinite(out.linearIncrement) || out.linearIncrement < 0.5) {
      out.linearIncrement = DEFAULT_USER_SETTINGS.linearIncrement;
    }
  }
  if (out.targetReps !== undefined) {
    if (!Number.isFinite(out.targetReps)) {
      out.targetReps = DEFAULT_USER_SETTINGS.targetReps;
    } else {
      const t = Math.floor(out.targetReps);
      out.targetReps = Math.min(100, Math.max(1, t));
    }
  }
  if (out.weightUnit !== undefined && out.weightUnit !== "lb" && out.weightUnit !== "kg") {
    out.weightUnit = DEFAULT_USER_SETTINGS.weightUnit;
  }
  if (out.maxRpeForLoadIncrease !== undefined) {
    if (!Number.isFinite(out.maxRpeForLoadIncrease)) {
      out.maxRpeForLoadIncrease = DEFAULT_USER_SETTINGS.maxRpeForLoadIncrease;
    } else {
      const t = Math.round(out.maxRpeForLoadIncrease);
      out.maxRpeForLoadIncrease = Math.min(10, Math.max(1, t));
    }
  }
  if (out.hintsDisabledExerciseIds !== undefined) {
    out.hintsDisabledExerciseIds = normalizeHintsDisabledExerciseIds(out.hintsDisabledExerciseIds);
  }
  return out;
}

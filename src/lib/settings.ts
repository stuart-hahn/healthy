import type { AppStateV2, UserSettings } from "../types/domain";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  weightUnit: "lb",
  linearIncrement: 5,
  targetReps: 5,
};

export function mergeUserSettings(state: AppStateV2): UserSettings {
  return { ...DEFAULT_USER_SETTINGS, ...state.settings };
}

/** Ensure loaded v2 state always has full settings object for persistence. */
export function normalizeAppStateV2(state: AppStateV2): AppStateV2 {
  return {
    ...state,
    settings: { ...DEFAULT_USER_SETTINGS, ...state.settings },
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
  return out;
}

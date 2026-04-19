/**
 * Minimal linear progression helper (foundation).
 * Real presets will pass target reps and equipment increment from settings.
 */

export type LinearSuggestionInput = {
  /** Heaviest working set from last session (or best set). */
  lastTopSet: { weight: number; reps: number; rpe?: number } | null;
  /** Smallest load step (e.g. 5 for lower body, 2.5 upper). */
  increment: number;
  /** Rep target to earn a load increase. */
  targetReps: number;
  /** Display suffix for weights in `reason` (e.g. lb, kg). */
  unitLabel?: string;
  /**
   * When top-set RPE is logged, defer load increase until RPE is at or below this (1–10).
   * Matches “manageable effort” before adding load; ignored when RPE is missing.
   */
  maxRpeForLoadIncrease?: number;
};

/** Top-set RPE above this blocks a load increase until effort drops (when RPE is logged). */
export const DEFAULT_MAX_RPE_FOR_LOAD_INCREASE = 7;

/** One-line explanation of the linear rule (same for bump / hold). */
export const LINEAR_RULE_HINT =
  "Linear progression: when your heaviest set hits the target rep count, the next load step is your smallest plate increment.";

export function linearRpeGateHint(maxRpeForLoadIncrease: number): string {
  return `When the top set includes RPE, a load increase waits until that RPE is at or below ${maxRpeForLoadIncrease} (suggestive — adjust for how you feel).`;
}

export type LinearSuggestion = {
  weight: number;
  reason: string;
  ruleHint: string;
  /** `hold` = repeat same top-set weight next session (e.g. RPE too high). */
  loadAction: "increment" | "hold";
};

function topSetRpeForProgression(rpe: number | undefined): number | undefined {
  if (rpe === undefined) return undefined;
  if (!Number.isFinite(rpe)) return undefined;
  const rounded = Math.round(rpe);
  if (rounded < 1 || rounded > 10) return undefined;
  return rounded;
}

/**
 * If last session hit at least `targetReps` on the top set, suggest adding `increment`,
 * unless logged top-set RPE is above `maxRpeForLoadIncrease` — then suggest holding load.
 * Otherwise return null (double progression / add reps first can come later).
 */
export function suggestNextLinearLoad(input: LinearSuggestionInput): LinearSuggestion | null {
  const {
    lastTopSet,
    increment,
    targetReps,
    unitLabel = "lb",
    maxRpeForLoadIncrease = DEFAULT_MAX_RPE_FOR_LOAD_INCREASE,
  } = input;
  if (!lastTopSet || increment <= 0 || targetReps <= 0) return null;
  if (lastTopSet.weight < 0 || lastTopSet.reps < 0) return null;
  if (lastTopSet.reps < targetReps) return null;

  const u = unitLabel;
  const rpe = topSetRpeForProgression(lastTopSet.rpe);
  const rpeBlocksBump =
    rpe !== undefined && maxRpeForLoadIncrease >= 1 && rpe > maxRpeForLoadIncrease;

  if (rpeBlocksBump) {
    return {
      weight: lastTopSet.weight,
      loadAction: "hold",
      reason: `Hit ${targetReps}+ reps at ${lastTopSet.weight} ${u}, but top-set RPE was ${rpe}. Stay at ${lastTopSet.weight} ${u} next time — try a load bump when top-set RPE is ${maxRpeForLoadIncrease} or below.`,
      ruleHint: `${LINEAR_RULE_HINT} ${linearRpeGateHint(maxRpeForLoadIncrease)}`,
    };
  }

  return {
    weight: lastTopSet.weight + increment,
    loadAction: "increment",
    reason: `Hit ${targetReps}+ reps at ${lastTopSet.weight} ${u} — try ${lastTopSet.weight + increment} ${u} next time.`,
    ruleHint: LINEAR_RULE_HINT,
  };
}

/** Best single set by weight, then reps (for picking "top set" from flat sets). */
export function pickTopSet(
  sets: { weight: number; reps: number; rpe?: number }[],
): { weight: number; reps: number; rpe?: number } | null {
  if (sets.length === 0) return null;
  return sets.reduce((best, s) => {
    if (s.weight > best.weight) return s;
    if (s.weight === best.weight && s.reps > best.reps) return s;
    return best;
  });
}

/**
 * Minimal linear progression helper (foundation).
 * Real presets will pass target reps and equipment increment from settings.
 */

export type LinearSuggestionInput = {
  /** Heaviest working set from last session (or best set). */
  lastTopSet: { weight: number; reps: number } | null;
  /** Smallest load step (e.g. 5 for lower body, 2.5 upper). */
  increment: number;
  /** Rep target to earn a load increase. */
  targetReps: number;
};

export type LinearSuggestion = {
  weight: number;
  reason: string;
};

/**
 * If last session hit at least `targetReps` on the top set, suggest adding `increment`.
 * Otherwise return null (double progression / add reps first can come later).
 */
export function suggestNextLinearLoad(input: LinearSuggestionInput): LinearSuggestion | null {
  const { lastTopSet, increment, targetReps } = input;
  if (!lastTopSet || increment <= 0 || targetReps <= 0) return null;
  if (lastTopSet.weight < 0 || lastTopSet.reps < 0) return null;
  if (lastTopSet.reps < targetReps) return null;

  return {
    weight: lastTopSet.weight + increment,
    reason: `Hit ${targetReps}+ reps at ${lastTopSet.weight} — try ${lastTopSet.weight + increment} next time.`,
  };
}

/** Best single set by weight, then reps (for picking "top set" from flat sets). */
export function pickTopSet(
  sets: { weight: number; reps: number }[],
): { weight: number; reps: number } | null {
  if (sets.length === 0) return null;
  return sets.reduce((best, s) => {
    if (s.weight > best.weight) return s;
    if (s.weight === best.weight && s.reps > best.reps) return s;
    return best;
  });
}

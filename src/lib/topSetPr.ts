import { pickTopSet } from "./progression/linear";
import { blockForExercise } from "./sessions";
import type { SessionBlock, TrainingSession } from "../types/domain";

/**
 * Heaviest single-set weight logged for this exercise before the session being saved.
 * Uses pickTopSet per block, then max across sessions (not medical; not a competition lift standard).
 */
export function bestHistoricalTopSetWeight(
  sessions: TrainingSession[],
  exerciseId: string,
): number | null {
  let best: number | null = null;
  for (const s of sessions) {
    const b = blockForExercise(s, exerciseId);
    if (!b) continue;
    const top = pickTopSet(b.sets);
    if (!top) continue;
    if (best === null || top.weight > best) best = top.weight;
  }
  return best;
}

export type TopSetPrKind = "first_log" | "new_best" | "tie_best" | "below_best";

export type TopSetPrResult = {
  kind: TopSetPrKind;
  /** Best top-set weight in prior history (null only when kind is first_log). */
  priorBest: number | null;
};

/**
 * Compare current block's top-set weight to all prior logs for that exercise.
 * `existingSessions` must not include the session being saved.
 */
export function evaluateTopSetPr(
  existingSessions: TrainingSession[],
  block: SessionBlock,
): TopSetPrResult {
  const top = pickTopSet(block.sets);
  const w = top?.weight ?? 0;
  const priorBest = bestHistoricalTopSetWeight(existingSessions, block.exerciseId);

  if (priorBest === null) {
    return { kind: "first_log", priorBest: null };
  }
  if (w > priorBest) return { kind: "new_best", priorBest };
  if (w === priorBest) return { kind: "tie_best", priorBest };
  return { kind: "below_best", priorBest };
}

/** Short line for the save summary (supportive tone; not medical). */
export function formatTopSetPrNote(
  pr: TopSetPrResult,
  currentTopWeight: number,
  unit: string,
): string {
  const u = unit;
  switch (pr.kind) {
    case "first_log":
      return `Top-set baseline for this lift: ${currentTopWeight} ${u} (nothing to beat yet).`;
    case "new_best":
      return `New heaviest top-set in your log: ${currentTopWeight} ${u} (was ${pr.priorBest} ${u}).`;
    case "tie_best":
      return `Matched your heaviest logged top-set (${pr.priorBest} ${u}).`;
    case "below_best":
      return `Below your heaviest logged top-set (best so far ${pr.priorBest} ${u}).`;
  }
}

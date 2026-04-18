import type { SetEntry, TrainingSession } from "../types/domain";
import { pickTopSet } from "./progression/linear";
import { blockForExercise, sessionsForExercise } from "./sessions";

export type LiftTrendRow = {
  sessionId: string;
  date: string;
  volume: number;
  topWeight: number;
  topReps: number;
  setCount: number;
};

/** Cap table + sparkline depth (nextpr scope). */
export const LIFT_TREND_MAX_ROWS = 12;

function volumeFromSets(sets: SetEntry[]): number {
  let v = 0;
  for (const s of sets) {
    v += s.weight * s.reps;
  }
  return v;
}

/**
 * Newest-first rows for the history table, capped. Skips sessions with no sets for this exercise.
 */
export function buildLiftTrendRows(
  allSessions: TrainingSession[],
  exerciseId: string,
  maxRows = LIFT_TREND_MAX_ROWS,
): LiftTrendRow[] {
  const hist = sessionsForExercise(allSessions, exerciseId);
  const out: LiftTrendRow[] = [];
  for (const s of hist) {
    if (out.length >= maxRows) break;
    const block = blockForExercise(s, exerciseId);
    if (!block || block.sets.length === 0) continue;
    const top = pickTopSet(block.sets);
    out.push({
      sessionId: s.id,
      date: s.date,
      volume: volumeFromSets(block.sets),
      topWeight: top?.weight ?? 0,
      topReps: top?.reps ?? 0,
      setCount: block.sets.length,
    });
  }
  return out;
}

/** Volumes oldest → newest (left-to-right sparkline). */
export function liftTrendVolumesChronological(rowsNewestFirst: LiftTrendRow[]): number[] {
  return [...rowsNewestFirst].reverse().map((r) => r.volume);
}

/**
 * SVG `points` string for `<polyline>` (x,y pairs). Empty if `values` is empty.
 */
export function buildSparklinePolylinePoints(
  values: number[],
  width: number,
  height: number,
  pad = 3,
): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  return values
    .map((v, i) => {
      const x = pad + (values.length <= 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
      const y = pad + innerH - ((v - min) / range) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

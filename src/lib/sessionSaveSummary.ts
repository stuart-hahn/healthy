import { pickTopSet } from "./progression/linear";
import { blockForExercise, sessionsForExercise } from "./sessions";
import { evaluateTopSetPr, type TopSetPrResult } from "./topSetPr";
import type { SessionBlock, SetEntry, TrainingSession } from "../types/domain";

export type SessionSaveComparison = {
  exerciseId: string;
  exerciseName: string;
  /** Most recent prior session date (YYYY-MM-DD), if any */
  priorDate: string | null;
  current: {
    volume: number;
    topWeight: number;
    topReps: number;
    setCount: number;
  };
  prior: {
    volume: number;
    topWeight: number;
    topReps: number;
    setCount: number;
  } | null;
  /** Heaviest single-set weight vs prior logs (algorithmic, not a formal competition standard). */
  topSetPr: TopSetPrResult;
};

function volumeFromSets(sets: SetEntry[]): number {
  let v = 0;
  for (const s of sets) {
    v += s.weight * s.reps;
  }
  return v;
}

/**
 * For each block in a session about to be saved, compare to the latest prior session
 * for that exercise (sessions must not yet include the new session).
 */
export function buildSessionSaveSummary(
  existingSessions: TrainingSession[],
  newBlocks: SessionBlock[],
): SessionSaveComparison[] {
  const out: SessionSaveComparison[] = [];
  for (const block of newBlocks) {
    const topSetPr = evaluateTopSetPr(existingSessions, block);
    const hist = sessionsForExercise(existingSessions, block.exerciseId);
    const priorSession = hist[0];
    const priorBlock = priorSession ? blockForExercise(priorSession, block.exerciseId) : undefined;
    const top = pickTopSet(block.sets);
    const tw = top?.weight ?? 0;
    const tr = top?.reps ?? 0;
    const current = {
      volume: volumeFromSets(block.sets),
      topWeight: tw,
      topReps: tr,
      setCount: block.sets.length,
    };
    if (!priorSession || !priorBlock) {
      out.push({
        exerciseId: block.exerciseId,
        exerciseName: block.exerciseName,
        priorDate: null,
        current,
        prior: null,
        topSetPr,
      });
      continue;
    }
    const pTop = pickTopSet(priorBlock.sets);
    const pw = pTop?.weight ?? 0;
    const pr = pTop?.reps ?? 0;
    out.push({
      exerciseId: block.exerciseId,
      exerciseName: block.exerciseName,
      priorDate: priorSession.date,
      current,
      prior: {
        volume: volumeFromSets(priorBlock.sets),
        topWeight: pw,
        topReps: pr,
        setCount: priorBlock.sets.length,
      },
      topSetPr,
    });
  }
  return out;
}

import type { SessionBlock, TrainingSession } from "../types/domain";

export function sessionsForExercise(
  sessions: TrainingSession[],
  exerciseId: string,
): TrainingSession[] {
  return sessions
    .filter((s) => s.blocks.some((b) => b.exerciseId === exerciseId))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function blockForExercise(
  session: TrainingSession,
  exerciseId: string,
): SessionBlock | undefined {
  return session.blocks.find((b) => b.exerciseId === exerciseId);
}

/** Newest first: calendar date, then createdAt (second session same day sorts below first). */
export function sortSessionsByNewestFirst(sessions: TrainingSession[]): TrainingSession[] {
  return [...sessions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

/** Latest training day by calendar date, then createdAt. */
export function mostRecentSession(sessions: TrainingSession[]): TrainingSession | null {
  const sorted = sortSessionsByNewestFirst(sessions);
  return sorted[0] ?? null;
}

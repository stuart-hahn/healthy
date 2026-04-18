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

/** Latest training day by calendar date, then createdAt. */
export function mostRecentSession(sessions: TrainingSession[]): TrainingSession | null {
  if (sessions.length === 0) return null;
  const sorted = [...sessions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  return sorted[0] ?? null;
}

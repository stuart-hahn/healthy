import type { TrainingSession, UserSettings } from "../../types/domain";
import { blockForExercise, sessionsForExercise } from "../sessions";
import { pickTopSet, suggestNextLinearLoad, type LinearSuggestion } from "./linear";

/**
 * Linear load suggestion for one exercise from session history, or null.
 */
export function linearHintForExercise(
  exerciseId: string,
  sessions: TrainingSession[],
  settings: UserSettings,
): LinearSuggestion | null {
  const hist = sessionsForExercise(sessions, exerciseId);
  const last = hist[0];
  if (!last) return null;
  const block = blockForExercise(last, exerciseId);
  if (!block || block.sets.length === 0) return null;
  const top = pickTopSet(block.sets);
  const unitLabel = settings.weightUnit === "kg" ? "kg" : "lb";
  return suggestNextLinearLoad({
    lastTopSet: top,
    increment: settings.linearIncrement,
    targetReps: settings.targetReps,
    unitLabel,
  });
}

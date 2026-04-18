import type { TrainingSession, UserSettings } from "../../types/domain";
import { blockForExercise, sessionsForExercise } from "../sessions";
import { LINEAR_RULE_HINT, pickTopSet, suggestNextLinearLoad } from "./linear";

export type LinearHintUi = {
  /** Actionable line (what to try next, or what to do before loading up) */
  primary: string;
  /** One-line rule transparency (option C / coaching UX) */
  rule: string;
  /** Suggested next top-set working weight when the linear bump applies */
  nextWeight: number | null;
};

/**
 * Linear load guidance for one exercise from session history, or null if no usable history.
 */
export function linearHintUiForExercise(
  exerciseId: string,
  sessions: TrainingSession[],
  settings: UserSettings,
): LinearHintUi | null {
  const hist = sessionsForExercise(sessions, exerciseId);
  const last = hist[0];
  if (!last) return null;
  const block = blockForExercise(last, exerciseId);
  if (!block || block.sets.length === 0) return null;
  const top = pickTopSet(block.sets);
  if (!top) return null;
  const unitLabel = settings.weightUnit === "kg" ? "kg" : "lb";
  const suggestion = suggestNextLinearLoad({
    lastTopSet: top,
    increment: settings.linearIncrement,
    targetReps: settings.targetReps,
    unitLabel,
  });
  if (suggestion) {
    return {
      primary: suggestion.reason,
      rule: suggestion.ruleHint,
      nextWeight: suggestion.weight,
    };
  }
  const u = unitLabel;
  return {
    primary: `Heaviest set was ${top.weight}×${top.reps} ${u}. Reach ${settings.targetReps}+ reps on that set before adding ${settings.linearIncrement} ${u}.`,
    rule: LINEAR_RULE_HINT,
    nextWeight: null,
  };
}

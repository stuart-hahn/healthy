import { describe, expect, it } from "vitest";
import { DEFAULT_USER_SETTINGS } from "../settings";
import type { TrainingSession } from "../../types/domain";
import { linearHintUiForExercise } from "./hintForExercise";

describe("linearHintUiForExercise", () => {
  it("returns null with no sessions", () => {
    expect(linearHintUiForExercise("ex-1", [], DEFAULT_USER_SETTINGS)).toBeNull();
  });

  it("suggests when history qualifies", () => {
    const sessions: TrainingSession[] = [
      {
        id: "s1",
        date: "2026-01-01",
        createdAt: "t",
        notes: "",
        blocks: [
          {
            id: "b1",
            exerciseId: "ex-1",
            exerciseName: "Bench",
            sets: [{ id: "x", weight: 100, reps: 5 }],
          },
        ],
      },
    ];
    const h = linearHintUiForExercise("ex-1", sessions, {
      ...DEFAULT_USER_SETTINGS,
      linearIncrement: 5,
      targetReps: 5,
    });
    expect(h).not.toBeNull();
    expect(h?.nextWeight).toBe(105);
    expect(h?.rule).toMatch(/Linear progression/);
    expect(h?.primary).toMatch(/105/);
  });

  it("explains hold when reps below target", () => {
    const sessions: TrainingSession[] = [
      {
        id: "s1",
        date: "2026-01-01",
        createdAt: "t",
        notes: "",
        blocks: [
          {
            id: "b1",
            exerciseId: "ex-1",
            exerciseName: "Bench",
            sets: [{ id: "x", weight: 100, reps: 4 }],
          },
        ],
      },
    ];
    const h = linearHintUiForExercise("ex-1", sessions, {
      ...DEFAULT_USER_SETTINGS,
      linearIncrement: 5,
      targetReps: 5,
    });
    expect(h).not.toBeNull();
    expect(h?.nextWeight).toBeNull();
    expect(h?.primary).toMatch(/100×4/);
    expect(h?.primary).toMatch(/5\+ reps/);
    expect(h?.rule).toMatch(/Linear progression/);
  });
});

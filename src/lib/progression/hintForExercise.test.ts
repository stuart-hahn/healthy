import { describe, expect, it } from "vitest";
import { DEFAULT_USER_SETTINGS } from "../settings";
import type { TrainingSession } from "../../types/domain";
import { linearHintForExercise } from "./hintForExercise";

describe("linearHintForExercise", () => {
  it("returns null with no sessions", () => {
    expect(linearHintForExercise("ex-1", [], DEFAULT_USER_SETTINGS)).toBeNull();
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
    const h = linearHintForExercise("ex-1", sessions, {
      ...DEFAULT_USER_SETTINGS,
      linearIncrement: 5,
      targetReps: 5,
    });
    expect(h).not.toBeNull();
    expect(h?.weight).toBe(105);
  });
});

import { describe, expect, it } from "vitest";
import type { TrainingSession } from "../types/domain";
import { buildSessionSaveSummary } from "./sessionSaveSummary";

describe("buildSessionSaveSummary", () => {
  const prior: TrainingSession[] = [
    {
      id: "s-old",
      date: "2026-03-01",
      createdAt: "2026-03-01T12:00:00.000Z",
      notes: "",
      blocks: [
        {
          id: "b1",
          exerciseId: "ex-1",
          exerciseName: "Bench",
          sets: [
            { id: "a", weight: 100, reps: 5 },
            { id: "b", weight: 100, reps: 5 },
          ],
        },
      ],
    },
  ];

  it("marks first-time lift when no prior session", () => {
    const rows = buildSessionSaveSummary(prior, [
      {
        id: "nb",
        exerciseId: "ex-new",
        exerciseName: "Row",
        sets: [{ id: "x", weight: 90, reps: 8 }],
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.prior).toBeNull();
    expect(rows[0]?.current.volume).toBe(720);
    expect(rows[0]?.topSetPr.kind).toBe("first_log");
  });

  it("compares to most recent prior session for same exercise", () => {
    const rows = buildSessionSaveSummary(prior, [
      {
        id: "nb",
        exerciseId: "ex-1",
        exerciseName: "Bench",
        sets: [
          { id: "x", weight: 105, reps: 5 },
          { id: "y", weight: 105, reps: 5 },
        ],
      },
    ]);
    expect(rows[0]?.priorDate).toBe("2026-03-01");
    expect(rows[0]?.prior?.volume).toBe(1000);
    expect(rows[0]?.current.volume).toBe(1050);
    expect(rows[0]?.prior?.topWeight).toBe(100);
    expect(rows[0]?.current.topWeight).toBe(105);
    expect(rows[0]?.topSetPr.kind).toBe("new_best");
    expect(rows[0]?.topSetPr.priorBest).toBe(100);
  });
});

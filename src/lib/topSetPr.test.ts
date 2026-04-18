import { describe, expect, it } from "vitest";
import type { TrainingSession } from "../types/domain";
import { bestHistoricalTopSetWeight, evaluateTopSetPr, formatTopSetPrNote } from "./topSetPr";

describe("bestHistoricalTopSetWeight", () => {
  it("returns max top-set weight across sessions", () => {
    const sessions: TrainingSession[] = [
      {
        id: "a",
        date: "2026-01-01",
        createdAt: "t",
        notes: "",
        blocks: [
          {
            id: "b",
            exerciseId: "ex-1",
            exerciseName: "Bench",
            sets: [{ id: "1", weight: 100, reps: 5 }],
          },
        ],
      },
      {
        id: "b",
        date: "2026-01-08",
        createdAt: "t",
        notes: "",
        blocks: [
          {
            id: "b",
            exerciseId: "ex-1",
            exerciseName: "Bench",
            sets: [
              { id: "1", weight: 105, reps: 5 },
              { id: "2", weight: 95, reps: 5 },
            ],
          },
        ],
      },
    ];
    expect(bestHistoricalTopSetWeight(sessions, "ex-1")).toBe(105);
  });
});

describe("evaluateTopSetPr", () => {
  const prior: TrainingSession[] = [
    {
      id: "old",
      date: "2026-03-01",
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

  it("detects new best", () => {
    const pr = evaluateTopSetPr(prior, {
      id: "nb",
      exerciseId: "ex-1",
      exerciseName: "Bench",
      sets: [{ id: "y", weight: 105, reps: 5 }],
    });
    expect(pr.kind).toBe("new_best");
    expect(pr.priorBest).toBe(100);
  });

  it("detects tie", () => {
    const pr = evaluateTopSetPr(prior, {
      id: "nb",
      exerciseId: "ex-1",
      exerciseName: "Bench",
      sets: [{ id: "y", weight: 100, reps: 3 }],
    });
    expect(pr.kind).toBe("tie_best");
  });

  it("detects below best", () => {
    const pr = evaluateTopSetPr(prior, {
      id: "nb",
      exerciseId: "ex-1",
      exerciseName: "Bench",
      sets: [{ id: "y", weight: 95, reps: 5 }],
    });
    expect(pr.kind).toBe("below_best");
    expect(pr.priorBest).toBe(100);
  });
});

describe("formatTopSetPrNote", () => {
  it("formats new_best", () => {
    const s = formatTopSetPrNote({ kind: "new_best", priorBest: 100 }, 105, "lb");
    expect(s).toContain("105");
    expect(s).toContain("100");
  });
});

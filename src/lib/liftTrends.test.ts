import { describe, expect, it } from "vitest";
import type { TrainingSession } from "../types/domain";
import {
  buildLiftTrendRows,
  buildSparklinePolylinePoints,
  liftTrendVolumesChronological,
  LIFT_TREND_MAX_ROWS,
} from "./liftTrends";

const squatId = "ex-sq";

function session(
  id: string,
  date: string,
  sets: { weight: number; reps: number }[],
): TrainingSession {
  return {
    id,
    date,
    createdAt: `${date}T12:00:00.000Z`,
    notes: "",
    blocks: [
      {
        id: `b-${id}`,
        exerciseId: squatId,
        exerciseName: "Squat",
        sets: sets.map((s, i) => ({
          id: `set-${id}-${i}`,
          weight: s.weight,
          reps: s.reps,
        })),
      },
    ],
  };
}

describe("buildLiftTrendRows", () => {
  it("returns newest first with volume and top set", () => {
    const sessions: TrainingSession[] = [
      session("a", "2026-01-01", [{ weight: 100, reps: 5 }]),
      session("b", "2026-01-03", [{ weight: 105, reps: 5 }]),
    ];
    const rows = buildLiftTrendRows(sessions, squatId);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.sessionId).toBe("b");
    expect(rows[0]?.volume).toBe(525);
    expect(rows[0]?.topWeight).toBe(105);
    expect(rows[1]?.volume).toBe(500);
  });

  it("respects maxRows", () => {
    const sessions: TrainingSession[] = Array.from({ length: LIFT_TREND_MAX_ROWS + 4 }, (_, i) =>
      session(`s${i}`, `2026-01-${String(i + 1).padStart(2, "0")}`, [{ weight: 100, reps: 1 }]),
    );
    const rows = buildLiftTrendRows(sessions, squatId, LIFT_TREND_MAX_ROWS);
    expect(rows.length).toBe(LIFT_TREND_MAX_ROWS);
  });
});

describe("liftTrendVolumesChronological", () => {
  it("reverses to oldest first", () => {
    const rows = [
      { sessionId: "b", date: "2026-01-02", volume: 200, topWeight: 0, topReps: 0, setCount: 1 },
      { sessionId: "a", date: "2026-01-01", volume: 100, topWeight: 0, topReps: 0, setCount: 1 },
    ];
    expect(liftTrendVolumesChronological(rows)).toEqual([100, 200]);
  });
});

describe("buildSparklinePolylinePoints", () => {
  it("returns empty for no values", () => {
    expect(buildSparklinePolylinePoints([], 100, 40)).toBe("");
  });

  it("produces two coordinates per value", () => {
    const pts = buildSparklinePolylinePoints([10, 20, 15], 100, 40, 0);
    const pairs = pts.split(" ");
    expect(pairs.length).toBe(3);
  });
});

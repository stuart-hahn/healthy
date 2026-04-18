import { describe, expect, it } from "vitest";
import type { AppStateV2 } from "../../types/domain";
import { BUNDLED_PRESETS } from "../../data/presets";
import { applyPresetToCatalog, normalizeExerciseName } from "./applyPreset";

const empty: AppStateV2 = { version: 2, exercises: [], sessions: [] };

describe("normalizeExerciseName", () => {
  it("trims and collapses space", () => {
    expect(normalizeExerciseName("  Back   Squat ")).toBe("back squat");
  });
});

describe("applyPresetToCatalog", () => {
  it("creates exercises for each movement", () => {
    const preset = BUNDLED_PRESETS.find((p) => p.id === "full-body-strength-a");
    expect(preset).toBeDefined();
    if (!preset) return;

    let n = 0;
    const { next, exerciseIds } = applyPresetToCatalog(
      empty,
      preset,
      () => `id-${++n}`,
      () => "t0",
    );

    expect(next.exercises).toHaveLength(3);
    expect(exerciseIds).toEqual(["id-1", "id-2", "id-3"]);
    expect(next.exercises[0]?.name).toBe("Back squat");
  });

  it("reuses existing exercise by normalized name", () => {
    const preset = BUNDLED_PRESETS.find((p) => p.id === "full-body-strength-a");
    expect(preset).toBeDefined();
    if (!preset) return;

    const withBench: AppStateV2 = {
      ...empty,
      exercises: [
        {
          id: "existing-bench",
          name: "bench press",
          equipment: "barbell",
          createdAt: "t",
        },
      ],
    };
    const { next, exerciseIds } = applyPresetToCatalog(
      withBench,
      preset,
      () => "new-id",
      () => "t0",
    );

    expect(next.exercises.some((e) => e.id === "existing-bench")).toBe(true);
    expect(exerciseIds[1]).toBe("existing-bench");
    expect(
      next.exercises.filter((e) => normalizeExerciseName(e.name) === "bench press"),
    ).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import { buildTemplateFromDraft } from "./templateFromDraft";

describe("buildTemplateFromDraft", () => {
  it("rejects blank name", () => {
    const result = buildTemplateFromDraft({
      name: "   ",
      exercises: [],
      draftBlocks: [],
      newId: () => "id",
      now: () => "now",
    });
    expect(result.ok).toBe(false);
  });

  it("builds blocks with reps targets and skips empty ones", () => {
    const result = buildTemplateFromDraft({
      name: "My template",
      exercises: [{ id: "ex-1", name: "Squat", equipment: "barbell", createdAt: "t" }],
      draftBlocks: [
        { exerciseId: "ex-1", sets: [{ reps: "5" }, { reps: "5" }, { reps: "5" }] },
        { exerciseId: "", sets: [{ reps: "5" }] },
      ],
      newId: (() => {
        let i = 0;
        return () => `id-${i++}`;
      })(),
      now: () => "2026-01-01T00:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.template.name).toBe("My template");
    expect(result.template.blocks).toHaveLength(1);
    expect(result.template.blocks[0]?.reps).toEqual([5, 5, 5]);
  });
});

import { describe, expect, it } from "vitest";
import { pickTopSet, suggestNextLinearLoad } from "./linear";

describe("suggestNextLinearLoad", () => {
  it("returns null without history", () => {
    expect(
      suggestNextLinearLoad({
        lastTopSet: null,
        increment: 5,
        targetReps: 5,
      }),
    ).toBeNull();
  });

  it("returns null when reps below target", () => {
    expect(
      suggestNextLinearLoad({
        lastTopSet: { weight: 100, reps: 4 },
        increment: 5,
        targetReps: 5,
      }),
    ).toBeNull();
  });

  it("suggests load bump when target reps met", () => {
    const out = suggestNextLinearLoad({
      lastTopSet: { weight: 135, reps: 5 },
      increment: 5,
      targetReps: 5,
    });
    expect(out).not.toBeNull();
    expect(out?.weight).toBe(140);
    expect(out?.reason).toMatch(/140/);
    expect(out?.reason).toMatch(/lb/);
  });

  it("uses unitLabel in reason", () => {
    const out = suggestNextLinearLoad({
      lastTopSet: { weight: 60, reps: 5 },
      increment: 2.5,
      targetReps: 5,
      unitLabel: "kg",
    });
    expect(out?.reason).toMatch(/kg/);
  });
});

describe("pickTopSet", () => {
  it("returns null for empty", () => {
    expect(pickTopSet([])).toBeNull();
  });

  it("prefers higher weight", () => {
    expect(
      pickTopSet([
        { weight: 100, reps: 10 },
        { weight: 110, reps: 3 },
      ]),
    ).toEqual({ weight: 110, reps: 3 });
  });

  it("breaks ties with reps", () => {
    expect(
      pickTopSet([
        { weight: 100, reps: 5 },
        { weight: 100, reps: 8 },
      ]),
    ).toEqual({ weight: 100, reps: 8 });
  });
});

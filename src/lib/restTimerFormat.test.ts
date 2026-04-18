import { describe, expect, it } from "vitest";
import { formatSecondsAsMmSs } from "./restTimerFormat";

describe("formatSecondsAsMmSs", () => {
  it("formats zero", () => {
    expect(formatSecondsAsMmSs(0)).toBe("0:00");
  });

  it("pads seconds", () => {
    expect(formatSecondsAsMmSs(65)).toBe("1:05");
  });

  it("handles large values", () => {
    expect(formatSecondsAsMmSs(125)).toBe("2:05");
  });
});

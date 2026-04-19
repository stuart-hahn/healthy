import { describe, expect, it } from "vitest";
import { buildBackupDeviceSummaryLine } from "./backupSummaryLine";
import { normalizeAppStateV2 } from "./settings";
import type { AppStateV2 } from "../types/domain";

function minimalState(): AppStateV2 {
  return normalizeAppStateV2({
    version: 2,
    exercises: [{ id: "e1", name: "A", equipment: "barbell", createdAt: "t" }],
    sessions: [],
  });
}

describe("buildBackupDeviceSummaryLine", () => {
  it("includes counts and format", () => {
    const line = buildBackupDeviceSummaryLine(minimalState(), null);
    expect(line).toMatch(/1 exercise/);
    expect(line).toMatch(/workout-tracker-export/);
    expect(line).toMatch(/envelope v1/);
    expect(line).toMatch(/No export recorded/);
  });

  it("includes last export when valid ISO", () => {
    const iso = "2026-01-15T10:00:00.000Z";
    const line = buildBackupDeviceSummaryLine(minimalState(), iso);
    expect(line).toMatch(/Last browser export:/);
  });
});

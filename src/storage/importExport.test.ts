import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildExportEnvelope,
  EXPORT_ENVELOPE_VERSION,
  EXPORT_FORMAT,
  parseImportedAppState,
  validateAppStateV2Deep,
} from "./importExport";
import type { AppStateV2 } from "../types/domain";

const __dirname = dirname(fileURLToPath(import.meta.url));

const minimalValid: AppStateV2 = {
  version: 2,
  exercises: [
    {
      id: "ex-1",
      name: "Squat",
      equipment: "barbell",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  sessions: [
    {
      id: "s-1",
      date: "2026-01-02",
      createdAt: "2026-01-02T12:00:00.000Z",
      notes: "",
      blocks: [
        {
          id: "b-1",
          exerciseId: "ex-1",
          exerciseName: "Squat",
          sets: [{ id: "set-1", weight: 135, reps: 5 }],
        },
      ],
    },
  ],
  templates: [
    {
      id: "t-1",
      name: "Full body A (custom)",
      createdAt: "2026-01-01T00:00:00.000Z",
      blocks: [{ id: "tb-1", exerciseId: "ex-1", exerciseName: "Squat", reps: [5, 5, 5] }],
    },
  ],
  settings: { weightUnit: "kg", linearIncrement: 2.5, targetReps: 8, maxRpeForLoadIncrease: 6 },
};

describe("validateAppStateV2Deep", () => {
  it("accepts a minimal valid v2 state", () => {
    expect(validateAppStateV2Deep(minimalValid)).not.toBeNull();
  });

  it("rejects wrong version", () => {
    expect(validateAppStateV2Deep({ ...minimalValid, version: 1 })).toBeNull();
  });

  it("rejects duplicate exercise ids", () => {
    const first = minimalValid.exercises[0];
    if (!first) throw new Error("fixture");
    const bad: unknown = {
      ...minimalValid,
      exercises: [...minimalValid.exercises, { ...first }],
    };
    expect(validateAppStateV2Deep(bad)).toBeNull();
  });

  it("rejects session block referencing unknown exercise", () => {
    const session0 = minimalValid.sessions[0];
    if (!session0) throw new Error("fixture");
    const bad: AppStateV2 = {
      ...minimalValid,
      sessions: [
        {
          ...session0,
          blocks: [
            {
              id: "b-1",
              exerciseId: "missing",
              exerciseName: "X",
              sets: [{ id: "set-1", weight: 1, reps: 1 }],
            },
          ],
        },
      ],
    };
    expect(validateAppStateV2Deep(bad)).toBeNull();
  });

  it("rejects invalid calendar date", () => {
    const session0 = minimalValid.sessions[0];
    if (!session0) throw new Error("fixture");
    const bad: AppStateV2 = {
      ...minimalValid,
      sessions: [{ ...session0, date: "01-02-2026" }],
    };
    expect(validateAppStateV2Deep(bad)).toBeNull();
  });
});

describe("parseImportedAppState", () => {
  it("parses wrapped export envelope", () => {
    const env = buildExportEnvelope(minimalValid);
    const result = parseImportedAppState(env);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.version).toBe(2);
    expect(result.state.exercises).toHaveLength(1);
    expect(result.state.settings?.weightUnit).toBe("kg");
    expect(result.state.settings?.maxRpeForLoadIncrease).toBe(6);
  });

  it("parses raw v2 state without envelope", () => {
    const result = parseImportedAppState(minimalValid);
    expect(result.ok).toBe(true);
  });

  it("rejects unknown envelope format", () => {
    const result = parseImportedAppState({
      format: "other",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      state: minimalValid,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects wrong envelope version", () => {
    const result = parseImportedAppState({
      format: EXPORT_FORMAT,
      version: 99,
      exportedAt: "2026-01-01T00:00:00.000Z",
      state: minimalValid,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/version/i);
  });

  it("clamps bad settings on import", () => {
    const loose: AppStateV2 = {
      ...minimalValid,
      settings: {
        linearIncrement: 0.1,
        targetReps: 500,
        weightUnit: "lb",
        maxRpeForLoadIncrease: 99,
      },
    };
    const result = parseImportedAppState(loose);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.settings?.linearIncrement).toBe(5);
    expect(result.state.settings?.targetReps).toBe(100);
    expect(result.state.settings?.maxRpeForLoadIncrease).toBe(10);
  });

  it("defaults max RPE when omitted in import", () => {
    const raw: AppStateV2 = {
      ...minimalValid,
      settings: { weightUnit: "kg", linearIncrement: 2.5, targetReps: 8 },
    };
    const result = parseImportedAppState(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.settings?.maxRpeForLoadIncrease).toBe(7);
  });
});

describe("buildExportEnvelope", () => {
  it("includes format, version, and exportedAt", () => {
    const env = buildExportEnvelope(minimalValid);
    expect(env.format).toBe(EXPORT_FORMAT);
    expect(env.version).toBe(EXPORT_ENVELOPE_VERSION);
    expect(typeof env.exportedAt).toBe("string");
    expect(env.state.version).toBe(2);
  });
});

describe("fixtures/sample-two-month-training.json", () => {
  it("is accepted by parseImportedAppState", () => {
    const path = join(__dirname, "../../fixtures/sample-two-month-training.json");
    const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
    const result = parseImportedAppState(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.sessions.length).toBeGreaterThanOrEqual(20);
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { STORAGE_KEY_V1, STORAGE_KEY_V2 } from "./constants";
import { loadAppState } from "./state";

describe("loadAppState", () => {
  const mem: Record<string, string> = {};
  const storage: Pick<Storage, "getItem" | "setItem"> = {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v;
    },
  };

  beforeEach(() => {
    for (const k of Object.keys(mem)) delete mem[k];
  });

  it("writes v2 empty when storage blank", () => {
    const s = loadAppState(storage);
    expect(s.version).toBe(2);
    expect(s.exercises).toEqual([]);
    expect(s.sessions).toEqual([]);
    expect(mem[STORAGE_KEY_V2]).toBeDefined();
  });

  it("migrates v1 rows to v2", () => {
    mem[STORAGE_KEY_V1] = JSON.stringify([
      {
        id: "legacy-1",
        name: "Squat",
        date: "2026-01-01",
        notes: "",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    const s = loadAppState(storage);
    expect(s.version).toBe(2);
    expect(s.exercises).toHaveLength(1);
    expect(s.sessions[0]?.id).toBe("legacy-1");
    expect(s.sessions[0]?.blocks[0]?.sets).toEqual([]);
    expect(mem[STORAGE_KEY_V2]).toBeDefined();
  });
});

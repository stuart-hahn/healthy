import { describe, expect, it } from "vitest";
import { migrateV1ToV2 } from "./migrateV1";

describe("migrateV1ToV2", () => {
  it("maps rows to sessions with empty sets and merges exercise names", () => {
    const out = migrateV1ToV2([
      {
        id: "s1",
        name: "  Bench  ",
        date: "2026-04-01",
        notes: "felt good",
        createdAt: "2026-04-01T12:00:00.000Z",
      },
      {
        id: "s2",
        name: "Bench",
        date: "2026-04-03",
        notes: "",
        createdAt: "2026-04-03T12:00:00.000Z",
      },
    ]);

    expect(out.version).toBe(2);
    expect(out.exercises).toHaveLength(1);
    expect(out.exercises[0]?.name).toBe("Bench");
    expect(out.sessions).toHaveLength(2);
    expect(out.sessions[0]?.blocks[0]?.exerciseId).toBe(out.exercises[0]?.id);
    expect(out.sessions[1]?.blocks[0]?.exerciseId).toBe(out.exercises[0]?.id);
    expect(out.sessions[0]?.blocks[0]?.sets).toEqual([]);
  });
});

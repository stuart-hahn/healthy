import { describe, expect, it } from "vitest";
import type { TrainingSession } from "../types/domain";
import { mostRecentSession, sortSessionsByNewestFirst } from "./sessions";

describe("mostRecentSession", () => {
  it("returns null for empty", () => {
    expect(mostRecentSession([])).toBeNull();
  });

  it("prefers later calendar date", () => {
    const sessions: TrainingSession[] = [
      {
        id: "a",
        date: "2026-01-01",
        createdAt: "2026-01-01T12:00:00.000Z",
        notes: "",
        blocks: [],
      },
      {
        id: "b",
        date: "2026-01-05",
        createdAt: "2026-01-05T12:00:00.000Z",
        notes: "",
        blocks: [],
      },
    ];
    expect(mostRecentSession(sessions)?.id).toBe("b");
  });

  it("breaks date ties with createdAt", () => {
    const sessions: TrainingSession[] = [
      {
        id: "a",
        date: "2026-01-05",
        createdAt: "2026-01-05T10:00:00.000Z",
        notes: "",
        blocks: [],
      },
      {
        id: "b",
        date: "2026-01-05",
        createdAt: "2026-01-05T18:00:00.000Z",
        notes: "",
        blocks: [],
      },
    ];
    expect(mostRecentSession(sessions)?.id).toBe("b");
  });
});

describe("sortSessionsByNewestFirst", () => {
  it("orders by date then createdAt", () => {
    const sessions: TrainingSession[] = [
      {
        id: "old",
        date: "2026-01-01",
        createdAt: "2026-01-01T12:00:00.000Z",
        notes: "",
        blocks: [],
      },
      {
        id: "newer-day",
        date: "2026-01-10",
        createdAt: "2026-01-10T08:00:00.000Z",
        notes: "",
        blocks: [],
      },
      {
        id: "same-day-later",
        date: "2026-01-10",
        createdAt: "2026-01-10T20:00:00.000Z",
        notes: "",
        blocks: [],
      },
    ];
    expect(sortSessionsByNewestFirst(sessions).map((s) => s.id)).toEqual([
      "same-day-later",
      "newer-day",
      "old",
    ]);
  });
});

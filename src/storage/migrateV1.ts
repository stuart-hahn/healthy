import type {
  AppStateV2,
  Equipment,
  Exercise,
  SessionBlock,
  TrainingSession,
} from "../types/domain";
import type { LegacyWorkout } from "../types/legacy";
import { STORAGE_KEY_V1 } from "./constants";

function isLegacyWorkout(x: unknown): x is LegacyWorkout {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.date === "string" &&
    typeof o.notes === "string" &&
    typeof o.createdAt === "string"
  );
}

function parseV1(raw: string | null): LegacyWorkout[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLegacyWorkout);
  } catch {
    return [];
  }
}

/** Merge duplicate exercise names to one catalog id (trimmed name). */
export function migrateV1ToV2(
  rows: LegacyWorkout[],
  defaultEquipment: Equipment = "other",
): AppStateV2 {
  const sorted = [...rows].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );

  const nameToExerciseId = new Map<string, string>();
  const exercises: Exercise[] = [];

  function exerciseIdForName(name: string, createdAt: string): string {
    const key = name.trim();
    const existing = nameToExerciseId.get(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    nameToExerciseId.set(key, id);
    exercises.push({
      id,
      name: key,
      equipment: defaultEquipment,
      createdAt,
    });
    return id;
  }

  const sessions: TrainingSession[] = sorted.map((w) => {
    const exerciseId = exerciseIdForName(w.name, w.createdAt);
    const block: SessionBlock = {
      id: crypto.randomUUID(),
      exerciseId,
      exerciseName: w.name.trim(),
      sets: [],
    };
    const notes = w.notes.trim()
      ? `${w.notes.trim()}\n\n(Migrated from v1 log.)`
      : "(Migrated from v1 log — add sets in a new session.)";

    return {
      id: w.id,
      date: w.date,
      createdAt: w.createdAt,
      notes,
      blocks: [block],
    };
  });

  return { version: 2, exercises, sessions };
}

/** Read raw v1 from storage getter (for tests and migration). */
export function readLegacyRowsFromStorage(
  getItem: (key: string) => string | null,
): LegacyWorkout[] {
  return parseV1(getItem(STORAGE_KEY_V1));
}

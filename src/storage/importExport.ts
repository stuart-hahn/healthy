import { clampUserSettings, mergeUserSettings, normalizeAppStateV2 } from "../lib/settings";
import type {
  AppStateV2,
  Equipment,
  Exercise,
  SessionBlock,
  SetEntry,
  TrainingSession,
  WorkoutTemplate,
  WorkoutTemplateBlock,
  UserSettings,
} from "../types/domain";

/** Wrapper written by Export; version bumps when shape changes. */
export const EXPORT_FORMAT = "workout-tracker-export" as const;
export const EXPORT_ENVELOPE_VERSION = 1 as const;

export type ExportEnvelopeV1 = {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_ENVELOPE_VERSION;
  exportedAt: string;
  state: AppStateV2;
};

export type ImportResult = { ok: true; state: AppStateV2 } | { ok: false; error: string };

const EQUIPMENT: Equipment[] = ["barbell", "dumbbell", "machine", "bodyweight", "other"];
const EQUIPMENT_SET = new Set<Equipment>(EQUIPMENT);

function isEquipment(x: unknown): x is Equipment {
  return typeof x === "string" && EQUIPMENT_SET.has(x as Equipment);
}

function isIsoDateString(x: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(x);
}

function parseExercise(raw: unknown): Exercise | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  if (typeof o.name !== "string") return null;
  if (!isEquipment(o.equipment)) return null;
  if (typeof o.createdAt !== "string" || o.createdAt.length === 0) return null;
  return {
    id: o.id,
    name: o.name,
    equipment: o.equipment,
    createdAt: o.createdAt,
  };
}

function parseSetEntry(raw: unknown): SetEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  if (typeof o.weight !== "number" || !Number.isFinite(o.weight) || o.weight < 0) return null;
  if (typeof o.reps !== "number" || !Number.isFinite(o.reps)) return null;
  const reps = Math.floor(o.reps);
  if (reps < 1) return null;
  const entry: SetEntry = {
    id: o.id,
    weight: o.weight,
    reps,
  };
  if (o.rpe !== undefined) {
    if (typeof o.rpe !== "number" || !Number.isFinite(o.rpe)) return null;
    const rpe = Math.round(o.rpe);
    if (rpe < 1 || rpe > 10) return null;
    entry.rpe = rpe;
  }
  return entry;
}

function parseSessionBlock(raw: unknown): SessionBlock | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  if (typeof o.exerciseId !== "string" || o.exerciseId.length === 0) return null;
  if (typeof o.exerciseName !== "string") return null;
  if (!Array.isArray(o.sets)) return null;
  const sets: SetEntry[] = [];
  for (const row of o.sets) {
    const s = parseSetEntry(row);
    if (!s) return null;
    sets.push(s);
  }
  return {
    id: o.id,
    exerciseId: o.exerciseId,
    exerciseName: o.exerciseName,
    sets,
  };
}

function parseTrainingSession(raw: unknown): TrainingSession | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  if (typeof o.date !== "string" || !isIsoDateString(o.date)) return null;
  if (typeof o.createdAt !== "string" || o.createdAt.length === 0) return null;
  if (typeof o.notes !== "string") return null;
  if (!Array.isArray(o.blocks)) return null;
  const blocks: SessionBlock[] = [];
  for (const b of o.blocks) {
    const block = parseSessionBlock(b);
    if (!block) return null;
    blocks.push(block);
  }
  return {
    id: o.id,
    date: o.date,
    createdAt: o.createdAt,
    notes: o.notes,
    blocks,
  };
}

function parseTemplateBlock(raw: unknown): WorkoutTemplateBlock | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  if (typeof o.exerciseId !== "string" || o.exerciseId.length === 0) return null;
  if (typeof o.exerciseName !== "string") return null;
  if (!Array.isArray(o.reps)) return null;
  const reps: number[] = [];
  for (const r of o.reps) {
    if (typeof r !== "number" || !Number.isFinite(r)) return null;
    const rr = Math.floor(r);
    if (rr < 1) return null;
    reps.push(rr);
  }
  if (reps.length === 0) return null;
  return { id: o.id, exerciseId: o.exerciseId, exerciseName: o.exerciseName, reps };
}

function parseWorkoutTemplate(raw: unknown): WorkoutTemplate | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  if (typeof o.name !== "string" || o.name.trim().length === 0) return null;
  if (typeof o.createdAt !== "string" || o.createdAt.length === 0) return null;
  if (!Array.isArray(o.blocks)) return null;
  const blocks: WorkoutTemplateBlock[] = [];
  for (const b of o.blocks) {
    const block = parseTemplateBlock(b);
    if (!block) return null;
    blocks.push(block);
  }
  if (blocks.length === 0) return null;
  return { id: o.id, name: o.name, createdAt: o.createdAt, blocks };
}

function parseSettingsPartial(raw: unknown): Partial<UserSettings> | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "object" || raw === null) return undefined;
  const o = raw as Record<string, unknown>;
  const out: Partial<UserSettings> = {};
  if (o.weightUnit === "lb" || o.weightUnit === "kg") out.weightUnit = o.weightUnit;
  if (typeof o.linearIncrement === "number" && Number.isFinite(o.linearIncrement)) {
    out.linearIncrement = o.linearIncrement;
  }
  if (typeof o.targetReps === "number" && Number.isFinite(o.targetReps)) {
    out.targetReps = o.targetReps;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Validates v2 shape, referential integrity (blocks → exercises), and id uniqueness.
 */
export function validateAppStateV2Deep(raw: unknown): AppStateV2 | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 2) return null;
  if (!Array.isArray(o.exercises) || !Array.isArray(o.sessions)) return null;

  const exercises: Exercise[] = [];
  const exerciseIds = new Set<string>();
  for (const ex of o.exercises) {
    const p = parseExercise(ex);
    if (!p) return null;
    if (exerciseIds.has(p.id)) return null;
    exerciseIds.add(p.id);
    exercises.push(p);
  }

  const sessionIds = new Set<string>();
  const sessions: TrainingSession[] = [];
  for (const s of o.sessions) {
    const ts = parseTrainingSession(s);
    if (!ts) return null;
    if (sessionIds.has(ts.id)) return null;
    sessionIds.add(ts.id);
    for (const block of ts.blocks) {
      if (!exerciseIds.has(block.exerciseId)) return null;
    }
    sessions.push(ts);
  }

  let templates: WorkoutTemplate[] | undefined;
  if (o.templates !== undefined) {
    if (!Array.isArray(o.templates)) return null;
    const templateIds = new Set<string>();
    const out: WorkoutTemplate[] = [];
    for (const t of o.templates) {
      const tpl = parseWorkoutTemplate(t);
      if (!tpl) return null;
      if (templateIds.has(tpl.id)) return null;
      templateIds.add(tpl.id);
      for (const block of tpl.blocks) {
        if (!exerciseIds.has(block.exerciseId)) return null;
      }
      out.push(tpl);
    }
    templates = out;
  }

  const settings = parseSettingsPartial(o.settings);

  const state: AppStateV2 = {
    version: 2,
    exercises,
    sessions,
    ...(templates ? { templates } : {}),
    ...(settings ? { settings } : {}),
  };
  return state;
}

/** Merge defaults, clamp settings, normalize — used for export files and successful imports. */
function snapshotAppState(state: AppStateV2): AppStateV2 {
  const merged = mergeUserSettings(state);
  const clamped = clampUserSettings(merged);
  return normalizeAppStateV2({
    ...state,
    settings: { ...merged, ...clamped },
  });
}

export function parseImportedAppState(raw: unknown): ImportResult {
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (o.format === EXPORT_FORMAT) {
      if (o.version !== EXPORT_ENVELOPE_VERSION) {
        return {
          ok: false,
          error: `Unsupported export file version (${String(o.version)}). Update the app or export again.`,
        };
      }
      if (typeof o.exportedAt !== "string" || o.exportedAt.length === 0) {
        return { ok: false, error: "Export file is missing exportedAt." };
      }
      const inner = validateAppStateV2Deep(o.state);
      if (!inner) {
        return { ok: false, error: "Export file contains invalid workout data." };
      }
      return { ok: true, state: snapshotAppState(inner) };
    }
  }

  const direct = validateAppStateV2Deep(raw);
  if (direct) {
    return { ok: true, state: snapshotAppState(direct) };
  }
  return {
    ok: false,
    error:
      "Unrecognized backup. Use a JSON file exported from this app, or a valid v2 state object.",
  };
}

export function buildExportEnvelope(state: AppStateV2): ExportEnvelopeV1 {
  if (state.version !== 2) throw new Error("Only v2 state can be exported");
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_ENVELOPE_VERSION,
    exportedAt: new Date().toISOString(),
    state: snapshotAppState(state),
  };
}

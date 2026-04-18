/**
 * One-off generator: writes fixtures/sample-two-month-training.json (importable backup).
 * Run: node scripts/generate-sample-two-month-backup.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const EXPORT_FORMAT = "workout-tracker-export";
const EXPORT_ENVELOPE_VERSION = 1;

/** Fixed UUIDs so the file is stable across regenerations */
const E = {
  squat: "a1000001-0000-4000-8000-000000000001",
  bench: "a1000001-0000-4000-8000-000000000002",
  row: "a1000001-0000-4000-8000-000000000003",
  ohp: "a1000001-0000-4000-8000-000000000004",
  deadlift: "a1000001-0000-4000-8000-000000000005",
  latPd: "a1000001-0000-4000-8000-000000000006",
  rdl: "a1000001-0000-4000-8000-000000000007",
};

const exercises = [
  {
    id: E.squat,
    name: "Back squat",
    equipment: "barbell",
    createdAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: E.bench,
    name: "Bench press",
    equipment: "barbell",
    createdAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: E.row,
    name: "Barbell row",
    equipment: "barbell",
    createdAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: E.ohp,
    name: "Overhead press",
    equipment: "barbell",
    createdAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: E.deadlift,
    name: "Deadlift",
    equipment: "barbell",
    createdAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: E.latPd,
    name: "Lat pulldown",
    equipment: "machine",
    createdAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: E.rdl,
    name: "Romanian deadlift",
    equipment: "barbell",
    createdAt: "2026-02-01T12:00:00.000Z",
  },
];

function set(id, w, r, rpe) {
  const o = { id, weight: w, reps: r };
  if (rpe !== undefined) o.rpe = rpe;
  return o;
}

function block(bid, exerciseId, exerciseName, sets) {
  return { id: bid, exerciseId, exerciseName, sets };
}

/** Mon/Wed/Fri for 9 weeks starting 2026-02-02 (Monday), stop before 2 full months end → ~24 sessions */
function trainingDates() {
  const out = [];
  const start = new Date("2026-02-02T12:00:00.000Z");
  for (let w = 0; w < 9; w++) {
    for (const dow of [0, 2, 4]) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + w * 7 + dow);
      if (d > new Date("2026-04-18T23:59:59.000Z")) return out;
      out.push(d.toISOString().slice(0, 10));
    }
  }
  return out;
}

const dates = trainingDates();

/** Linear-ish ramps per lift (start → end over session index) */
function ramp(start, end, i, n) {
  const t = n <= 1 ? 0 : i / (n - 1);
  const v = start + (end - start) * t;
  return Math.round(v * 4) / 4;
}

const sessions = [];
let sid = 1;
let bid = 1;
let setId = 1;

function nextSetId() {
  return `s${String(setId++).padStart(6, "0")}-0000-4000-8000-000000000000`;
}
function nextBlockId() {
  return `b${String(bid++).padStart(6, "0")}-0000-4000-8000-000000000000`;
}
function nextSessionId() {
  return `sess-${String(sid++).padStart(4, "0")}-0000-4000-8000-000000000000`;
}

const n = dates.length;

for (let i = 0; i < n; i++) {
  const date = dates[i];
  const createdAt = `${date}T18:30:00.000Z`;
  const isA = i % 2 === 0;
  const notes = isA
    ? i % 6 === 0
      ? "Felt strong — slept well."
      : ""
    : i % 5 === 0
      ? "Left shoulder a bit tight on OHP."
      : "";

  const wSq = ramp(185, 205, i, n);
  const wBn = ramp(135, 152.5, i, n);
  const wRow = ramp(115, 132.5, i, n);
  const wDl = ramp(225, 245, i, n);
  const wOhp = ramp(85, 95, i, n);
  const wLat = ramp(120, 137.5, i, n);
  const wRdl = ramp(155, 175, i, n);

  /** Occasional RPE on top sets */
  const rpe = i % 4 === 2 ? 8 : undefined;

  const blocks = [];

  if (isA) {
    blocks.push(
      block(nextBlockId(), E.squat, "Back squat", [
        set(nextSetId(), wSq, 5, rpe),
        set(nextSetId(), wSq, 5),
        set(nextSetId(), wSq, 5),
      ]),
      block(nextBlockId(), E.bench, "Bench press", [
        set(nextSetId(), wBn, 5),
        set(nextSetId(), wBn, 5),
        set(nextSetId(), wBn, 5),
      ]),
      block(nextBlockId(), E.row, "Barbell row", [
        set(nextSetId(), wRow, 5),
        set(nextSetId(), wRow, 5),
        set(nextSetId(), wRow, 5),
      ]),
    );
  } else {
    blocks.push(
      block(nextBlockId(), E.deadlift, "Deadlift", [
        set(nextSetId(), wDl, 5, rpe),
        set(nextSetId(), wDl, 5),
      ]),
      block(nextBlockId(), E.ohp, "Overhead press", [
        set(nextSetId(), wOhp, 5),
        set(nextSetId(), wOhp, 5),
        set(nextSetId(), wOhp, 5),
      ]),
      block(nextBlockId(), E.latPd, "Lat pulldown", [
        set(nextSetId(), wLat, 10),
        set(nextSetId(), wLat, 10),
        set(nextSetId(), wLat, 9),
      ]),
      block(nextBlockId(), E.rdl, "Romanian deadlift", [
        set(nextSetId(), wRdl, 8),
        set(nextSetId(), wRdl, 8),
        set(nextSetId(), wRdl, 8),
      ]),
    );
  }

  /** Every few sessions: simulate an off day (one lighter set or fewer reps on one lift) */
  if (i === 7 || i === 15) {
    const last = blocks[blocks.length - 1];
    if (last?.sets?.length) {
      last.sets[last.sets.length - 1] = {
        ...last.sets[last.sets.length - 1],
        reps: Math.max(1, last.sets[last.sets.length - 1].reps - 1),
      };
    }
  }

  sessions.push({
    id: nextSessionId(),
    date,
    createdAt,
    notes,
    blocks,
  });
}

const state = {
  version: 2,
  exercises,
  sessions,
  settings: {
    weightUnit: "lb",
    linearIncrement: 2.5,
    targetReps: 5,
  },
};

const envelope = {
  format: EXPORT_FORMAT,
  version: EXPORT_ENVELOPE_VERSION,
  exportedAt: "2026-04-18T12:00:00.000Z",
  state,
};

const fixturesDir = join(root, "fixtures");
mkdirSync(fixturesDir, { recursive: true });
const outPath = join(fixturesDir, "sample-two-month-training.json");
writeFileSync(outPath, JSON.stringify(envelope, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath} (${sessions.length} sessions)`);

import { useCallback, useMemo, useState, type ReactElement } from "react";
import { BUNDLED_PRESETS } from "./data/presets";
import { pickTopSet, suggestNextLinearLoad } from "./lib/progression/linear";
import { applyPresetToCatalog } from "./lib/presets/applyPreset";
import { blockForExercise, sessionsForExercise } from "./lib/sessions";
import { loadAppState, saveAppState } from "./storage/state";
import type { AppStateV2, Equipment, Exercise, SessionBlock, SetEntry } from "./types/domain";
import type { WorkoutPresetDefinition } from "./types/preset";
import "./App.css";

const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "machine", label: "Machine" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "other", label: "Other" },
];

const DEFAULT_INCREMENT = 5;
const DEFAULT_TARGET_REPS = 5;

type DraftSet = { weight: string; reps: string };

type DraftBlock = {
  exerciseId: string;
  sets: DraftSet[];
};

function emptyDraftBlock(): DraftBlock {
  return { exerciseId: "", sets: [{ weight: "", reps: "" }] };
}

function draftRowsFromMovement(m: { sets: number; reps: number }): DraftSet[] {
  return Array.from({ length: m.sets }, () => ({
    weight: "",
    reps: String(m.reps),
  }));
}

function parseDraftSets(rows: DraftSet[]): SetEntry[] {
  const out: SetEntry[] = [];
  for (const row of rows) {
    const w = Number(row.weight);
    const r = Number.parseInt(row.reps, 10);
    if (!Number.isFinite(w) || !Number.isFinite(r)) continue;
    if (r <= 0) continue;
    if (w < 0) continue;
    out.push({
      id: crypto.randomUUID(),
      weight: w,
      reps: r,
    });
  }
  return out;
}

export function App(): ReactElement {
  const [state, setState] = useState<AppStateV2>(() => loadAppState());

  const persist = useCallback((next: AppStateV2 | ((prev: AppStateV2) => AppStateV2)) => {
    setState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      saveAppState(resolved);
      return resolved;
    });
  }, []);

  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>("barbell");

  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logNotes, setLogNotes] = useState("");
  const [draftBlocks, setDraftBlocks] = useState<DraftBlock[]>([emptyDraftBlock()]);

  const [historyExerciseId, setHistoryExerciseId] = useState("");

  /** Shown after loading a preset until save or clear. */
  const [presetBanner, setPresetBanner] = useState<string | null>(null);

  const exercisesSorted = useMemo(
    () => [...state.exercises].sort((a, b) => a.name.localeCompare(b.name)),
    [state.exercises],
  );

  const loadPreset = (preset: WorkoutPresetDefinition) => {
    const { next, exerciseIds } = applyPresetToCatalog(state, preset);
    if (exerciseIds.length === 0 || exerciseIds.length !== preset.movements.length) return;
    persist(next);
    const blocks: DraftBlock[] = exerciseIds.map((id, i) => {
      const mov = preset.movements[i];
      if (!mov) return { exerciseId: id, sets: [{ weight: "", reps: "" }] };
      return { exerciseId: id, sets: draftRowsFromMovement(mov) };
    });
    setDraftBlocks(blocks);
    setLogNotes("");
    setPresetBanner(preset.name);
    const first = exerciseIds[0];
    if (first) setHistoryExerciseId((h) => h || first);
  };

  const clearPresetBanner = () => {
    setPresetBanner(null);
  };

  const addExercise = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newExerciseName.trim();
    if (!name) return;
    const ex: Exercise = {
      id: crypto.randomUUID(),
      name,
      equipment: newExerciseEquipment,
      createdAt: new Date().toISOString(),
    };
    persist((prev) => ({ ...prev, exercises: [...prev.exercises, ex] }));
    setNewExerciseName("");
    setDraftBlocks((blocks) => {
      const copy = [...blocks];
      const first = copy[0];
      if (first && !first.exerciseId) {
        copy[0] = { ...first, exerciseId: ex.id };
        return copy;
      }
      return blocks;
    });
    if (!historyExerciseId) setHistoryExerciseId(ex.id);
  };

  const logSession = (e: React.FormEvent) => {
    e.preventDefault();
    persist((prev) => {
      const blocks: SessionBlock[] = [];
      for (const db of draftBlocks) {
        if (!db.exerciseId) continue;
        const ex = prev.exercises.find((x) => x.id === db.exerciseId);
        if (!ex) continue;
        const sets = parseDraftSets(db.sets);
        if (sets.length === 0) continue;
        blocks.push({
          id: crypto.randomUUID(),
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets,
        });
      }
      if (blocks.length === 0) return prev;
      return {
        ...prev,
        sessions: [
          ...prev.sessions,
          {
            id: crypto.randomUUID(),
            date: logDate,
            createdAt: new Date().toISOString(),
            notes: logNotes.trim(),
            blocks,
          },
        ],
      };
    });
    setLogNotes("");
    setDraftBlocks([emptyDraftBlock()]);
    setPresetBanner(null);
  };

  const removeSession = (sessionId: string) => {
    persist((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  };

  const historySessions = useMemo(() => {
    if (!historyExerciseId) return [];
    return sessionsForExercise(state.sessions, historyExerciseId);
  }, [state.sessions, historyExerciseId]);

  const hintExerciseId = draftBlocks.find((b) => b.exerciseId)?.exerciseId ?? "";

  const linearHint = useMemo(() => {
    if (!hintExerciseId) return null;
    const hist = sessionsForExercise(state.sessions, hintExerciseId);
    const last = hist[0];
    if (!last) return null;
    const block = blockForExercise(last, hintExerciseId);
    if (!block || block.sets.length === 0) return null;
    const top = pickTopSet(block.sets);
    return suggestNextLinearLoad({
      lastTopSet: top,
      increment: DEFAULT_INCREMENT,
      targetReps: DEFAULT_TARGET_REPS,
    });
  }, [state.sessions, hintExerciseId]);

  const updateDraftSet = (
    blockIndex: number,
    setIndex: number,
    field: keyof DraftSet,
    value: string,
  ) => {
    setDraftBlocks((blocks) => {
      const next = blocks.map((b, bi) => {
        if (bi !== blockIndex) return b;
        const sets = b.sets.map((row, si) => (si === setIndex ? { ...row, [field]: value } : row));
        return { ...b, sets };
      });
      return next;
    });
  };

  const addSetRow = (blockIndex: number) => {
    setDraftBlocks((blocks) =>
      blocks.map((b, bi) =>
        bi === blockIndex ? { ...b, sets: [...b.sets, { weight: "", reps: "" }] } : b,
      ),
    );
  };

  const removeSetRow = (blockIndex: number, setIndex: number) => {
    setDraftBlocks((blocks) =>
      blocks.map((b, bi) => {
        if (bi !== blockIndex) return b;
        if (b.sets.length <= 1) return b;
        return { ...b, sets: b.sets.filter((_, si) => si !== setIndex) };
      }),
    );
  };

  const setBlockExercise = (blockIndex: number, exerciseId: string) => {
    setDraftBlocks((blocks) =>
      blocks.map((b, bi) => (bi === blockIndex ? { ...b, exerciseId } : b)),
    );
  };

  const addSessionBlock = () => {
    setDraftBlocks((blocks) => [...blocks, emptyDraftBlock()]);
  };

  const removeSessionBlock = (blockIndex: number) => {
    setDraftBlocks((blocks) =>
      blocks.length <= 1 ? blocks : blocks.filter((_, bi) => bi !== blockIndex),
    );
  };

  const canSaveSession = draftBlocks.some((db) => {
    if (!db.exerciseId) return false;
    return parseDraftSets(db.sets).length > 0;
  });

  return (
    <div className="layout">
      <header className="header">
        <h1 className="title">Workout Tracker</h1>
        <p className="subtitle">
          Presets, exercises, multi-lift sessions. Data stays on this device.
        </p>
      </header>

      <main className="main">
        <section className="card" aria-labelledby="presets-heading">
          <h2 id="presets-heading" className="card-title">
            Presets
          </h2>
          <p className="preset-intro">
            Load a template to add exercises and pre-fill all lifts for one session. Save once when
            done.
          </p>
          <ul className="preset-list">
            {BUNDLED_PRESETS.map((p) => (
              <li key={p.id} className="preset-card">
                <div className="preset-card-main">
                  <div className="preset-card-title">{p.name}</div>
                  <p className="preset-card-desc">{p.shortDescription}</p>
                  <p className="preset-card-meta">
                    {p.movements.length} exercises ·{" "}
                    {p.movements.map((m) => `${m.sets}×${m.reps}`).join(", ")}
                  </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => loadPreset(p)}>
                  Load preset
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="exercise-heading">
          <h2 id="exercise-heading" className="card-title">
            Exercises
          </h2>
          <form className="form" onSubmit={addExercise}>
            <div className="row-inline">
              <label className="field field-grow">
                <span className="label">Name</span>
                <input
                  className="input"
                  value={newExerciseName}
                  onChange={(ev) => setNewExerciseName(ev.target.value)}
                  placeholder="e.g. Bench press"
                  autoComplete="off"
                />
              </label>
              <label className="field">
                <span className="label">Equipment</span>
                <select
                  className="input"
                  value={newExerciseEquipment}
                  onChange={(ev) => setNewExerciseEquipment(ev.target.value as Equipment)}
                >
                  {EQUIPMENT.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={!newExerciseName.trim()}>
                Add exercise
              </button>
            </div>
          </form>
        </section>

        <section className="card" aria-labelledby="log-heading">
          <h2 id="log-heading" className="card-title">
            Log session
          </h2>
          {exercisesSorted.length === 0 ? (
            <p className="empty">Load a preset or add an exercise above.</p>
          ) : (
            <form className="form" onSubmit={logSession}>
              {presetBanner ? (
                <div className="preset-banner" role="status">
                  <span>
                    Preset loaded: <strong>{presetBanner}</strong> — fill weights and save once.
                  </span>
                  <button type="button" className="btn btn-ghost" onClick={clearPresetBanner}>
                    Dismiss
                  </button>
                </div>
              ) : null}
              <label className="field">
                <span className="label">Session date</span>
                <input
                  className="input"
                  type="date"
                  value={logDate}
                  onChange={(ev) => setLogDate(ev.target.value)}
                  required
                />
              </label>

              {draftBlocks.map((block, blockIndex) => (
                <div key={blockIndex} className="session-block">
                  <div className="session-block-head">
                    <h3 className="session-block-title">Exercise {blockIndex + 1}</h3>
                    {draftBlocks.length > 1 ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => removeSessionBlock(blockIndex)}
                      >
                        Remove exercise
                      </button>
                    ) : null}
                  </div>
                  <label className="field">
                    <span className="label">Exercise</span>
                    <select
                      className="input"
                      value={block.exerciseId}
                      onChange={(ev) => setBlockExercise(blockIndex, ev.target.value)}
                    >
                      <option value="">Select…</option>
                      {exercisesSorted.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset className="fieldset">
                    <legend className="label">Sets</legend>
                    {block.sets.map((row, i) => (
                      <div key={i} className="set-row">
                        <input
                          className="input input-narrow"
                          inputMode="decimal"
                          placeholder="Weight"
                          aria-label={`Exercise ${blockIndex + 1} set ${i + 1} weight`}
                          value={row.weight}
                          onChange={(ev) =>
                            updateDraftSet(blockIndex, i, "weight", ev.target.value)
                          }
                        />
                        <span className="set-sep">×</span>
                        <input
                          className="input input-narrow"
                          inputMode="numeric"
                          placeholder="Reps"
                          aria-label={`Exercise ${blockIndex + 1} set ${i + 1} reps`}
                          value={row.reps}
                          onChange={(ev) => updateDraftSet(blockIndex, i, "reps", ev.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeSetRow(blockIndex, i)}
                          disabled={block.sets.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => addSetRow(blockIndex)}
                    >
                      Add set
                    </button>
                  </fieldset>
                </div>
              ))}

              <button type="button" className="btn btn-secondary" onClick={addSessionBlock}>
                Add exercise to session
              </button>

              {linearHint ? (
                <p className="hint" role="status">
                  <strong>
                    Suggested (first exercise in list, linear {DEFAULT_INCREMENT} lb /{" "}
                    {DEFAULT_TARGET_REPS} reps):
                  </strong>{" "}
                  {linearHint.reason}
                </p>
              ) : null}
              <label className="field field-grow">
                <span className="label">Session notes (optional)</span>
                <textarea
                  className="input textarea"
                  value={logNotes}
                  onChange={(ev) => setLogNotes(ev.target.value)}
                  rows={2}
                />
              </label>
              <div className="actions">
                <button type="submit" className="btn btn-primary" disabled={!canSaveSession}>
                  Save session
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="card" aria-labelledby="history-heading">
          <h2 id="history-heading" className="card-title">
            History by exercise
          </h2>
          {exercisesSorted.length === 0 ? (
            <p className="empty">No exercises yet.</p>
          ) : (
            <>
              <label className="field">
                <span className="label">Exercise</span>
                <select
                  className="input"
                  value={historyExerciseId}
                  onChange={(ev) => setHistoryExerciseId(ev.target.value)}
                >
                  <option value="">Select…</option>
                  {exercisesSorted.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </label>
              {!historyExerciseId ? (
                <p className="empty muted">Choose an exercise to see past sessions.</p>
              ) : historySessions.length === 0 ? (
                <p className="empty">No sessions for this exercise yet.</p>
              ) : (
                <ul className="list">
                  {historySessions.map((s) => {
                    const block = blockForExercise(s, historyExerciseId);
                    const setsText =
                      block?.sets.map((x) => `${x.weight}×${x.reps}`).join(", ") ?? "—";
                    const multi =
                      s.blocks.length > 1 ? ` · ${s.blocks.length} exercises in session` : "";
                    return (
                      <li key={s.id} className="row">
                        <div className="row-main">
                          <div className="row-title">
                            {s.date}
                            {multi ? <span className="row-badge">{multi}</span> : null}
                          </div>
                          <div className="row-meta">{setsText}</div>
                          {s.notes ? <p className="row-notes">{s.notes}</p> : null}
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeSession(s.id)}
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

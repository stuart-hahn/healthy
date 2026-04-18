import { useCallback, useMemo, useState, type ReactElement } from "react";
import { pickTopSet, suggestNextLinearLoad } from "./lib/progression/linear";
import { blockForExercise, sessionsForExercise } from "./lib/sessions";
import { loadAppState, saveAppState } from "./storage/state";
import type { AppStateV2, Equipment, Exercise, SetEntry } from "./types/domain";
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

  const persist = useCallback((next: AppStateV2) => {
    setState(next);
    saveAppState(next);
  }, []);

  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>("barbell");

  const [logExerciseId, setLogExerciseId] = useState("");
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logNotes, setLogNotes] = useState("");
  const [draftSets, setDraftSets] = useState<DraftSet[]>([{ weight: "", reps: "" }]);

  const [historyExerciseId, setHistoryExerciseId] = useState("");

  const exercisesSorted = useMemo(
    () => [...state.exercises].sort((a, b) => a.name.localeCompare(b.name)),
    [state.exercises],
  );

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
    persist({ ...state, exercises: [...state.exercises, ex] });
    setNewExerciseName("");
    if (!logExerciseId) setLogExerciseId(ex.id);
    if (!historyExerciseId) setHistoryExerciseId(ex.id);
  };

  const logSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logExerciseId) return;
    const exercise = state.exercises.find((x) => x.id === logExerciseId);
    if (!exercise) return;
    const sets = parseDraftSets(draftSets);
    if (sets.length === 0) return;

    const block = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets,
    };

    persist({
      ...state,
      sessions: [
        ...state.sessions,
        {
          id: crypto.randomUUID(),
          date: logDate,
          createdAt: new Date().toISOString(),
          notes: logNotes.trim(),
          blocks: [block],
        },
      ],
    });
    setLogNotes("");
    setDraftSets([{ weight: "", reps: "" }]);
  };

  const removeSession = (sessionId: string) => {
    persist({
      ...state,
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    });
  };

  const historySessions = useMemo(() => {
    if (!historyExerciseId) return [];
    return sessionsForExercise(state.sessions, historyExerciseId);
  }, [state.sessions, historyExerciseId]);

  const linearHint = useMemo(() => {
    if (!logExerciseId) return null;
    const hist = sessionsForExercise(state.sessions, logExerciseId);
    const last = hist[0];
    if (!last) return null;
    const block = blockForExercise(last, logExerciseId);
    if (!block || block.sets.length === 0) return null;
    const top = pickTopSet(block.sets);
    return suggestNextLinearLoad({
      lastTopSet: top,
      increment: DEFAULT_INCREMENT,
      targetReps: DEFAULT_TARGET_REPS,
    });
  }, [state.sessions, logExerciseId]);

  const updateDraft = (index: number, field: keyof DraftSet, value: string) => {
    setDraftSets((rows) => {
      const next = [...rows];
      const row = next[index];
      if (!row) return rows;
      next[index] = { ...row, [field]: value };
      return next;
    });
  };

  const addSetRow = () => setDraftSets((rows) => [...rows, { weight: "", reps: "" }]);
  const removeSetRow = (index: number) => {
    setDraftSets((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));
  };

  return (
    <div className="layout">
      <header className="header">
        <h1 className="title">Workout Tracker</h1>
        <p className="subtitle">
          Foundation: exercises, sessions, sets. Data stays on this device.
        </p>
      </header>

      <main className="main">
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
            <p className="empty">Add an exercise above first.</p>
          ) : (
            <form className="form" onSubmit={logSession}>
              <label className="field">
                <span className="label">Exercise</span>
                <select
                  className="input"
                  value={logExerciseId}
                  onChange={(ev) => setLogExerciseId(ev.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {exercisesSorted.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Date</span>
                <input
                  className="input"
                  type="date"
                  value={logDate}
                  onChange={(ev) => setLogDate(ev.target.value)}
                  required
                />
              </label>
              <fieldset className="fieldset">
                <legend className="label">Sets</legend>
                {draftSets.map((row, i) => (
                  <div key={i} className="set-row">
                    <input
                      className="input input-narrow"
                      inputMode="decimal"
                      placeholder="Weight"
                      aria-label={`Set ${i + 1} weight`}
                      value={row.weight}
                      onChange={(ev) => updateDraft(i, "weight", ev.target.value)}
                    />
                    <span className="set-sep">×</span>
                    <input
                      className="input input-narrow"
                      inputMode="numeric"
                      placeholder="Reps"
                      aria-label={`Set ${i + 1} reps`}
                      value={row.reps}
                      onChange={(ev) => updateDraft(i, "reps", ev.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeSetRow(i)}
                      disabled={draftSets.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary" onClick={addSetRow}>
                  Add set
                </button>
              </fieldset>
              {linearHint ? (
                <p className="hint" role="status">
                  <strong>
                    Suggested (linear {DEFAULT_INCREMENT} lb / {DEFAULT_TARGET_REPS} reps):
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
                <button type="submit" className="btn btn-primary" disabled={!logExerciseId}>
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
                    return (
                      <li key={s.id} className="row">
                        <div className="row-main">
                          <div className="row-title">{s.date}</div>
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

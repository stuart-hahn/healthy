import { useCallback, useMemo, useState, type ReactElement } from "react";
import type { Workout } from "./types/workout";
import { loadWorkouts, saveWorkouts } from "./storage";
import "./App.css";

function sortByDateDesc(a: Workout, b: Workout): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

export function App(): ReactElement {
  const [workouts, setWorkouts] = useState<Workout[]>(() => loadWorkouts());
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const sorted = useMemo(() => [...workouts].sort(sortByDateDesc), [workouts]);

  const persist = useCallback((next: Workout[]) => {
    setWorkouts(next);
    saveWorkouts(next);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const w: Workout = {
      id: crypto.randomUUID(),
      name: trimmed,
      date,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    persist([...workouts, w]);
    setName("");
    setNotes("");
  };

  const remove = (id: string) => {
    persist(workouts.filter((w) => w.id !== id));
  };

  return (
    <div className="layout">
      <header className="header">
        <h1 className="title">Workout Tracker</h1>
        <p className="subtitle">Log sessions in the browser. Data stays on this device.</p>
      </header>

      <main className="main">
        <section className="card" aria-labelledby="log-heading">
          <h2 id="log-heading" className="card-title">
            Log workout
          </h2>
          <form className="form" onSubmit={onSubmit}>
            <label className="field">
              <span className="label">Name</span>
              <input
                className="input"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="e.g. Upper body, 5k run"
                required
                autoComplete="off"
              />
            </label>
            <label className="field">
              <span className="label">Date</span>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(ev) => setDate(ev.target.value)}
                required
              />
            </label>
            <label className="field field-grow">
              <span className="label">Notes (optional)</span>
              <textarea
                className="input textarea"
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                rows={3}
                placeholder="Sets, reps, how it felt…"
              />
            </label>
            <div className="actions">
              <button type="submit" className="btn btn-primary">
                Add workout
              </button>
            </div>
          </form>
        </section>

        <section className="card" aria-labelledby="history-heading">
          <h2 id="history-heading" className="card-title">
            History
          </h2>
          {sorted.length === 0 ? (
            <p className="empty">No workouts yet. Add one above.</p>
          ) : (
            <ul className="list">
              {sorted.map((w) => (
                <li key={w.id} className="row">
                  <div className="row-main">
                    <div className="row-title">{w.name}</div>
                    <div className="row-meta">{w.date}</div>
                    {w.notes ? <p className="row-notes">{w.notes}</p> : null}
                  </div>
                  <button type="button" className="btn btn-danger" onClick={() => remove(w.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

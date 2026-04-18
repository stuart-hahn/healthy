import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { BUNDLED_PRESETS } from "./data/presets";
import { linearHintUiForExercise, type LinearHintUi } from "./lib/progression/hintForExercise";
import { buildSessionSaveSummary, type SessionSaveComparison } from "./lib/sessionSaveSummary";
import { applyPresetToCatalog } from "./lib/presets/applyPreset";
import { clampUserSettings, mergeUserSettings } from "./lib/settings";
import {
  blockForExercise,
  mostRecentSession,
  sessionsForExercise,
  sortSessionsByNewestFirst,
} from "./lib/sessions";
import { buildTemplateFromDraft } from "./lib/templates/templateFromDraft";
import {
  buildLiftTrendRows,
  buildSparklinePolylinePoints,
  liftTrendVolumesChronological,
  LIFT_TREND_MAX_ROWS,
} from "./lib/liftTrends";
import { formatSecondsAsMmSs } from "./lib/restTimerFormat";
import { formatTopSetPrNote } from "./lib/topSetPr";
import { buildExportEnvelope, parseImportedAppState } from "./storage/importExport";
import { loadAppState, saveAppState } from "./storage/state";
import type {
  AppStateV2,
  Equipment,
  Exercise,
  SessionBlock,
  SetEntry,
  TrainingSession,
  UserSettings,
  WorkoutTemplate,
} from "./types/domain";
import type { WorkoutPresetDefinition } from "./types/preset";
import "./App.css";

const REST_SECONDS_DEFAULT_KEY = "workout-tracker:rest-seconds-default";
const REST_PRESET_SEC = [60, 90, 120, 180] as const;

function readRestSecondsDefault(): number {
  try {
    const raw = localStorage.getItem(REST_SECONDS_DEFAULT_KEY);
    if (!raw) return 90;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 10 || n > 600) return 90;
    return n;
  } catch {
    return 90;
  }
}

function clampRestPick(sec: number): number {
  if (!Number.isFinite(sec)) return 90;
  return Math.min(600, Math.max(10, Math.floor(sec)));
}

const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "machine", label: "Machine" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "other", label: "Other" },
];

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

function draftRowsFromRepsTargets(reps: number[]): DraftSet[] {
  return reps.map((r) => ({ weight: "", reps: String(r) }));
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

function buildSessionBlocksFromDraft(
  exercises: Exercise[],
  draftBlocks: DraftBlock[],
): SessionBlock[] {
  const blocks: SessionBlock[] = [];
  for (const db of draftBlocks) {
    if (!db.exerciseId) continue;
    const ex = exercises.find((x) => x.id === db.exerciseId);
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
  return blocks;
}

function sessionExerciseSummary(session: TrainingSession): string {
  if (session.blocks.length === 0) return "No exercises";
  const names = session.blocks.map((b) => b.exerciseName);
  const head = names.slice(0, 3).join(", ");
  const more = names.length > 3 ? ` +${names.length - 3}` : "";
  return head + more;
}

function volumeDeltaLabel(before: number, after: number, unit: UserSettings["weightUnit"]): string {
  const unitLabel = unit === "kg" ? "kg·reps" : "lb·reps";
  const d = after - before;
  if (before === 0) {
    return after === 0 ? "no change" : `total ${after} ${unitLabel}`;
  }
  const sign = d >= 0 ? "+" : "";
  const pct = (d / before) * 100;
  return `${sign}${d} ${unitLabel} (${sign}${pct.toFixed(1)}%)`;
}

function draftBlocksFromSession(session: TrainingSession, exercises: Exercise[]): DraftBlock[] {
  const out: DraftBlock[] = [];
  for (const block of session.blocks) {
    if (!exercises.some((e) => e.id === block.exerciseId)) continue;
    out.push({
      exerciseId: block.exerciseId,
      sets: block.sets.map((s) => ({
        weight: String(s.weight),
        reps: String(s.reps),
      })),
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

  /** Session browser: which training day row is expanded. */
  const [sessionBrowserExpandedId, setSessionBrowserExpandedId] = useState<string | null>(null);

  /** Shown after loading a preset until save or clear. */
  const [presetBanner, setPresetBanner] = useState<string | null>(null);

  /** After saving a session: vs last time for each lift (dismissible). */
  const [sessionSaveBanner, setSessionSaveBanner] = useState<{
    date: string;
    sessionId: string;
    comparisons: SessionSaveComparison[];
  } | null>(null);

  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const sessionHistorySectionRef = useRef<HTMLElement | null>(null);
  const historyByExerciseSectionRef = useRef<HTMLElement | null>(null);

  type RestPhase = "idle" | "running" | "paused" | "done";
  const [restPhase, setRestPhase] = useState<RestPhase>("idle");
  const [restPickSeconds, setRestPickSeconds] = useState(() => readRestSecondsDefault());
  const [restRemaining, setRestRemaining] = useState(() => readRestSecondsDefault());
  const [restTotal, setRestTotal] = useState(() => readRestSecondsDefault());

  useEffect(() => {
    if (restPhase !== "running") return;
    const id = window.setInterval(() => {
      setRestRemaining((r) => {
        if (r <= 0) return 0;
        if (r === 1) {
          setRestPhase("done");
          try {
            navigator.vibrate?.(200);
          } catch {
            /* ignore */
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [restPhase]);

  const persistRestDefault = useCallback((sec: number) => {
    const c = clampRestPick(sec);
    try {
      localStorage.setItem(REST_SECONDS_DEFAULT_KEY, String(c));
    } catch {
      /* ignore */
    }
    return c;
  }, []);

  const startRestTimer = useCallback(() => {
    const total = clampRestPick(restPickSeconds);
    setRestPickSeconds(total);
    persistRestDefault(total);
    setRestTotal(total);
    setRestRemaining(total);
    setRestPhase("running");
  }, [restPickSeconds, persistRestDefault]);

  const pauseRestTimer = useCallback(() => {
    setRestPhase("paused");
  }, []);

  const resumeRestTimer = useCallback(() => {
    if (restRemaining <= 0) return;
    setRestPhase("running");
  }, [restRemaining]);

  const resetRestTimer = useCallback(() => {
    setRestRemaining(restTotal);
  }, [restTotal]);

  const skipRestTimer = useCallback(() => {
    setRestPhase("idle");
    setRestRemaining(restPickSeconds);
  }, [restPickSeconds]);

  const dismissRestDone = useCallback(() => {
    setRestPhase("idle");
    setRestRemaining(restPickSeconds);
  }, [restPickSeconds]);

  const restBarPct = useMemo(() => {
    if (restPhase === "idle") return 0;
    if (restTotal <= 0) return 0;
    if (restPhase === "done") return 100;
    return Math.min(100, Math.max(0, ((restTotal - restRemaining) / restTotal) * 100));
  }, [restPhase, restTotal, restRemaining]);

  const exercisesSorted = useMemo(
    () => [...state.exercises].sort((a, b) => a.name.localeCompare(b.name)),
    [state.exercises],
  );

  const templatesSorted = useMemo(() => {
    const list = state.templates ?? [];
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.templates]);

  const settings = useMemo(() => mergeUserSettings(state), [state]);

  const patchSettings = (partial: Partial<UserSettings>) => {
    persist((prev) => ({
      ...prev,
      settings: { ...mergeUserSettings(prev), ...clampUserSettings(partial) },
    }));
  };

  const exportBackup = useCallback(() => {
    const env = buildExportEnvelope(state);
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(env, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workout-tracker-backup-${date}.json`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [state]);

  const onImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        if (typeof text !== "string") {
          window.alert("Could not read file.");
          return;
        }
        const raw: unknown = JSON.parse(text);
        const result = parseImportedAppState(raw);
        if (!result.ok) {
          window.alert(result.error);
          return;
        }
        const ok = window.confirm(
          "Replace all exercises and sessions on this device with this backup? This cannot be undone.",
        );
        if (!ok) return;
        persist(() => result.state);
        setDraftBlocks([emptyDraftBlock()]);
        setLogNotes("");
        setPresetBanner(null);
        setHistoryExerciseId(result.state.exercises[0]?.id ?? "");
      } catch {
        window.alert("File is not valid JSON.");
      }
    };
    reader.onerror = () => {
      window.alert("Could not read file.");
    };
    reader.readAsText(file);
  };

  const blockHints = useMemo(
    () =>
      draftBlocks.map((b) =>
        b.exerciseId ? linearHintUiForExercise(b.exerciseId, state.sessions, settings) : null,
      ),
    [draftBlocks, state.sessions, settings],
  );

  /** Next-session linear hints after save (history includes the session just logged). */
  const sessionSaveNextHints = useMemo(() => {
    if (!sessionSaveBanner) return new Map<string, LinearHintUi | null>();
    const m = new Map<string, LinearHintUi | null>();
    for (const c of sessionSaveBanner.comparisons) {
      m.set(c.exerciseId, linearHintUiForExercise(c.exerciseId, state.sessions, settings));
    }
    return m;
  }, [sessionSaveBanner, state.sessions, settings]);

  const scrollToSection = useCallback((el: HTMLElement | null) => {
    window.setTimeout(() => {
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, []);

  const showSavedSessionInHistory = useCallback(() => {
    if (!sessionSaveBanner) return;
    setSessionBrowserExpandedId(sessionSaveBanner.sessionId);
    scrollToSection(sessionHistorySectionRef.current);
  }, [sessionSaveBanner, scrollToSection]);

  const showLiftHistoryAndTrends = useCallback(
    (exerciseId: string) => {
      setHistoryExerciseId(exerciseId);
      scrollToSection(historyByExerciseSectionRef.current);
    },
    [scrollToSection],
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

  const loadTemplate = (template: WorkoutTemplate) => {
    const blocks = template.blocks
      .filter((b) => state.exercises.some((e) => e.id === b.exerciseId))
      .map((b) => ({ exerciseId: b.exerciseId, sets: draftRowsFromRepsTargets(b.reps) }));
    if (blocks.length === 0) {
      window.alert(
        "Could not load that template — none of its exercises are still in your catalog.",
      );
      return;
    }
    setDraftBlocks(blocks);
    setLogNotes("");
    setPresetBanner(`Template loaded: ${template.name}`);
    const first = blocks[0]?.exerciseId;
    if (first) setHistoryExerciseId((h) => h || first);
  };

  const removeTemplate = (templateId: string) => {
    persist((prev) => ({
      ...prev,
      templates: (prev.templates ?? []).filter((t) => t.id !== templateId),
    }));
  };

  const saveDraftAsTemplate = () => {
    const suggested = presetBanner?.replace(/^Template loaded:\s*/i, "").trim() || "My template";
    const name = window.prompt("Template name", suggested);
    if (name === null) return;
    const result = buildTemplateFromDraft({ name, exercises: state.exercises, draftBlocks });
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    persist((prev) => ({ ...prev, templates: [...(prev.templates ?? []), result.template] }));
    setPresetBanner(`Template saved: ${result.template.name}`);
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
    const blocks = buildSessionBlocksFromDraft(state.exercises, draftBlocks);
    if (blocks.length === 0) return;
    const comparisons = buildSessionSaveSummary(state.sessions, blocks);
    const newSession: TrainingSession = {
      id: crypto.randomUUID(),
      date: logDate,
      createdAt: new Date().toISOString(),
      notes: logNotes.trim(),
      blocks,
    };
    persist((prev) => ({ ...prev, sessions: [...prev.sessions, newSession] }));
    setSessionSaveBanner({ date: logDate, sessionId: newSession.id, comparisons });
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

  const liftTrendRows = useMemo(() => {
    if (!historyExerciseId) return [];
    return buildLiftTrendRows(state.sessions, historyExerciseId);
  }, [state.sessions, historyExerciseId]);

  const liftTrendVolumesChrono = useMemo(
    () => liftTrendVolumesChronological(liftTrendRows),
    [liftTrendRows],
  );

  const liftTrendSparklinePoints = useMemo(() => {
    if (liftTrendVolumesChrono.length < 2) return "";
    return buildSparklinePolylinePoints(liftTrendVolumesChrono, 120, 36);
  }, [liftTrendVolumesChrono]);

  const sessionsNewestFirst = useMemo(
    () => sortSessionsByNewestFirst(state.sessions),
    [state.sessions],
  );

  const lastLoggedSession = useMemo(() => mostRecentSession(state.sessions), [state.sessions]);

  const canRepeatLastSession = useMemo(() => {
    if (!lastLoggedSession?.blocks.length) return false;
    return lastLoggedSession.blocks.some((b) => state.exercises.some((e) => e.id === b.exerciseId));
  }, [lastLoggedSession, state.exercises]);

  const applySessionToLogForm = (
    session: TrainingSession,
    opts: { dateMode: "session" | "today" },
  ) => {
    if (!session.blocks.length) return;
    const next = draftBlocksFromSession(session, state.exercises);
    if (next.length === 0) {
      window.alert(
        "Could not load that session — none of its exercises are still in your catalog.",
      );
      return;
    }
    setDraftBlocks(next);
    setLogDate(opts.dateMode === "session" ? session.date : new Date().toISOString().slice(0, 10));
    setLogNotes("");
    setPresetBanner(
      opts.dateMode === "session"
        ? `Editing copy of ${session.date} (change date before save if needed)`
        : `Repeated from ${session.date}`,
    );
    const fid = next[0]?.exerciseId;
    if (fid) setHistoryExerciseId((h) => h || fid);
  };

  const repeatLastSession = () => {
    const last = mostRecentSession(state.sessions);
    if (!last?.blocks.length) return;
    applySessionToLogForm(last, { dateMode: "today" });
  };

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
        <p className="disclaimer-inline" role="note">
          <strong>Not medical advice.</strong> Consult a professional for injury or health concerns.
          Suggestions are algorithmic — adjust for how you feel.
        </p>
      </header>

      <main className="main">
        {sessionSaveBanner ? (
          <section
            className="card save-summary-card"
            aria-labelledby="save-summary-heading"
            role="status"
          >
            <div className="save-summary-head">
              <h2 id="save-summary-heading" className="card-title save-summary-title">
                Session saved · {sessionSaveBanner.date}
              </h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSessionSaveBanner(null)}
              >
                Dismiss
              </button>
            </div>
            <p className="preset-intro save-summary-intro">
              Compared to your last logged session for each lift (volume = weight × reps summed).
              “Best” uses the heaviest <strong>single-set weight</strong> in your history — not a
              competition standard. Next-session targets use the same linear rule as the log form.
            </p>
            <div className="save-summary-quick">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={showSavedSessionInHistory}
              >
                Open in session history
              </button>
            </div>
            <ul className="save-summary-list">
              {sessionSaveBanner.comparisons.map((c, idx) => {
                const nextHint = sessionSaveNextHints.get(c.exerciseId) ?? null;
                return (
                  <li key={`${c.exerciseId}-${idx}`}>
                    <div>
                      <strong>{c.exerciseName}</strong>
                      {!c.prior ? (
                        <span> — first log for this lift here; nothing to compare yet.</span>
                      ) : (
                        <span>
                          {" "}
                          vs {c.priorDate}: volume {c.prior.volume} → {c.current.volume} (
                          {volumeDeltaLabel(c.prior.volume, c.current.volume, settings.weightUnit)})
                          {" · "}
                          top set {c.prior.topWeight}×{c.prior.topReps} → {c.current.topWeight}×
                          {c.current.topReps}
                        </span>
                      )}
                    </div>
                    <p className="pr-note">
                      {formatTopSetPrNote(c.topSetPr, c.current.topWeight, settings.weightUnit)}
                    </p>
                    {nextHint ? (
                      <div className="hint hint-block save-summary-next">
                        <p className="save-summary-next-label">Next session (algorithmic)</p>
                        <p className="hint-primary" role="status">
                          <strong>Suggested · from your history (not medical advice):</strong>{" "}
                          {nextHint.primary}
                        </p>
                        <p className="hint-rule">{nextHint.rule}</p>
                      </div>
                    ) : null}
                    <div className="save-summary-item-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => showLiftHistoryAndTrends(c.exerciseId)}
                      >
                        Lift history & trends
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

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

        <section className="card" aria-labelledby="templates-heading">
          <div className="card-title-row">
            <h2 id="templates-heading" className="card-title">
              Templates
            </h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={saveDraftAsTemplate}
              disabled={exercisesSorted.length === 0}
            >
              Save current as template
            </button>
          </div>
          <p className="preset-intro">
            Templates are your own reusable workouts. Loading one fills exercises and set rep
            targets, leaving weights blank.
          </p>
          {templatesSorted.length === 0 ? (
            <p className="empty">
              No templates yet. Build a workout below, then “Save current as template”.
            </p>
          ) : (
            <ul className="preset-list">
              {templatesSorted.map((t) => (
                <li key={t.id} className="preset-card">
                  <div className="preset-card-main">
                    <div className="preset-card-title">{t.name}</div>
                    <p className="preset-card-meta">
                      {t.blocks.length} exercises ·{" "}
                      {t.blocks.map((b) => `${b.reps.length}×${b.reps[0] ?? "?"}`).join(", ")}
                    </p>
                  </div>
                  <div className="preset-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => loadTemplate(t)}
                    >
                      Load template
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeTemplate(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
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

        <section className="card" aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="card-title">
            Training settings
          </h2>
          <p className="preset-intro">
            Used for labels and linear load suggestions. Weights are stored as you enter them (no
            unit conversion).
          </p>
          <div className="form row-inline">
            <label className="field">
              <span className="label">Weight unit</span>
              <select
                className="input"
                value={settings.weightUnit}
                onChange={(ev) =>
                  patchSettings({ weightUnit: ev.target.value as UserSettings["weightUnit"] })
                }
              >
                <option value="lb">lb</option>
                <option value="kg">kg</option>
              </select>
            </label>
            <label className="field">
              <span className="label">Linear increment</span>
              <input
                className="input input-narrow"
                type="number"
                min={0.5}
                step={0.5}
                value={settings.linearIncrement}
                onChange={(ev) =>
                  patchSettings({ linearIncrement: Number.parseFloat(ev.target.value) })
                }
              />
            </label>
            <label className="field">
              <span className="label">Target reps (linear)</span>
              <input
                className="input input-narrow"
                type="number"
                min={1}
                max={100}
                step={1}
                value={settings.targetReps}
                onChange={(ev) =>
                  patchSettings({ targetReps: Number.parseInt(ev.target.value, 10) })
                }
              />
            </label>
          </div>
        </section>

        <section className="card" aria-labelledby="backup-heading">
          <h2 id="backup-heading" className="card-title">
            Data backup
          </h2>
          <p className="preset-intro">
            Download a JSON file to back up this device&apos;s data, or choose a file to replace
            everything stored here. Imports are validated; replacing data cannot be undone.
          </p>
          <div className="backup-actions">
            <button type="button" className="btn btn-secondary" onClick={exportBackup}>
              Export JSON
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => backupFileInputRef.current?.click()}
            >
              Import JSON…
            </button>
            <input
              ref={backupFileInputRef}
              type="file"
              accept="application/json,.json"
              className="file-input-hidden"
              aria-label="Choose backup JSON file"
              onChange={onImportBackupFile}
            />
          </div>
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
              <div className="repeat-last">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={!canRepeatLastSession}
                  onClick={repeatLastSession}
                >
                  Repeat last session
                </button>
                {lastLoggedSession ? (
                  <p className="repeat-last-help">
                    Fills exercises, sets, weights, and reps from{" "}
                    <strong>{lastLoggedSession.date}</strong> (today’s date selected — edit anything
                    before saving).
                  </p>
                ) : (
                  <p className="repeat-last-help muted">Log a session once to enable this.</p>
                )}
              </div>
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

              <div className="rest-timer">
                <h3 className="rest-timer-title">Rest timer</h3>
                <p className="preset-intro rest-timer-help">
                  Optional countdown between sets. Stays on this device. Dismiss anytime.
                </p>
                {restPhase === "done" ? (
                  <div className="rest-timer-done" role="status">
                    <span>Time&apos;s up.</span>
                    <button type="button" className="btn btn-secondary" onClick={dismissRestDone}>
                      Dismiss
                    </button>
                  </div>
                ) : null}
                <div
                  className="rest-timer-display"
                  role="timer"
                  aria-live="polite"
                  aria-label={
                    restPhase === "idle"
                      ? `Rest duration ${formatSecondsAsMmSs(restPickSeconds)}`
                      : `Rest remaining ${formatSecondsAsMmSs(restRemaining)}`
                  }
                >
                  {restPhase === "idle"
                    ? formatSecondsAsMmSs(restPickSeconds)
                    : formatSecondsAsMmSs(restRemaining)}
                </div>
                <div className="rest-timer-bar-track" aria-hidden>
                  <div className="rest-timer-bar-fill" style={{ width: `${restBarPct}%` }} />
                </div>
                <div className="rest-timer-presets">
                  {REST_PRESET_SEC.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`btn btn-secondary${restPickSeconds === sec ? " btn-active" : ""}`}
                      disabled={restPhase === "running"}
                      onClick={() => {
                        setRestPickSeconds(sec);
                        persistRestDefault(sec);
                      }}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <label className="field field-inline-rest">
                  <span className="label">Custom (sec)</span>
                  <input
                    className="input input-narrow"
                    type="number"
                    min={10}
                    max={600}
                    step={5}
                    disabled={restPhase === "running"}
                    value={restPickSeconds}
                    onChange={(ev) => {
                      const n = Number.parseInt(ev.target.value, 10);
                      const c = clampRestPick(Number.isFinite(n) ? n : 90);
                      setRestPickSeconds(c);
                      persistRestDefault(c);
                    }}
                  />
                </label>
                <div className="rest-timer-actions">
                  {restPhase === "idle" ? (
                    <button type="button" className="btn btn-primary" onClick={startRestTimer}>
                      Start
                    </button>
                  ) : null}
                  {restPhase === "running" ? (
                    <>
                      <button type="button" className="btn btn-secondary" onClick={pauseRestTimer}>
                        Pause
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={resetRestTimer}>
                        Reset
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={skipRestTimer}>
                        Skip
                      </button>
                    </>
                  ) : null}
                  {restPhase === "paused" ? (
                    <>
                      <button type="button" className="btn btn-primary" onClick={resumeRestTimer}>
                        Resume
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={resetRestTimer}>
                        Reset
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={skipRestTimer}>
                        Skip
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

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
                    <legend className="label">Sets · weight ({settings.weightUnit})</legend>
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
                  {blockHints[blockIndex] ? (
                    <div className="hint hint-block">
                      <p className="hint-primary" role="status">
                        <strong>Suggested · from your history (not medical advice):</strong>{" "}
                        {blockHints[blockIndex]?.primary}
                      </p>
                      <p className="hint-rule">{blockHints[blockIndex]?.rule}</p>
                    </div>
                  ) : null}
                </div>
              ))}

              <button type="button" className="btn btn-secondary" onClick={addSessionBlock}>
                Add exercise to session
              </button>
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

        <section
          ref={sessionHistorySectionRef}
          className="card"
          aria-labelledby="session-browser-heading"
        >
          <h2 id="session-browser-heading" className="card-title">
            Session history
          </h2>
          <p className="preset-intro">
            Newest first. Open a day to see every lift and set. Use in log form copies weights and
            reps into the logger (change the date if you are re-logging an old day).
          </p>
          {sessionsNewestFirst.length === 0 ? (
            <p className="empty">No logged sessions yet.</p>
          ) : (
            <ul className="list session-browser-list">
              {sessionsNewestFirst.map((s) => {
                const expanded = sessionBrowserExpandedId === s.id;
                const detailId = `session-detail-${s.id}`;
                return (
                  <li key={s.id} className="session-browser-item">
                    <div className="row session-browser-row">
                      <div className="row-main">
                        <div className="row-title">{s.date}</div>
                        <div className="row-meta">
                          {s.blocks.length} exercise{s.blocks.length === 1 ? "" : "s"} ·{" "}
                          {sessionExerciseSummary(s)}
                        </div>
                        {s.notes && !expanded ? <p className="row-notes">{s.notes}</p> : null}
                      </div>
                      <div className="session-browser-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          aria-expanded={expanded}
                          aria-controls={detailId}
                          onClick={() => setSessionBrowserExpandedId(expanded ? null : s.id)}
                        >
                          {expanded ? "Hide" : "Details"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => applySessionToLogForm(s, { dateMode: "session" })}
                        >
                          Use in log form
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => {
                            removeSession(s.id);
                            if (sessionBrowserExpandedId === s.id) {
                              setSessionBrowserExpandedId(null);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {expanded ? (
                      <div
                        id={detailId}
                        className="session-browser-detail"
                        role="region"
                        aria-label={`Details for ${s.date}`}
                      >
                        {s.notes ? <p className="session-browser-notes">{s.notes}</p> : null}
                        {s.blocks.map((b) => (
                          <div key={b.id} className="session-browser-block">
                            <h3 className="session-browser-block-title">{b.exerciseName}</h3>
                            <ul className="session-browser-sets">
                              {b.sets.map((row) => (
                                <li key={row.id}>
                                  {row.weight} {settings.weightUnit} × {row.reps}
                                  {row.rpe !== undefined ? ` @RPE ${row.rpe}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          ref={historyByExerciseSectionRef}
          className="card"
          aria-labelledby="history-heading"
        >
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
                <>
                  {liftTrendRows.length > 0 ? (
                    <div className="lift-trends">
                      <p className="preset-intro lift-trends-intro">
                        Last up to {LIFT_TREND_MAX_ROWS} logs · volume = Σ(weight × reps) for this
                        lift that day ({settings.weightUnit === "kg" ? "kg·reps" : "lb·reps"}). For
                        review only — not medical advice.
                      </p>
                      <div className="lift-trends-spark-wrap">
                        {liftTrendVolumesChrono.length >= 2 ? (
                          <svg className="lift-trends-sparkline" viewBox="0 0 120 36" aria-hidden>
                            <polyline
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={liftTrendSparklinePoints}
                            />
                          </svg>
                        ) : liftTrendVolumesChrono.length === 1 ? (
                          <svg className="lift-trends-sparkline" viewBox="0 0 120 36" aria-hidden>
                            <circle cx="60" cy="18" r="3" fill="currentColor" />
                          </svg>
                        ) : null}
                        <span className="lift-trends-spark-caption">Older ← → Newer</span>
                      </div>
                      <div className="table-wrap">
                        <table className="lift-trends-table">
                          <thead>
                            <tr>
                              <th scope="col">Date</th>
                              <th scope="col">Volume</th>
                              <th scope="col">Top set</th>
                              <th scope="col">Sets</th>
                            </tr>
                          </thead>
                          <tbody>
                            {liftTrendRows.map((r) => (
                              <tr key={r.sessionId}>
                                <td>{r.date}</td>
                                <td>
                                  {r.volume} {settings.weightUnit === "kg" ? "kg·reps" : "lb·reps"}
                                </td>
                                <td>
                                  {r.topWeight} {settings.weightUnit} × {r.topReps}
                                </td>
                                <td>{r.setCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
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
                </>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p className="disclaimer-footer">
          This app does not diagnose, treat, or prevent disease. Load and rep suggestions are rough
          estimates from your logged history — always prioritize form, pain-free range of motion,
          and your coach or clinician’s guidance.
        </p>
      </footer>
    </div>
  );
}

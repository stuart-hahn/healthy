export type Equipment = "barbell" | "dumbbell" | "machine" | "bodyweight" | "other";

/** User-defined exercise catalog entry. */
export type Exercise = {
  id: string;
  name: string;
  equipment: Equipment;
  createdAt: string;
};

/** One logged set. */
export type SetEntry = {
  id: string;
  weight: number;
  reps: number;
  /** Rate of perceived exertion 1–10; optional. */
  rpe?: number;
};

/** One exercise within a training session. */
export type SessionBlock = {
  id: string;
  exerciseId: string;
  /** Denormalized label for display and migrations. */
  exerciseName: string;
  sets: SetEntry[];
};

/** A training day log (one or more exercises). */
export type TrainingSession = {
  id: string;
  /** Calendar date YYYY-MM-DD. */
  date: string;
  createdAt: string;
  notes: string;
  blocks: SessionBlock[];
};

/** Training preferences (stored with app state). */
export type UserSettings = {
  /** Display / entry convention for load; stored numbers are not converted. */
  weightUnit: "lb" | "kg";
  /** Smallest jump for linear “add load” suggestions. */
  linearIncrement: number;
  /** Reps at or above this on the top set unlock a load bump in the simple linear rule. */
  targetReps: number;
};

export type AppStateV2 = {
  version: 2;
  exercises: Exercise[];
  sessions: TrainingSession[];
  /** Optional for older saves; merged with defaults on load. */
  settings?: Partial<UserSettings>;
};

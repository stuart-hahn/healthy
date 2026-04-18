import type { WorkoutPresetDefinition } from "../types/preset";

/** Bundled presets; versioned with the app. See docs/references/WORKOUT_PRESETS.md */
export const BUNDLED_PRESETS: WorkoutPresetDefinition[] = [
  {
    id: "full-body-strength-a",
    name: "Full body — strength A",
    shortDescription: "Three compounds, 3×5. Good 2–3×/week when time is tight.",
    movements: [
      { name: "Back squat", equipment: "barbell", sets: 3, reps: 5 },
      { name: "Bench press", equipment: "barbell", sets: 3, reps: 5 },
      { name: "Barbell row", equipment: "barbell", sets: 3, reps: 5 },
    ],
  },
  {
    id: "upper-hypertrophy-b",
    name: "Upper — hypertrophy B",
    shortDescription: "Shoulders, pull, arms; moderate reps. Pair with a lower day another day.",
    movements: [
      { name: "Overhead press", equipment: "barbell", sets: 3, reps: 8 },
      { name: "Lat pulldown", equipment: "machine", sets: 3, reps: 10 },
      { name: "Tricep pushdown", equipment: "machine", sets: 3, reps: 12 },
    ],
  },
];

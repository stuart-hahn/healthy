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
  {
    id: "push-strength-a",
    name: "Push — strength A",
    shortDescription: "Pressing + triceps. Pair with pull or legs on another day.",
    movements: [
      { name: "Bench press", equipment: "barbell", sets: 3, reps: 5 },
      { name: "Overhead press", equipment: "barbell", sets: 3, reps: 5 },
      { name: "Tricep pushdown", equipment: "machine", sets: 3, reps: 10 },
    ],
  },
  {
    id: "pull-strength-a",
    name: "Pull — strength A",
    shortDescription: "Hinge + rows + vertical pull. Middle day in a simple split.",
    movements: [
      { name: "Deadlift", equipment: "barbell", sets: 1, reps: 5 },
      { name: "Barbell row", equipment: "barbell", sets: 3, reps: 5 },
      { name: "Lat pulldown", equipment: "machine", sets: 3, reps: 8 },
    ],
  },
  {
    id: "legs-strength-a",
    name: "Legs — strength A",
    shortDescription: "Squat + hinge + machine volume. Single lower day.",
    movements: [
      { name: "Back squat", equipment: "barbell", sets: 3, reps: 5 },
      { name: "Romanian deadlift", equipment: "barbell", sets: 3, reps: 8 },
      { name: "Leg press", equipment: "machine", sets: 3, reps: 10 },
    ],
  },
];

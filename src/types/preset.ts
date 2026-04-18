import type { Equipment } from "./domain";

/** One lift line inside a bundled preset. */
export type PresetMovement = {
  /** Display name; merged into catalog by normalized name. */
  name: string;
  equipment: Equipment;
  /** Working sets (same reps each set for MVP). */
  sets: number;
  reps: number;
};

/** Shipped-with-app template (not user-editable in v1). */
export type WorkoutPresetDefinition = {
  id: string;
  name: string;
  /** One line: audience / intent. */
  shortDescription: string;
  movements: PresetMovement[];
};

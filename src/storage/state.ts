import type { AppStateV2 } from "../types/domain";
import { STORAGE_KEY_V2 } from "./constants";
import { migrateV1ToV2, readLegacyRowsFromStorage } from "./migrateV1";

function isAppStateV2(x: unknown): x is AppStateV2 {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return o.version === 2 && Array.isArray(o.exercises) && Array.isArray(o.sessions);
}

function parseV2(raw: string | null): AppStateV2 | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isAppStateV2(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function emptyState(): AppStateV2 {
  return { version: 2, exercises: [], sessions: [] };
}

/**
 * Load app state: prefer v2; else migrate v1 → v2, persist v2, leave v1 in place for safety.
 */
export function loadAppState(
  storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
): AppStateV2 {
  const v2 = parseV2(storage.getItem(STORAGE_KEY_V2));
  if (v2) return v2;

  const legacy = readLegacyRowsFromStorage((k) => storage.getItem(k));
  if (legacy.length === 0) {
    const initial = emptyState();
    storage.setItem(STORAGE_KEY_V2, JSON.stringify(initial));
    return initial;
  }

  const migrated = migrateV1ToV2(legacy);
  storage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
  return migrated;
}

export function saveAppState(
  state: AppStateV2,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  if (state.version !== 2) throw new Error("Only v2 state can be saved");
  storage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
}

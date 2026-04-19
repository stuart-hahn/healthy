/** Days without export before we show a gentle “export again” note. */
export const BACKUP_STALE_AFTER_DAYS = 14;

export type BackupExportReminder =
  | { level: "none" }
  | {
      level: "never_exported";
      message: string;
    }
  | {
      level: "stale";
      message: string;
      daysSinceExport: number;
    };

/**
 * UI reminders for local JSON export (never exported vs last export old).
 * Does not treat invalid timestamps as “never” — caller should validate ISO elsewhere.
 */
export function backupExportReminder(
  lastExportAtIso: string | null,
  nowMs: number = Date.now(),
): BackupExportReminder {
  const trimmed = lastExportAtIso?.trim() ?? "";
  if (trimmed.length === 0) {
    return {
      level: "never_exported",
      message:
        "No JSON export recorded in this browser yet — export occasionally so you don't lose data if this profile is cleared.",
    };
  }
  const t = new Date(trimmed).getTime();
  if (Number.isNaN(t)) return { level: "none" };
  const days = (nowMs - t) / 86_400_000;
  if (days < BACKUP_STALE_AFTER_DAYS) return { level: "none" };
  const daysSinceExport = Math.max(0, Math.floor(days));
  return {
    level: "stale",
    daysSinceExport,
    message: `Your last export here was ${daysSinceExport} day${
      daysSinceExport === 1 ? "" : "s"
    } ago. If you've logged workouts since then, export again so your file stays current.`,
  };
}

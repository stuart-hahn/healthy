import { describe, expect, it } from "vitest";
import { BACKUP_STALE_AFTER_DAYS, backupExportReminder } from "./backupReminders";

describe("backupExportReminder", () => {
  it("never_exported when no timestamp", () => {
    const r = backupExportReminder(null);
    expect(r.level).toBe("never_exported");
    if (r.level === "never_exported") {
      expect(r.message.length).toBeGreaterThan(20);
    }
  });

  it("never_exported for empty string", () => {
    expect(backupExportReminder("   ").level).toBe("never_exported");
  });

  it("none when recent export", () => {
    const now = Date.parse("2026-04-19T12:00:00.000Z");
    const last = new Date(now - 3 * 86_400_000).toISOString();
    expect(backupExportReminder(last, now).level).toBe("none");
  });

  it("stale when export older than threshold", () => {
    const now = Date.parse("2026-04-19T12:00:00.000Z");
    const last = new Date(now - (BACKUP_STALE_AFTER_DAYS + 1) * 86_400_000).toISOString();
    const r = backupExportReminder(last, now);
    expect(r.level).toBe("stale");
    if (r.level === "stale") {
      expect(r.daysSinceExport).toBeGreaterThanOrEqual(BACKUP_STALE_AFTER_DAYS);
      expect(r.message).toMatch(/ago/);
    }
  });

  it("none for invalid ISO", () => {
    expect(backupExportReminder("not-a-date", Date.now()).level).toBe("none");
  });
});

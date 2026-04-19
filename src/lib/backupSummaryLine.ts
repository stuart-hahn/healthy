import {
  describeAppStateCounts,
  EXPORT_ENVELOPE_VERSION,
  EXPORT_FORMAT,
  formatExportTimestampForDisplay,
} from "../storage/importExport";
import type { AppStateV2 } from "../types/domain";

/** One-line summary for clipboard / support (counts, format, last browser export time). */
export function buildBackupDeviceSummaryLine(
  state: AppStateV2,
  lastExportAtIso: string | null,
): string {
  const counts = describeAppStateCounts(state);
  const trimmed = lastExportAtIso?.trim() ?? "";
  const exportBit =
    trimmed.length > 0 && !Number.isNaN(new Date(trimmed).getTime())
      ? `Last browser export: ${formatExportTimestampForDisplay(trimmed)}.`
      : "No export recorded in this browser yet.";
  return `${counts} · ${EXPORT_FORMAT} envelope v${EXPORT_ENVELOPE_VERSION}. ${exportBit}`;
}

import type { TaxPlannerState } from "./TaxPlannerContext";
import type { SnapshotCandidate } from "./planner-persistence-guard";

export type RecoveryExportBundle = {
  format: "taxplanner-recovery-bundle-v2";
  instruction: string;
  unsavedSnapshot: Partial<TaxPlannerState> | null;
  protectedCandidates: SnapshotCandidate[];
};
const parseSafe = (raw: string | null): Partial<TaxPlannerState> | null => {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value !== null && typeof value === "object" && !Array.isArray(value) ?
      value as Partial<TaxPlannerState> : null;
  } catch { return null; }
};
/** A pure browser-local export; a browser download click is NOT file-save proof. */
export function buildRecoveryBundle(
  unsavedRaw: string | null,
  candidates: SnapshotCandidate[]
): RecoveryExportBundle {
  const unsaved = parseSafe(unsavedRaw);
  return {
    format: "taxplanner-recovery-bundle-v2",
    instruction: "ข้อมูลสำรองสำหรับตรวจสอบด้วยตนเอง ห้ามเขียนทับข้อมูลปัจจุบันอัตโนมัติ",
    unsavedSnapshot: unsaved,
    protectedCandidates: candidates.map(({source,state}) => ({source,state})),
  };
}
export function serializeRecoveryBundle(bundle: RecoveryExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

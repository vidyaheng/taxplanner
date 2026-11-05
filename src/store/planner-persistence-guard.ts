import type { TaxPlannerState } from "./TaxPlannerContext";

/** Compatibility key deliberately unchanged; legacy JS may still write it. */
export const PLANNER_KEY = "thai-tax-planner-v0.1";
export const RESET_WITNESS_KEY = "thai-tax-planner-v0.1-reset-witness";
export const RECOVERY_EXPORT_KEY = "thai-tax-planner-conflict-recovery";
export const JOURNAL_HEAD_KEY = "thai-tax-planner-v0.1-safe-journal-head";
const JOURNAL_PREFIX = "thai-tax-planner-v0.1-safe-journal-";
const journalKey = (resetId: string | null) => `${JOURNAL_PREFIX}${resetId ?? "legacy"}`;
type Stored = Pick<Storage, "getItem" | "setItem">;
export type SnapshotSource = "primary" | "journal" | "reset-witness";
export type SnapshotCandidate = { source: SnapshotSource; state: Partial<TaxPlannerState> };
export type ProtectedPlannerRead = {
  state: Partial<TaxPlannerState> | null;
  source: SnapshotSource;
  conflict: boolean;
  candidates: SnapshotCandidate[];
  reason: string | null;
};
const idOf = (state: Partial<TaxPlannerState> | null): string | null =>
  typeof state?.resetId === "string" && state.resetId.length > 0 ? state.resetId : null;
const revisionOf = (state: Partial<TaxPlannerState> | null): number | null =>
  state?.persistRevision === undefined ? 0 :
    typeof state.persistRevision === "number" && Number.isSafeInteger(state.persistRevision) &&
    state.persistRevision >= 0 ? state.persistRevision : null;
const parse = (raw: string | null): Partial<TaxPlannerState> | null => {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const data = value as Partial<TaxPlannerState>;
    if (!Number.isSafeInteger(data.schemaVersion) || !Number.isSafeInteger(data.taxYear) ||
      !data.income || !data.family || !data.deductions || !data.planning ||
      revisionOf(data) === null) return null;
    return data;
  } catch { return null; }
};
const same = (a: Partial<TaxPlannerState>, b: Partial<TaxPlannerState>) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Deterministic authority:
 * - A valid reset witness is an absolute generation fence. A primary from a
 *   different generation can NEVER become active, regardless of its revision.
 * - Within the same generation, disagreement is unresolved, even when one
 *   revision is numerically newer: old JS may reuse revisions or omit metadata.
 * - Journal pointer disagreement/malformed metadata is unresolved, not guessed.
 * - All recovered valid candidates remain available for explicit export.
 * - No read writes to localStorage or auto-merges financial state.
 */
export function readPlannerProtected(storage: Pick<Storage, "getItem">): ProtectedPlannerRead {
  const rawPrimary = storage.getItem(PLANNER_KEY);
  const rawWitness = storage.getItem(RESET_WITNESS_KEY);
  const rawHead = storage.getItem(JOURNAL_HEAD_KEY);
  const primary = parse(rawPrimary);
  const witness = parse(rawWitness);
  const headValid = rawHead === null || rawHead === "legacy" ||
    (rawHead.length > 0 && rawHead.length <= 128 &&
      !rawHead.includes("/") && !rawHead.includes("\\") && !rawHead.includes(".."));
  const headId = rawHead === "legacy" ? null : rawHead;
  const generation = witness ? idOf(witness) : primary ? idOf(primary) : headId;
  const rawJournal = storage.getItem(journalKey(generation));
  const journal = parse(rawJournal);
  const candidates: SnapshotCandidate[] = [];
  if (primary) candidates.push({ source: "primary", state: primary });
  if (journal) candidates.push({ source: "journal", state: journal });
  if (witness) candidates.push({ source: "reset-witness", state: witness });
  const result = (state: Partial<TaxPlannerState> | null, source: SnapshotSource,
    reason: string | null): ProtectedPlannerRead =>
    ({ state, source, conflict: reason !== null, candidates, reason });

  if (rawWitness && !witness) return result(null, "reset-witness", "malformed-reset-witness");
  if (witness && (!primary || idOf(primary) !== idOf(witness))) {
    // Reset has precedence over all older-generation metadata, even an old
    // journal head. Never expose a pre-Reset primary as active.
    return result(witness, "reset-witness", "reset-generation-conflict");
  }
  if (!headValid || (rawHead !== null && headId !== generation)) {
    // A stale head created by an in-flight pre-Reset save cannot defeat a
    // matching clean witness + clean main document.
    if (witness && primary && idOf(primary) === idOf(witness) &&
        same(witness, primary))
      return result(witness, "reset-witness", "stale-journal-head-after-reset");
    return result(null, "journal", "malformed-or-mismatched-journal-head");
  }
  if (rawPrimary && !primary) return result(null, "primary", "invalid-primary");
  if (rawJournal && !journal) return result(null, "journal", "invalid-journal");
  if (journal && idOf(journal) !== generation)
    return result(null, "journal", "journal-generation-conflict");
  if (journal && primary && !same(journal, primary))
    return result(null, "primary", "snapshot-revision-or-content-conflict");
  if (rawHead !== null && !journal)
    return result(null, "journal", "journal-pointer-without-valid-snapshot");
  if (witness && primary && idOf(primary) !== idOf(witness))
    return result(witness, "reset-witness", "reset-generation-conflict");
  if (primary) return result(primary, "primary", null);
  if (witness) return result(witness, "reset-witness", "reset-primary-missing");
  if (journal) return result(null, "journal", "journal-without-primary");
  return result(null, "primary", null);
}

export function writePlannerJournal(storage: Stored, snapshot: TaxPlannerState): void {
  storage.setItem(journalKey(idOf(snapshot)), JSON.stringify(snapshot));
  storage.setItem(JOURNAL_HEAD_KEY, idOf(snapshot) ?? "legacy");
}
export function writePlannerResetWitness(storage: Pick<Storage, "setItem">, clean: TaxPlannerState): void {
  storage.setItem(RESET_WITNESS_KEY, JSON.stringify(clean));
}
export function matchesResetWitness(storage: Pick<Storage, "getItem">, state: TaxPlannerState): boolean {
  const raw = storage.getItem(RESET_WITNESS_KEY);
  if (raw === null) return true;
  const witness = parse(raw);
  return Boolean(witness && idOf(witness) === idOf(state));
}

/** Best-effort privacy cleanup, after synchronous reset witness/primary writes. */
export function clearPreviousPlannerJournal(
  storage: Partial<Pick<Storage, "removeItem" | "key" | "length">>,
  previousResetId: string | null
): void {
  if (!storage.removeItem) return;
  // The pointer is removed first so no subsequent protected read can resurrect
  // a legacy journal from the old generation during cleanup.
  storage.removeItem(JOURNAL_HEAD_KEY);
  if (storage.key && typeof storage.length === "number") {
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (key?.startsWith(JOURNAL_PREFIX)) storage.removeItem(key);
    }
  } else {
    storage.removeItem(journalKey(previousResetId));
    if (previousResetId !== null) storage.removeItem(journalKey(null));
  }
}

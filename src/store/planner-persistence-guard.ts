import type { TaxPlannerState } from "./TaxPlannerContext";

/**
 * A reset marker outside the legacy document key. New-version saves never write
 * this marker. Already-running old JS cannot be blocked from writing the old key,
 * but it also cannot erase this witness.
 */
export const PLANNER_KEY = "thai-tax-planner-v0.1";
export const RESET_WITNESS_KEY = "thai-tax-planner-v0.1-reset-witness";
export const RECOVERY_EXPORT_KEY = "thai-tax-planner-conflict-recovery";
const journalKey = (resetId: string | null) =>
  `thai-tax-planner-v0.1-safe-journal-${resetId ?? "legacy"}`;
type Stored = Pick<Storage, "getItem" | "setItem">;
const parse = (raw: string | null): Partial<TaxPlannerState> | null => raw ? JSON.parse(raw) as Partial<TaxPlannerState> : null;
const idOf = (data: Partial<TaxPlannerState> | null) => data?.resetId ?? null;

/** Never silently replace data in localStorage on read. Reports recovery source. */
export function readPlannerProtected(storage: Pick<Storage,"getItem">): {
  state: Partial<TaxPlannerState> | null;
  source: "primary" | "journal" | "reset-witness";
  conflict: boolean;
} {
  const primary = parse(storage.getItem(PLANNER_KEY));
  const reset = parse(storage.getItem(RESET_WITNESS_KEY));
  const generation = idOf(reset) ?? idOf(primary);
  const journal = parse(storage.getItem(journalKey(generation)));
  if (reset && idOf(primary) !== idOf(reset)) {
    const validJournal = journal && idOf(journal) === idOf(reset);
    return {state: validJournal ? journal : reset,
      source: validJournal ? "journal" : "reset-witness", conflict:true};
  }
  if (journal && JSON.stringify(journal) !== JSON.stringify(primary) &&
      idOf(journal) === generation) {
    return {state:journal,source:"journal",conflict:true};
  }
  return {state:primary,source:"primary",conflict:false};
}

/** Keeps the last new-version snapshot separately from the old app's single key. */
export function writePlannerJournal(storage:Stored,snapshot:TaxPlannerState):void {
  storage.setItem(journalKey(idOf(snapshot)),JSON.stringify(snapshot));
}

/** Called only for an explicit synchronous user Reset. Witness is written first. */
export function writePlannerResetWitness(
  storage: Pick<Storage,"setItem">, clean:TaxPlannerState
):void {
  storage.setItem(RESET_WITNESS_KEY,JSON.stringify(clean));
}

/** Read before *and* after any normal write; this is a detection fence, not a CAS. */
export function matchesResetWitness(storage:Pick<Storage,"getItem">,state:TaxPlannerState):boolean {
  const witness=parse(storage.getItem(RESET_WITNESS_KEY));
  return !witness || idOf(witness) === idOf(state);
}

/** Best-effort privacy cleanup after an explicit Reset; cannot control old JS. */
export function clearPreviousPlannerJournal(
  storage: Partial<Pick<Storage,"removeItem">>,
  previousResetId: string | null
):void {
  storage.removeItem?.(journalKey(previousResetId));
  // Legacy/default generation may have existed before a reset token was assigned.
  if (previousResetId !== null) storage.removeItem?.(journalKey(null));
}

/** Visual comparison only; never used to recalculate tax, credits or savings. */
export function plannedComparisonClass(current: number, planned: number): string {
  return current !== planned
    ? "font-bold text-teal-900"
    : "font-medium text-slate-700";
}

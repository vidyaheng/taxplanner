/** UI-only: compare the EXACT text already displayed to the user.
 * Keep currency and percentage rounding inside the existing page formatters.
 * Never recompute Tax Engine values, credits, refunds or planned savings.
 */
export function plannedComparisonClass(
  displayedCurrent: string,
  displayedPlanned: string
): string {
  return displayedCurrent !== displayedPlanned
    ? "font-bold text-blue-600"
    : "font-medium text-slate-700";
}

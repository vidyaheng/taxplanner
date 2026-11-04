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

/** Mark only a comparison ROW whose displayed values actually differ.
 * Use the same already-formatted strings as the amount text, not raw tax data.
 */
export function plannedComparisonRowClass(
  displayedCurrent: string,
  displayedPlanned: string
): string {
  return displayedCurrent !== displayedPlanned ? "bg-blue-100/70" : "";
}

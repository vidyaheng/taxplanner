# UX-B3 — Director Layout Correction (Draft PR #12)

**Decision:** Keep exactly three primary values per category, but arrange them as **Action above Information**. This is a **layout-only** revision in existing Draft PR #12: no new PR, merge, or production deployment.

**Original authorized base:** merged PR #11, `main` `9456ba3e01f72fe1d8c0ef352136ccce4be46e9f`. Production `dpl_EkuRy7KtHi2bh5stFCeWqguFVFQ6` and official `taxplannervid.vercel.app` alias confirmed READY and SHA-matched at project start. Reviewed UX-B3 HEAD `2b3d8235c58d635bfe7a496afd1b39e61a459985`.

## UI implementation

Each of the five existing Planner categories displays only:

1. **สิทธิที่ใช้ได้** — `calculatePlanningCapacity(currentDeductions, calculateTax)[key]`, a *single-field, conditional* incremental eligible amount considering current paid deductions and relevant limits. Display **0** if fully exhausted.
2. **วางแผนซื้อ/ลงทุน** — **the existing editable input itself**; no duplicate output tile, no new persisted key, same `setPlanning` and number parser.
3. **เหลือ / เกิน** — use the shared `getCapacityDisplay` view helper:
   - `เกิน`: **`calculatePlanningUsageDetails(...)[key].excess`** when positive, rather than blindly subtracting the standalone first figure. This is the scenario's actual non-deductible portion of the planned payment.
   - `เหลือ`: **`calculatePlanningCapacity(plannedDeductions, calculateTax)[key]`** when no scenario excess, incorporating the *full* multi-field plan rather than a simplistic subtraction.
   - The value is a status, not an extra statutory cap. Amber for `เกินสิทธิ`; muted teal for `เหลือหลังวางแผน`. **Information** is displayed in two columns below the Action row, including on mobile.

### Two-level visual hierarchy and accessible input

- **Level 1 — ACTION:** category name + description on the left, **existing editable input** on the right at screen widths at/above the `sm` breakpoint. The width-constrained `minmax(200px,240px)` input column protects its usability. Below `sm` (including 375/390px), the category stacks above the input.
- **Category-specific input labels:** insurance/pension shows `วางแผนซื้อเพิ่ม (บาท)`; RMF/Thai ESG show `วางแผนลงทุนเพิ่ม (บาท)`. Labels associate via `htmlFor`/`id`, and each input has a category-specific accessible `aria-label`. The same `value`, `parseNumber`, `onChange`, `setPlanning`, numeric input mode, keyboard focus styles and saved state remain.
- **Level 2 — INFORMATION:** a compact two-column, read-only area always below Action with only `สิทธิที่ใช้ได้` and `เหลือหลังวางแผน / เกินสิทธิ`. Values are `min-w-0`, flex-wrapping and word-break safe for narrow viewports. The balance uses `aria-live="polite"`, `aria-atomic="true"` and retains the warning reason control.
- **Below Level 2:** pension's `ที่มาของสิทธิ` disclosure remains collapsed; net-deduction displacement warnings only appear when relevant. No extra numeric tiles, cards or new calculations.

The existing `src/lib/ui/deduction-capacity.ts` adapter still exposes legacy calculation metadata internally for testability, but only the **three** required metrics are shown in primary UI. No separate per-category 8-figure grid, extra statutory ceiling paragraphs, current paid/allowed tiles or duplicate total figures.

## Collapsed pension disclosure

Only pension has a native `<details>` disclosure, **closed by default** and labeled **ที่มาของสิทธิ**. It explains:
- Ordinary life/health shared allowance remaining, obtained from existing `retirementDeductions.pensionLifeRoomAvailable - pensionUsedAsLifeInsurance`.
- Additional pension capacity, derived from scenario-engine standalone pension capacity net of the ordinary portion.
- Existing shared retirement remaining from `retirementDeductions.sharedLimitRemaining` and the limitation on adding RMF and pension capacity.

No new pension allocation formula, no duplication of the three primary values. At salary 50,000/month and no previous deductions: **190,000** available = ordinary life **100,000** + pension extra **90,000**; plan pension **100,000** -> **เหลือ 90,000**. With existing ordinary life premium 40,000: pension available **150,000**, and plan 100,000 -> **เหลือ 50,000**.

## Shared-limit integrity and warnings

- `calculatePlanningCapacity` measures a **standalone** field's incremental room, **not** a promise that all category capacities can be added. One concise note after the five Planner entries says so.
- When two planned categories compete for the shared retirement ceiling, **scenario excess overrides simple standalone subtraction**. Example: existing ordinary life 100,000 and GPF 400,000, new pension 90,000 and RMF 100,000; RMF standalone room is 100,000 but only 10,000 is eligible after the earlier pension allocation, hence **เกิน 90,000**.
- The existing `PlanningUsageResult.netDeductionChange` warning and `sideEffects` warning remain visible *only when relevant*, not extra financial metric tiles. Example: GPF 450,000, plan pension 190,000: pension's individual allowance increases 190,000, GPF's allowance falls 40,000, **net eligible increase only 150,000**.
- The existing reasons button remains available beside `เกิน` when reason details exist.
- No Tax Engine, Tax Rules, scenario allocation order, persisted state, finance handlers, context, localStorage, reset/resume, authentication, Vercel/Supabase configuration or dependencies are modified.

## Results protected

The pre-existing Results short eligibility explanation is retained without modifications in this revision. PR #11 styling remains: changed rows `bg-blue-100/70`, changed planned value `font-bold text-blue-600`, neutral unchanged values/rows, compare at formatted display precision. Credit handling, payable and refund remain untouched.

## Regression and release verification

`src/components/planning/ux-b3.test.ts` retains all 11 pre-existing UX-B3 integration tests and adds 10 simplification tests and **3 layout/accessibility regression tests**:
- Source proof of exactly three primary metrics, single unchanged input, two stacked UI levels, desktop category/input alignment, mobile stacking, two information fields, category-specific labels, preserved keyboard focus, live status update semantics, narrow-screen wrap safeguards and default-collapsed pension disclosure.
- Salary 600,000, pension 190,000 available, 100,000 planned, 90,000 remaining.
- Existing life premium 40,000 reducing pension room.
- Pension/RMF/Thai ESG exceeding limits; zero available under saturated retirement ceiling.
- Shared-cap interactions where planned payment is at or below standalone capacity but scenario nevertheless reports over-limit.
- Net deduction displacement warning; PR #11 Results style and withholding credits unchanged.

**QA gates:** Full Vitest, ESLint, TypeScript, Next.js production build; exact-HEAD GitHub Actions SUCCESS; Preview READY with matching Git SHA; GitHub Mergeable TRUE; Draft, unmerged, auto-merge disabled; main/production unchanged.

**Desktop 1440px / mobile 375px, 390px / keyboard physical Browser QA:** **NOT EXECUTED**, unless genuine screenshots or browser evidence are produced and explicitly reported.

**STOP FOR DIRECTOR REVIEW. DO NOT MERGE, ENABLE AUTO-MERGE OR DEPLOY PRODUCTION.**

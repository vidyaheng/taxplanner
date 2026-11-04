# TaxPlanner UX-B3 — Planner & Results Deduction Capacity

## Director scope and starting gate

- Baseline: `main` `9456ba3e01f72fe1d8c0ef352136ccce4be46e9f`, including merged PR #7–#11.
- Production metadata VERIFIED: `dpl_EkuRy7KtHi2bh5stFCeWqguFVFQ6` READY, target production, `taxplannervid.vercel.app` alias matches, GitHub source SHA matches, 64 Vercel build events reviewed and no error events found.
- Production **Browser Smoke NOT EXECUTED** in this development environment. Production is not modified.
- Create **one Draft PR** from this main. No auto-merge and no Phase UX-C2/TAX-C3.

## Authorities and non-goals

Existing authoritative calculation paths:

- `src/lib/tax/engine.ts` — current and planned `calculateTax` output.
- `src/lib/tax/deductions.ts` — insurance, retirement, and Thai ESG deductibility/ceilings.
- `src/lib/tax/scenarios.ts` — unchanged `applyPlanningToDeductions`, `calculatePlanningCapacity` (one-field scenario probes) and `calculatePlanningUsageDetails` (sequential additions, side effects and net deduction deltas).
- `src/tax-rules/2569/index.ts` — statutory source consumed by the engine. UX-B3 never duplicates its formulas.

**No Tax Engine or Tax Rules changes**; no altered allocation priority or financial state/persistence. All financial inputs and credit/refund computations remain unchanged.

## Planner capacity display

Every one of the five supported Planner categories shows eight compact, right-readable metrics in a responsive two-column mobile / three-to-four-column wider layout:

1. **Conditional ceiling** = existing engine-allowed deduction plus incremental single-category capacity returned by the scenario module. The number is **not** a new statutory limit.
2. **Already paid/invested** = `TaxResult` field's `paid`.
3. **Already allowed** = `TaxResult` field's `allowed`.
4. **Remaining before planning** = `calculatePlanningCapacity(current)[key]`.
5. **Additional payment/investment** = existing `planning[key]` input.
6. **Additional allowed for this category** = `calculatePlanningUsageDetails(...)[key].allowedAdditional`.
7. **Allowed after the FULL plan** = `calculateTax(applyPlanningToDeductions(...))` field's `allowed`.
8. **Remaining after the FULL plan** = `calculatePlanningCapacity(plannedDeductions)[key]`.

The independent view adapter `src/lib/ui/deduction-capacity.ts` does **not** calculate any independent entitlement/limit: it only arranges the engine and scenario numbers. Zero-planning inputs reuse the already calculated current capacity.

**Important:** Single-field capacity numbers are conditional and **NOT additive across fields**. The scenario implementation allocates in this order: life -> health -> pension extra -> RMF -> Thai ESG, and the engine allocates pension extra ahead of other retirement fund candidates. An increase in allowed pension can **displace another allowed retirement deduction**. UX-B3 displays the scenario-reported `netDeductionChange` warning when different from the field's `allowedAdditional`; the Planner's existing side-effect warning remains intact. No net increase in tax deduction is claimed merely because one field is reallocated.

## Pension 190,000 explanation

For salary 50,000 THB/month (gross 600,000/year), when no insurance/fund rights are used:

- Ordinary life-insurance shared pool available for pension: **100,000 THB**, from `TaxResult.retirementDeductions.pensionLifeRoomAvailable` minus `pensionUsedAsLifeInsurance`.
- Additional pension capacity via the existing 2569 15%-of-income and retirement-shared logic: **90,000 THB**, measured as scenario-engine `pensionInsurance` capacity net of the ordinary-pool portion.
- Total individual pension capacity: **190,000 THB** from `calculatePlanningCapacity`; this total is conditional on other existing and planned deductions.
- With already-paid ordinary life insurance 40,000 THB, ordinary pension room falls to **60,000 THB**, and pension total to **150,000 THB** when no other constraints are binding.
- The view also shows remaining ordinary and additional pension components *after* the full plan. The additional pension component consumes the **retirement shared** pool; ordinary capacity is shared with qualifying life/health insurance.

**Priority caveat:** A saturated retirement shared ceiling can make `netDeductionChange = 0` while a pension field's own `allowed` increases, by displacing GPF/RMF. The UI must show this scenario warning. Do not reallocate or change these rules in UX-B3.

## RMF vs Thai ESG at annual income 600,000

- The engine `retirementDeductions.limits.rmfIncomeLimit` is **180,000 THB** (30%); individual `rmfMax` is 500,000 THB and RMF also consumes the **500,000 THB retirement-shared ceiling** with other eligible retirement deductions.
- The engine `generalDeductions.limits.thaiEsgIncomeLimit` is **180,000 THB** (30%); `thaiEsgMax` is **300,000 THB** and follows a **separate Thai ESG** framework rather than the retirement-shared ceiling.
- Neither percentage cap is a guaranteed incremental allowance: display the actual engine-derived `calculatePlanningCapacity` remaining amount when existing deductions have already consumed limits.
- Existing retirement contributions can limit or displace benefits of future retirement purchases; parallel headline capacities must not be automatically added.

## Results detail addition (non-calculating)

One small disclosure inside the existing expanded deductions area says displayed figures are **eligible deductions**, not amounts spent/invested, and links back to the Planner's detailed capacities. PR #11's `bg-blue-100/70`, `font-bold text-blue-600`, neutral unchanged rows and displayed-precision comparison are not modified.

## Test fixtures and release gate

New focused regression tests cover:

- Salary 50k/year 600k => pension 100k ordinary + 90k extra = 190k.
- Life insurance 40k => pension ordinary room 60k; combined total 150k.
- RMF and Thai ESG 180k separate income-based limits.
- Existing GPF 450k and pension planning: shared-room displacement, net effect and side-effect warning.
- Life 100k + retirement shared cap exhausted => pension reallocation without a net deduction increase.
- GPF 480k => RMF limited by remaining retirement-shared 20k.
- RMF planned 200k and Thai ESG planned 210k => 180k allowed by income-based limits.
- Full-plan values exactly equal `calculateTax`/scenario source outputs.
- PR #11 result comparison styling source and semantics unchanged.

Run full Vitest, ESLint, TypeScript and Next.js production build on one **exact HEAD**. Check GitHub Actions result, matching READY Vercel Preview SHA, GitHub Mergeable TRUE, and full file scope against main.

**Physical Browser, keyboard, Desktop 1440 and Mobile 375/390 screenshots:** NOT EXECUTED unless actually tested. Vercel READY or code tests alone are not viewport proof.

**STOP for Director Review. Do not merge, deploy Production or enable auto-merge.**

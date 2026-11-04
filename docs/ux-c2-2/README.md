# UX-C2.2 — Deductions UX Presentation Refinement

## Director-approved boundary
Starting main / approved Production SHA: `d2e6f4bfaa2889bba5853a44f51bbb6e1dd65606` (PR #13 merged). Production deployment `dpl_4CGLSqHri3LYh1SQBDn1vBV29K1c`, READY, verified official alias `taxplannervid.vercel.app`.

Scope: **Action First — Information Second**. Existing Deductions inputs, value/format/parse/setDeductions handlers, tax calculations, rules, localStorage, Context, financial schema, Reset/Resume and auth are immutable. Do not modify the Planner/Family/Income/Results or deploy Production. One Draft PR, STOP for Director browser QA.

## Implementation
- The pre-existing `DeductionInput` already aligns category and input on desktop; refine widths, visible input hint, responsive min-width and numeric presentation. Mobile stacks category/description, original numeric input and information beneath.
- Map established `taxResult.insuranceDeductions`, `retirementDeductions`, `generalDeductions` items directly to one optional `DeductionEligibilitySummary`. The presenter displays **ใช้ลดหย่อนได้** and, only when positive, **เกินสิทธิ**. It never calculates statutory caps or "เหลือสิทธิ" and adds no duplicate summary panel.
- The original seven separately laid-out groups of generic panels for insurance, pension/retirement, general and Thai ESG are removed, replaced in-place, never duplicated. The pension split from the original Engine (ordinary insurance allowance vs pension extra) survives in a collapsed explanatory disclosure.
- The specialized Social Security output remains separate and uses its existing Engine `allowed/excess`; **not** a section 33 estimator. Thai ESGX annual schedule/modal, pregnancy and parent-health record controls, donation group including special donation after-multiplier and Donation Planning Preview, all remain specialized and unchanged in their calculation.
- Existing Engine-generated warnings and relevant donation-planning warnings remain in their preexisting prominent placements. Zero excess does not create an unnecessary amber warning.
- Existing page sections, accordion semantics, Reset/Resume, Tab stale-write behavior, Family PR #13 and Planner/Results PR #11/#12 are preserved.

## Known constraints
- `allowed` and `excess` are based on the already-entered deduction data and Engine eligibility assumptions, NOT proof of external documents or a guaranteed independent capacity to purchase more.
- Ordinary life/personal health and pension share allowance constraints; pension extra and RMF/PVD/GPF/NSF/private teacher share retirement limits. The UI deliberately omits numeric remaining capacity to avoid double-counting.
- Engine's parent health policies continue referencing `parentId`, legacy aggregate remains intact; changing to independent policies requires TAX-C3.
- Donation rules and allocation order, social security three-mode selector and taxpayer defaults remain deferred.

## Regression and release gate
13 focused UX-C2.2 tests plus existing financial, reset, family, B2/B3, parent-health and donation test suites, full Vitest, ESLint, TypeScript and production build. Source tests check single summary location, input labels/handler, desktop/mobile breakpoints, accessibility, warnings and specialist records. Financial tests check insurance shared limit, pension/RMF, Thai ESG income cap, donation paid vs allowed, social security and parent health invariants.

Review target: Desktop 1440, mobile 375/390, keyboard navigation, disclosure toggle, input numeric alignment, no horizontal overflow. **Physical Browser/Screenshots: NOT EXECUTED** unless actual proof is attached; automated CSS/source tests are not a substitute.

**STOP — Draft PR, unmerged, auto-merge off, no Production deployment, no TAX-C3.**

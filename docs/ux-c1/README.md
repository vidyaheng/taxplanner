# TaxPlanner — UX-C1 Income & Results Refinement

## Director change control

- Existing design authority: Fresh Teal + Soft Indigo (B1/B2); merged PR #7/#8/#9/#10.
- Source baseline: `main` commit `2890aad63b92a5973215589d959553d013489b37`.
- Verified production: `dpl_HKRd5PZMpBCUf4T99urrhtq7F3ph` READY, official alias `taxplannervid.vercel.app`, source SHA matches baseline, no build error event among 64 examined. Physical browser smoke for this deployment **not performed in agent**. Director's earlier PR #9 Preview UAT 6/6 is prior acceptance, not re-run here.
- This **limited Draft PR** implements ONLY UX-C1. No merge, auto-merge or manual Production deployment, and no Phase B3.

## Implementation matrix — audit before implementation

| Stage | Existing code / gap | Authorized scope | Gate |
|---|---|---|---|
| **UX-C1 (current)** | Results planned values are blue/bold even when unchanged; 40(2) legacy commission value and actual withholding appear on separate rows; 40(3) annuity explanation lacks concrete examples; 40(6) has 3 expense-group keys for 6 professions; 40(8) RD external links open same tab; pension planning text says `จ่ายเพิ่ม`. | Refine display, labels, responsive field pairing, links and regression tests only. Retain all input IDs, stored commission and withholding keys, numeric calculations, category/expense selectors. | Fresh CI/Preview plus Director physical UAT before merge |
| **UX-B3 (next separate PR)** | Planner computes current/planned results and pension headroom; breakdown of ordinary life-insurance capacity versus pension-specific deduction and retirement shared caps is not explicit enough. | Surface **existing engine/scenario data**, never recreate cap formulas. Director's example THB 190k may comprise THB 100k + THB 90k; verify actual existing insurance and shared retirement ceilings. RMF/Thai ESG may each show THB 180k but belong to different cap groups. | Dedicated source/fixture audit and separate Draft PR |
| **UX-C2 (future separate PR)** | Family parent owner/relation inputs and persisted state already exist; default/completeness gates require audit. Deductions currently shows selected caps but not verified per-group remaining capacities. | Clearly editable assumptions for unconfirmed Family data; suggest next unused parent owner/relation (four combinations) without overwriting existing records; show Rule/Engine-derived headroom with explicit shared-cap competition. | State/eligibility review, migration/resume regression and separate Draft PR |
| **TAX-C3 (audit-first only)** | Parent Health Deductions currently uses Family `parentId` and a Family-source dropdown; recorded Social Security stored as numeric state; donations processed through tax code. | Decouple Parent Health data-entry UX using an audited `parentId` migration; draft 3-choice Section 33/Non-33/Manual UX with recorded-versus-estimated accounting; investigate double-donation excess/fallback legality and no double count. | **Separate technical and legal audit + Director decision memo BEFORE any state/schema/tax logic coding** |

Recommended sequence: UX-C1 -> UX-B3 -> UX-C2 -> TAX-C3; no simultaneous overlapping file modifications.

## UX-C1 decisions and preservation proofs

### A. Results
- Compare **numeric values before formatting** and style the planned value using an isolated pure UI helper: changed -> bold accessible dark teal; unchanged -> neutral slate.
- Apply to summary rows, overall deductions, expanded deduction details, marginal rate and effective rate.
- Both increases and decreases get the same "changed" emphasis; the highlighting itself does **not** imply tax savings. Net savings remain calculated exclusively by the existing engine/scenario path.
- Preserve all existing `calculateTax`, `applyPlanningToDeductions`, tax-credit, payable/refund bindings and displayed units.
- No stored state and no calculations changed; old always-blue planned values become neutral when unchanged.

### B. Section 40(2)
- Existing domestic annual commission lives at `income.otherIncome.commission` via `setOtherIncome("commission", value)` and actual withholding at `income.section40_2TaxWithheld`.
- Keep *exactly* these values/handlers, but present two `MoneyInput` fields in the existing responsive `tp-income-financial-row` grid, with a visible heading `ค่านายหน้า / ค่าตอบแทน 40(2)`.
- Reuse the existing MoneyInput helper-after-control behavior. Do **not** introduce another commission or withholding input, recategorize the legacy generic `other` field, or mix statutory categories.

### C. Section 40(3) annual payments
- Domestic examples: qualifying annual payments under a will and annual payments arising from a court judgment. Existing annuity input handlers, tax withholding and expense treatment unchanged.
- Foreign annuity guidance includes the same **examples** but makes no automatic decision about foreign-income taxability.
- Explicit caution: **not every pension belongs to Section 40(3)**; employment-related pensions can be 40(1). Sources:
  - [Revenue Department income categories](https://www.rd.go.th/553.html)
  - [Revenue Department law, Section 40](https://www.rd.go.th/5937.html)
  - [Revenue Department interpretation: annual will-derived income, case 0702/5112](https://www.rd.go.th/27620.html)

### D. Section 40(6) six professions
- Visible dropdown options use existing internal keys **unaltered**: `medical` (การประกอบโรคศิลป), `fineArts` (ประณีตศิลปกรรม) and `other` (กฎหมาย / วิศวกรรม / สถาปัตยกรรม / การบัญชี).
- All six recognized professions are visible. These are *display groupings*, **not** six new stored category keys. Retain domestic and foreign `professionalType`, expense rates, related warning states and all handlers.

### E. Section 40(8)
- The three existing official Revenue Department URLs in `BusinessExpenseCategoryGuidance` now use `target="_blank"` and `rel="noopener noreferrer"`.
- Preserve two domestic/foreign guidance displays, category keys `standard60` / `performer` / `actualOnly`, legal details, all expense-method behavior and actual withholding handlers.

### F. Planner copy
- Change the pension-insurance description from `จ่ายเพิ่ม` to `ซื้อเพิ่ม`; keep RMF and Thai ESG at `ลงทุนเพิ่ม`.
- No new planner cap display in UX-C1. Cap/headroom redesign belongs to UX-B3.

## Accounting / persistence / security boundaries

No changes to Tax Engine, Tax Rules, Withholding Estimator, TaxPlannerContext, data-model types, localStorage, persistence, Reset/Resume, two-tab protections, P1a/Company QR, Supabase, Vercel project config or dependencies. Official Production and legacy Vercel unchanged.

## QA plan & limitations

- Full Vitest and source regression: UX-C1, PR #7 B2, PR #8 Microcopy, PR #10 Income/40(8), PR #9 Estimator, Engine and storage/Reset suites.
- ESLint, TypeScript, Next.js Production Build, fresh exact-HEAD GitHub Actions status and Vercel Preview READY.
- Director physical Preview check: Results equal and changed summary + expanded deduction rows; 40(2) paired values and original generic-other field; both 40(3) pairs and caveat; both 40(6) selectors; all 40(8) external links; planner wording. Mobile widths 375/390/430/768, keyboard Tab and details/links, reload/reset.
- **No browser, keyboard, screenshot or physical mobile QA is claimed without actual evidence.** Any unavailable validation is explicitly marked NOT EXECUTED.
- Stop at Draft PR and return for Director review.

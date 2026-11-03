# TaxPlanner — 40(1) Withholding Tax Estimator (Tax Year 2569)

## Director authority, strict branch boundary
- From verified `main`: `13ad01ab765567967a610872ad63518c31bfe9ff`.
- Branch: `feature/40-1-withholding-estimator` — separate Draft PR only.
- PR #7 (B2) and PR #8 (Microcopy) are **unmerged and not included**.
- Official Production: https://taxplannervid.vercel.app (unchanged).
- No change to Tax Engine, Tax Rules, TaxPlannerContext, saved keys, auth,
  deduction/social-security logic, dependencies or Vercel/Supabase.

## Authoritative official sources checked (3 Nov 2026)
1. Revenue Department: Thai employment salary, wages and bonuses fall in
   Section 40(1); the combined Section 40(1)/40(2) standard expense deduction
   is **50% capped together at THB 100,000**
   https://www.rd.go.th/556.html
   https://www.rd.go.th/59668.html
2. Revenue Department: taxpayer personal allowance **THB 60,000**
   https://www.rd.go.th/62777.html
3. Revenue Department: progressive PIT bands, first **THB 150,000 exempt**
   https://www.rd.go.th/62149.html
   https://www.rd.go.th/59668.html
4. Revenue Department: employer Section 50(1) withholding uses payment
   frequency / annualization and can differ when employment starts midyear.
   It is **not** merely annual tax / 12 in every payroll period.
   https://www.rd.go.th/3613.html
   https://interweb1.rd.go.th/publish/seminar/training/RD19.pdf
5. 2569 Social Security: official provincial PRD report of Social Security
   Office contribution ceiling raised to **THB 875/month** (wage base THB
   17,500), effective 1 January 2569, and shared project tax rules allow
   **THB 10,500/year** for the recorded deduction. Merely receiving a salary
   does NOT establish active Section 33 coverage:
   https://songkhla.prd.go.th/th/content/category/detail/id/33/iid/477946
6. Reuse `TAX_RULES_2569` for the employment expense ratio/cap,
   personal allowance, social-security tax deduction cap and progressive
   bands. No duplicate bracket table.

## Pure function, assumptions and method
`estimateSection40_1Withholding` accepts the **existing** monthly salary,
annual bonus, other annual employment income, existing recorded annual
social-security contribution (if any), and tax year. The optional
`salaryMonthsInYear` argument is for pure-function testing and future
non-UI callers; the current Income UI does **not** create a months field.

1. Domestic 40(1) annual gross = monthly salary × assumed **12 salary
   months** + annual bonus once + annual other employment income once.
   A separately supplied explicit number of salary payments (0–12) can
   override the 12-month assumption, but no employment start/end date is
   stored in the current state. The UI visibly discloses the assumption.
2. Employment expense = min(50% of this 40(1) income, THB 100,000).
   The statutory ceiling is shared across 40(1)/40(2); **no second expense**
   is added. The estimator deliberately excludes separate 40(2) commission,
   so it does **not** calculate a combined 40(1)+40(2) tax scenario.
3. Personal allowance = THB 60,000 using the shared 2569 rule.
4. Social Security = min(recorded **positive** amount in
   `state.deductions.socialSecurity`, THB 10,500); **zero/unknown excludes**
   the deduction, with explicit UI explanation. No Section 33 contribution
   estimate and no update to the stored deduction.
5. Taxable annual net = max(0, gross - employment expense - personal
   allowance - recorded Social Security).
6. Annual estimated tax = sum of banded portions × rates from
   `TAX_RULES_2569.taxBrackets`.
7. Illustrative monthly average = annual estimated tax / 12, rounded to
   satang. Display rounds both to baht for an approachable summary.
   Bonuses and annual irregular payments mean payroll may vary per period.

### Example amounts (not a payroll statement)
| Scenario (2569, no other deductions) | Annual gross | Estimated tax/year | Illustrative tax/month |
|---|---:|---:|---:|
| THB 20,000 monthly salary | THB 240,000 | 0 | 0 |
| THB 50,000 monthly salary | THB 600,000 | 21,500 | 1,792 |
| THB 50,000 monthly salary + THB 120,000 annual bonus | THB 720,000 | 36,500 | 3,042 |
| THB 100,000 monthly salary | THB 1,200,000 | 125,000 | 10,417 |
| THB 50,000 monthly salary, THB 10,000 entered annual Social Security | THB 600,000 | 20,500 | 1,708 |

## Mandatory separation proof
- Actual input label remains exactly
  **ภาษีหัก ณ ที่จ่ายจากเงินได้ 40(1)**, with original value and
  `setIncome({ section40_1TaxWithheld: value })` handler unchanged.
- New UI reads only income and recorded social security to calculate an
  ephemeral estimate and renders numbers; **no setters or persistence**.
- The pure estimator does **not** import/call `calculateTax`, does not
  accept or read `section40_1TaxWithheld`, and does not update state.
- Original `calculateTax` continues to use only actual recorded withholding.
  A new integration guard compares actual credits, taxPayable and taxRefund
  before/after invoking the estimator and with actual withholding = 0.
- Existing salary, bonus and actual tax withholding inputs remain single
  instances. No input for new assumptions is added.

## Known limitations and Director UAT
- This is a simple **annual tax** indication, not actual employer Section
  50(1) payroll calculation, 50 Bis data, advance tax or a refund forecast.
- No midyear employment dates, variable salary, multiple employers, PVD,
  GPF, child/spouse/parent allowances, senior exemptions, foreign income,
  declared employer allowances, or prior withheld amounts are accounted for.
- Social-security zero means *unknown or none*: excluded and disclosed;
  positive recorded amount can include multiple payment periods and is
  not independently verified as Section 33 employer contribution.
- Current UI assumes 12 salary payments; annual bonus and other annual
  employment incomes are never multiplied by 12. Monthly display is
  only annual average, not exact per-pay-period withholding.
- Conditional rule: the UI only shows the estimate for verified tax year
  2569. Function rejects other years until reviewed and supported.
- Director Browser QA: synthetic salary/bonus/other-income changes,
  actual-withholding edits, empty contributions, comparison to annual
  tax card, open details by keyboard, touch and no overflow at 375/390px.
  Check auto-save/reload and refunds, all five steps. **Real Browser QA
  and screenshots are NOT EXECUTED in this connector environment.**
- Do not merge, auto-merge, configure Production or begin P1b.

## Final sequential reconciliation after PR #7, #8 and #10 (2026-11-03)

- PR #10 Production metadata gate VERIFIED: `dpl_6GLUtvioNjsazU28bDp8qgcqibtZ` READY, `taxplannervid.vercel.app` alias assigned, deployed and current main source SHA `e1b88d556791907a0ef7a2556bb228944ff95726`. 64 build events examined; successful Build Completed and Deployment completed, no error/failure event. Browser Smoke for PR #10 **NOT EXECUTED** by agent (prior Director 7/7 Edge was PR #8).
- Existing Draft PR #9 HEAD before reconciliation: `cb139789b66aa65dad0867deb62999d227b88548`. Integrate latest main via two-parent merge commit into existing feature branch, without changing main.
- Exact Income JSX conflict proof: old PR #9 file differs from its common original main base solely by three insertions: one import, one read-only derived annual estimate, and one collapsible display panel. Reverse those additions and the old file is **byte-for-byte identical** to the common base. Final Income file uses current `main` source and inserts only these three approved PR #9 sections.
- Preserve B1 Fresh Teal, B2 Family/Deductions, all PR #8 Microcopy/legal disclosures, both Director tax labels, PR #10 two aligned 40(3) paired rows/under-input helpers and both 40(8) selectors with exactly `standard60` / `performer` / `actualOnly` and unchanged expense handlers. All current main CSS, family, deductions, planner, results, context and financial files untouched.
- Estimator must not write to `section40_1TaxWithheld` or any state. It reads salary, annual bonus, other annual 40(1) income, plus recorded Social Security if any. Uses shared 2569 tax rules, assumes 12 salary months and displays an illustrative annual tax and annual/12 average, explicitly **not** precise payroll withholding.
- Preserve both original PR #9 estimator unit tests and `engine.test.ts` credit/payable/refund integration guard unchanged. Exact new-HEAD CI and Preview/mergeability must be freshly verified after merge commit.
- Updated Preview browser, keyboard and 375/390px mobile checks **NOT EXECUTED** unless separately verified. No manual Production deployment, PR #9 merge/auto-merge, Phase B3 or configuration/dependency/storage/access-control changes.

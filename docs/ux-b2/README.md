# TaxPlanner UX B2 — Family and Deductions

## Authority and baseline

- Director scope: **Family** and **Deductions** only, following approved B1 Fresh Teal + Soft Indigo.
- Base: `main` at `13ad01ab765567967a610872ad63518c31bfe9ff` (PR #6 merged).
- Branch: `feature/ux-b2-family-deductions-20261103`.
- Official Production: https://taxplannervid.vercel.app. It is **not** updated by this Draft PR.
- Legacy `taxplanner` and P1b, Company QR and Staff Login remain out of scope.

## Inspected B1 assets and reuse plan

B1's design tokens, `tp-brand`, `tp-year-badge`, `tp-page-title`,
`tp-page-description`, `tp-card`, `tp-alert-info`, Thai font and
`PlanningStepper` are reused **without modifying their existing behavior**.

B2 adds only `tp-b2-*` CSS classes and `.tp-family` / `.tp-deductions`
page scopes to the current planning stylesheet. This avoids changing B1's
Income pilot or its five-step navigation.

## Implementation

### Family (Step 2)

- Mint introduction with the existing Tax Planner brand/year and B1 headline scale.
- More legible section headings and record cards for children, parents and
  dependents. Existing add/remove handlers and eligibility rules are unchanged.
- Stronger visual selected states; `aria-pressed` reflects the **existing**
  conditions for status, yes/no and age selectors.
- Explicit `htmlFor` / `id` binding for shared MoneyField inputs via `useId`.
- Indigo tax context / family summary, with all original figures,
  warnings and family counts preserved.
- Responsive form/sidebar layout and financial-value wrapping.

### Deductions (Step 3)

- Same introduction, cards, typography and responsive summary.
- Accessible `aria-expanded` based on the existing `isOpen` condition for
  the existing accordion. No new accordion state is introduced.
- Improved grouped deduction fields, clearer total by category, open-section
  distinction and focus/keyboard affordances.
- Explicit shared DeductionInput label/input association via `useId`.
- Indigo summary clearly identifies **amount entered**; the original warning
  that entered amounts are not necessarily allowable tax deductions is preserved.
- Donation preview, eligibility ceilings, planning delta and underlying
  calculations are unchanged.

## Guardrails and code review

**No edits** are authorized to: tax engine/rules, donation logic, financial
context/reducer, localStorage schema, reset/resume/two-tab protections,
P1a access foundation, API/team access, deployment configuration, Supabase,
dependency manifests or Production domains.

Financial state values, numeric format/parse functions, handlers, arrays,
and section configurations remain in the existing page components. B2 only
adds presentation wrappers and accessibility attributes.

## Verification strategy

1. Full GitHub Actions Vitest suite, ESLint and production build on this
   **exact branch HEAD**, not previous B1 results.
2. Focused `ux-b2.test.ts` contracts: page scopes/shared styling, selected
   states, accordion expansion, label/control associations and existing
   warning text. These are source-level UI checks, **not substitutes for**
   browser, accessibility or financial regression tests.
3. Review diff for changed/protected paths and compare against base.
4. Director visual UAT: Family and Deductions at mobile 375/390/430px,
   tablet 768px, desktop 1440px; input focus, summary text readability,
   toggles, add/remove and conditional rendering.
5. Synthetic financial UAT: autosave/resume/reset/two-tab, family eligibility,
   insurance/retirement totals, donation delta, category summary and
   navigation. No real user data in screenshots.
6. Physical Safari and Android acceptance **not inferred** from Chromium or CI.

## Visual evidence / release gate

Screenshots must be captured from the actual running Preview or local build
before being labeled visual evidence. None are manufactured by this document.
A Preview becoming READY is **not** visual or functional acceptance.

**Stop at Draft PR**. Do not merge, auto-merge, change Vercel configuration,
or manually deploy Production. Director decides subsequent review/UAT.

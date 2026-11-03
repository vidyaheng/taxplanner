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

## Director limited visual correction — 2026-11-03

- Family child, parent and dependent delete buttons now share scoped
  `tp-b2-delete` styling: coral `#B42342`, border `#F3C4CD`,
  pale `#FFF1F3` hover/focus, visible 3px focus outline and >=44px target.
  Original delete handlers and lack of extra confirmation are unchanged.
- The original incomplete-tax warning inside the Family Indigo summary retains
  its `taxResult.isComplete` trigger and text, but gains a light
  `#FFF7E9` surface with dark `#6B4311` text.
- Deductions already places its warning outside the Indigo hero on a light
  amber background, so no Deductions JSX edit was necessary.
- Source-color contrast ratios: danger/white 6.44:1, danger/pale coral 5.87:1,
  warning/light amber 8.10:1, lavender/Indigo 7.72:1, white/Indigo 9.76:1.
  These are source-color checks, **not** browser-rendered visual acceptance.

### Director manual QA (new Preview HEAD only)

Check child, parent and dependent delete normal/hover/focus states and original
removal behavior; trigger the existing Family incomplete-tax warning with synthetic
data; inspect Deductions Indigo total and its light warning surfaces; inspect
Income B1 unchanged. Check all five planning pages with expanded B2 sections
at widths 375/390/430/768/1440px for overflow. Verify financial fixture,
autosave/reload, Reset cancel/confirm and two-tab protection. Capture actual
application screenshots of Family delete normal/hover/focus, Family active
warning, Deductions summary and Family at 390px.

**Browser visual QA and screenshots: NOT EXECUTED in this environment.**
Do not infer browser PASS from scoped source tests or CI.
**Draft PR only.** No merge, auto-merge or manual Production deployment.

## Director final delete-button consistency correction — 2026-11-03

Whole-file Deductions source inspection located exactly **two** visible
`ลบ` buttons: parent-health policy and pregnancy record. Both now use the
same `tp-b2-delete` class as all three Family delete buttons. Shared
CSS is scoped to `.tp-b2-page .tp-b2-delete`, so it applies only to
these B2 pages. The five buttons share approved `#B42342` foreground,
`#F3C4CD` border, `#FFF1F3` hover/focus background,
44px minimum width/height, and a 3px visible focus outline.

Original `removeParentHealthPolicy(policy.id)` and
`removePregnancy(pregnancy.id)` handlers remain unchanged.
No extra confirmation, calculations, donation/social-security behavior,
financial storage, reset or access modifications. New source-level regression
checks assert the exact original handlers, no legacy gray delete class,
shared CSS selectors and five consistent buttons.

**Browser execution/screenshots: NOT EXECUTED.** For Director manual QA,
expand the parent-health insurance and maternity/pregnancy deduction groups,
add synthetic records, confirm each delete button has coral normal,
hover/focus styling and 44px touch target, then delete each record without
an added confirmation. Recheck Family's three buttons, keyboard focus and
mobile 390px overflow. Full 375/390/430/768/1440px browser matrix remains
pending. Only accept actual screenshots from this commit's Preview.
Draft PR #7 is not merged or deployed to Production.

## Director Family Summary visual polish — 2026-11-03

**Scope:** Presentation only. The previous pale-cream warning was visually
disproportionate *inside* the dark Indigo Family tax-summary hero.

- When `taxResult.isComplete === false`, the same JSX conditional now renders
  a short neutral pill **รอข้อมูลครบถ้วน** inside the unchanged Indigo hero.
- The existing full incomplete-tax warning text is displayed immediately below
  the hero, on a compact cream surface with dark high-contrast text, using the
  same `!taxResult.isComplete` condition. This is a relocation, **not**
  suppression of the warning or change in eligibility/computation.
- When `taxResult.isComplete === true`, the complete branch displaying
  tax-before-credits, taxable income and marginal rate is byte-for-byte unchanged.
- `taxResult.warnings` remains rendered separately after the preliminary
  breakdown with its original condition and original text. No messages hidden.
- The moved alert uses compact `mt-2` separation and .65rem/.8rem padding.
  The neutral pill uses .35rem/.7rem padding. Existing B2 responsive rules
  remain unchanged; actual mobile 390px browser verification is **PENDING**.

Source regression checks cover conditional positions, complete-branch metrics,
detailed warning retention and compact spacing. These are not screenshots.
No tax logic, donation/social-security calculations, storage, access, CSS
outside B2, dependency or Vercel configuration changes authorized.
PR #7 remains Draft; do not merge, auto-merge or manually deploy Production.

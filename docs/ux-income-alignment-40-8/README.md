# TaxPlanner — Income Alignment & Section 40(8) Category Clarity

## Director scope and branch
- Independent from verified main `13ad01ab765567967a610872ad63518c31bfe9ff` using `feature/ux-income-alignment-40-8-clarity`.
- PR #7 (B2), PR #8 (Wording), PR #9 (40(1) estimate) stay Draft, unmerged
  and are **not** included in this branch.
- Never modify Tax Engine, Tax Rules, TaxPlannerContext, saved data, calculation,
  financial handlers, authorization, dependencies, or deployment configuration.
- Only Income page JSX, Income-scoped design-system CSS, one source-regression
  test and this documentation are changed.

## A — Exact layout fix
- The common local `MoneyInput` originally placed `description` as a paragraph
  **between the label and input**. In the paired 40(3) Royalties and Annuity
  rows, only the withholding field had a description; this moved its top
  input border down relative to its annual-income partner.
- Move the *unchanged text* of the description **after** the input's wrapper
  (margin-top 2), keeping the original `label htmlFor`, input id,
  `aria-describedby`, number formatting, parser, `value` and `onChange`.
- Both 40(3) paired rows now use one reusable `tp-income-financial-row`.
  Income-scoped CSS uses minmax(0,1fr), aligns at the top, stacks below
  768px and shows two columns at and above 768px. No fixed offsets,
  unrelated redesign, or financial state changes.
- The helper position changes for all local `MoneyInput` fields across
  40(1)–40(8), correcting the same alignment cause in other pairs.
  Standalone helpers remain readable below their associated values.

## B — Section 40(8) clarity: exact scope
**Existing three internal category values are untouched**:
`standard60` / `performer` / `actualOnly`; original handlers and
expense-method selection controls remain byte-for-byte unchanged.

Both domestic and foreign 40(8) category selectors are re-labelled
"กลุ่มกิจการตามเกณฑ์หักค่าใช้จ่าย", with a compact explanation directly
below the dropdown and native `<details><summary>` shown closed initially:
"ดูตัวอย่างกิจการและเงื่อนไข".

Accessible linkage uses `aria-describedby` pointing to a unique contextual
paragraph. Native details/summary supports Tab + Enter/Space in browsers;
this is a semantic/static review, **not** proof of physical keyboard QA.

Examples disclosed on demand:
- **`standard60`**: grocery shop (ซื้อมาขายไป) as confirmed by RD, subject
  to eligibility under the Royal Decree. **Not all 40(8) businesses qualify**.
- **`performer`**: actors, singers, musicians, professional athletes. This
  has a separate *tiered* 60% / 40% performer standard expense and cap;
  the existing Tax Engine and visible dynamic rate panel are untouched.
- **`actualOnly`**: only activities outside the legally enumerated
  presumptive-deduction types. No invented example of a specific industry is
  given, because the exact activity can require fact-sensitive classification.
  Users are explicitly directed to verify with the Revenue Department.
- There is **no activity classifier** and the free-text activity field does
  **not** automatically change any category.

## Revenue Department sources checked, 3 Nov 2026
1. Official Royal Decree (No. 11), updated legal text, including 40(8)
   standard expense categories and entertainer-specific rules:
   https://www.rd.go.th/2375.html
2. RD Clear Cut personal tax Q10 (43 eligible items, 60% flat only if listed)
   and Q11 (public entertainers 60% first 300,000 / 40% above, max 600,000):
   https://www.rd.go.th/62149.html
3. RD Clear Cut PND94 Q&A confirming a grocery shop (ซื้อมาขายไป) is
   40(8), eligible for 60% standard or supported actual expenses:
   https://www.rd.go.th/61549.html
4. RD instructions for 2568 PND90 expense tables (historical support,
   not claimed to constitute new 2569 law):
   https://www.rd.go.th/fileadmin/tax_pdf/pit/2568/Ins90_241268.pdf

The official RD examples support clarification; **we do not infer that every
business qualifies**. Applicability should be checked against the nature of
the actual taxpayer's business in tax year 2569.

## Source protection and QA
- Verified original category option value strings remain at two occurrences
  each (foreign and domestic). All financial update-handler invocation counts
  and conditional warning counts remain unchanged.
- Focused Vitest tests: both 40(3) pair fields and bindings; helper-after-input
  and retained aria; 40(8) category values (2 each); original methods;
  both disclosure instances + official links; conditional validation.
- Full suites, Lint, TypeScript and production Build MUST be verified from
  GitHub Actions for exact Draft PR HEAD, not inferred from source.
- Browser QA / screenshots: **NOT EXECUTED** unless actual captured browser
  evidence exists. Test desktop alignment for royalty + annuity and selectors;
  expanded details, Tab/Enter/Space, widths 375/390/430/768/1440 with no
  overflow, input ordering, and input edit/restore behavior.
- Check Income 40(1)–40(8), synthetic financial fixture, autosave, Reset,
  two-tab and page navigation. These are deferred physical checks.
- PR #9 adds an unmerged read-only withholding panel to the same Income page
  and PR #8 adds copy changes there: these independent Drafts will need
  explicit conflict/reconciliation review after separate approvals.
- No merge, no auto-merge, no manual Production deploy, no legacy project
  changes. Stop for Director review.

## Sequential reconciliation after merged PR #7 / PR #8 (2026-11-03)

- Production Gate: Director-confirmed Microsoft Edge Smoke Test 7/7 PASS. Vercel READY, alias and production source SHA 6173f6cd410e86eca932dd02b34b3a659d105d21 verified separately. Browser smoke result is Director-reported, not agent-executed.
- Previous PR #10 HEAD: 281ad11bdd06e5a93ffaeb169d83f3803b33d097. Integrate main 6173f6cd410e86eca932dd02b34b3a659d105d21 via a true two-parent merge commit into existing Draft PR #10 (not into main).
- Income conflict: PR #8 changed exactly one existing label from รายได้จากงานประจำอื่น ๆ ตลอดปี to รายได้อื่นจากนายจ้างทั้งปี. Verified main Income differs from the common pre-PR7/8 base by precisely that one line; preserve full PR #10 Income source and reinstate PR #8 exact copy.
- Stylesheet conflict: latest main contains all B1 and B2 styles. Both branch stylesheets extend the same original base, so use entire latest main stylesheet byte-for-byte plus only isolated Income financial-row styles from PR #10.
- Family, Deductions, Planner, Results and both B2/Microcopy regression tests remain exactly as in merged main, including PR #8 legal disclosures and Director-preserved Thai financial labels.
- Retain both paired Section 40(3) field layouts, helper-after-input and all Section 40(8) options, IDs, descriptions, unchanged original update handlers and existing tax engine.
- Run fresh full CI, tests, lint, TypeScript, build; verify Preview READY and mergeability on new exact HEAD. Updated Preview physical browser visual QA must be reported separately.
- Keep Draft, no PR #10 merge or auto-merge; do not touch PR #9, Production configuration, legacy project, DB, calculations or storage.
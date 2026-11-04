# UX-C2.1 — Parent Relationship Refinement

## Director authorization and baseline
- Starting main: 3e38c830e920998411811c80a707b4e00f1bac6c (PR #12 merged).
- Official Production: dpl_HNGqHEmVdnvUvpfapBGt8q47qqfc READY, official alias and SHA verified before branching.
- Strictly Family parent-entry presentation and validation; all tax and financial state code unchanged.

## Four permitted relationships
1. taxpayer + father: บิดาของผู้เสียภาษี
2. taxpayer + mother: มารดาของผู้เสียภาษี
3. spouse + father: บิดาของคู่สมรส
4. spouse + mother: มารดาของคู่สมรส

Use existing ParentData owner/relation fields and record IDs unchanged. Add suggests the first unused pair and refuses to add if all four are occupied. The selection UI presents all four labels; occupied choices belonging to another record are disabled. The change handler rechecks uniqueness and updates only owner and relation on the selected ID, preserving age, income, support, other-claim and residency data. Delete is unchanged. The former owner label คุณ becomes ผู้เสียภาษี as part of the full relationship name.

## Legacy data and parent health safety
Never delete, merge, migrate, reorder or overwrite old duplicated Parent records. A visible amber alert lists duplicate relationship slots and warns that tax results require review. Users can manually select an unused relationship for a duplicate or delete a record. Existing Engine logic can count qualifying duplicated parents individually; UX-C2.1 does NOT change Engine outputs.

Parent Health Insurance policies use existing parentId links. No reassignment of IDs or changes to policy data. Removing a parent can still leave a dangling linked policy; the existing Deductions UI and Engine already warn. Existing spouse eligibility rules remain untouched.

## Accessibility and responsive structure
Wrapped section header and button for narrow screens, full-width native select with min-w-0, associated label/id, visible keyboard focus, existing danger-style Delete. Parent detail grid uses the existing sm breakpoint; mobile 375/390px stacks. No new financial summaries.

## Tests and safeguards
Add focused tests for four combinations; first unused slot; all-four occupied; duplicate add/edit prevention; legacy duplicates immutable; edit/delete field preservation; parentId source and persisted migration references; Reset/Resume invariants; responsive CSS labels and keyboard cues. Full Vitest, ESLint, TypeScript, Next.js build, exact-HEAD GitHub CI, Vercel Preview READY and GitHub Mergeability required.

Browser/screenshots for desktop 1440, mobile 375/390 and keyboard are NOT EXECUTED until genuine verification. Static tests do not prove physical UAT.

**STOP FOR DIRECTOR REVIEW: Draft PR, unmerged. No auto-merge or Production deploy.**

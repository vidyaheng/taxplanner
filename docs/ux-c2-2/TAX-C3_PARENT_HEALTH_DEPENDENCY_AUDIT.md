# TAX-C3 dependency audit — Independent Parent Health Insurance entry (NOT IMPLEMENTED)

Status: **Director requirement recorded; audit only.** No schema, Tax Engine, Tax Rules, persisted data, Family, or migration changes are authorized by UX-C2.2 PR #14.

## Current linkage

- `src/types/deductions.ts`: each `ParentHealthInsurancePolicyData` has a stable policy `id`, a nullable `parentId` pointing to `FamilyData.parents[].id`, `premiumPaidThisYear`, and nullable `jointPayerCount`. `DeductionData.parentHealthInsurance` is a legacy aggregate; `parentHealthInsurancePolicies === undefined` selects legacy mode; a defined array is the detailed source of truth.
- `src/app/planning/deductions/page.tsx`: parent select comes from `state.family.parents`; selecting a parent stores the ID, and a missing previously selected ID is shown as an orphan/missing option rather than silently rewritten. The current screen requires a Family parent record for eligibility.
- `src/lib/tax/deductions.ts`: detailed records divide a positive premium by a valid integer joint-payer count, then look up `parentId` in `family.parents` and check eligibility. Missing parent/count and ineligibility produce warnings and exclude the affected amount. The result is aggregated and limited by the existing parent-health cap. In legacy mode, the aggregate is eligible only when at least one Family parent passes the checks.

## Eligibility dependencies to preserve

1. Relationship owner: taxpayer or spouse. For spouse-owned parents, `canUseSpouseParentHealthInsurance` checks marital status and whether the current/former spouse has assessable income, including the current-year end-of-marriage path.
2. Parent assessable income: `annualAssessableIncome <= rules.eligibility.parentIncomeLimitInclusive`.
3. Residence: current Engine checks `family.isThaiTaxResident` and `parent.isInThailand` (including legacy undefined behavior). Review the exact legal and confirmation requirements before altering defaults.
4. Per-policy paid premium and `jointPayerCount`; use taxpayer share before applying the shared parent-health cap (currently 15,000 in Engine commentary). Do not infer independent eligibility from an entered amount alone.
5. Unlike ordinary parent allowance, current parent-health check does **not** require parent age 60, taxpayer support, or absence of another person's parent-allowance claim. Preserve this distinction unless later legal audit authorizes a change.

## Proposed independent-entry UX (future TAX-C3 only)

- Offer a relationship selector on each policy: **บิดาผู้เสียภาษี / มารดาผู้เสียภาษี / บิดาคู่สมรส / มารดาคู่สมรส**; selecting must not require creating a Family parent.
- Collect or confirm directly the parent annual assessable income, residence where relevant, applicable spouse income/marital eligibility facts, the gross policy premium for the tax year, and number of income earners jointly paying. Distinguish **unknown** from **eligible**; do not silently turn blank answers into passing confirmations.
- Keep required warnings visible; evaluate each policy/beneficiary against the same tax-year rule set. Product/design must determine whether beneficiary eligibility data are stored once per person or repeated per policy, and how users confirm shared beneficiary identity.

## Compatibility and migration plan to design, not execute

- Define a versioned additive representation (for example a direct beneficiary relationship and eligibility snapshot), while retaining existing policy `id` and legacy `parentId` as a stable optional reference; never rewrite or discard old IDs.
- On read, preserve `undefined` detailed-list semantics for legacy aggregate and preserve existing detailed records without mutation. Map linked parents to visible direct relationship defaults only as a **non-destructive view**, then require explicit confirmation for missing eligibility data before a user can switch entry mode.
- Define deterministic precedence when both old link and new direct-entry fields exist; prevent hidden overwrite during Reset/Resume, localStorage hydration or two-tab writes. Include backward/forward compatibility and rollback fixtures.
- Identify beneficiary identity robustly (four relationship slots plus legacy duplicate handling introduced by PR #13), and detect repeated policies for the **same beneficiary** without incorrectly collapsing legitimately distinct policies. Multiple policies may be valid; the parent-health allowance cap applies to the aggregate after allocation of joint-payer shares.
- Avoid duplicate counting of the legacy aggregate alongside detailed policies. Deduplicate neither `policy.id` nor beneficiary references silently; explicitly flag conflicting duplicates or orphaned IDs for review.
- Cover taxpayer/spouse father/mother, spouse eligibility, multi-policy same beneficiary, legacy duplicates, missing/orphan IDs, invalid joint payer counts, threshold boundaries, residency unknown, legacy aggregate, localStorage restore/reset and financial equality with old valid linked records in regression tests.

## Release gates for separate TAX-C3 approval

Director approves schema/version strategy, legal eligibility assumptions, migration/rollback and explicit confirmation workflow before any code change. Then implement on a separate branch/PR, run full financial regression and browser UAT, and never merge this audit note as authorization to start TAX-C3.

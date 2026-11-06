# TAX-C3.1A — Dormant foundation / Director review

**Status:** Controlled Draft PR, unmerged. No direct-entry UI, no Tax Rules changes, no automatic conversion and no production deployment.

## Baseline
PR #14 merge `c39c6347383d8703be4a7472f6237384e6c9f0ac`; official production `taxplannervid.vercel.app` at deployment `dpl_6G9LsK8dJ8BAUr2ysgsoEJYCHVEb`.

## Architecture
- Four direct relationship slots are defined in `ParentHealthRelationshipKey`: taxpayer father/mother and spouse father/mother.
- `ParentHealthEligibilityProfile` contains **parent-level** data: tax year, relationship, parent assessable income nullable + explicit income confirmation, conditional residence and legal child confirmation.
- `ParentHealthInsurancePolicyData` retains stable `id`, legacy `parentId`, paid premium and payer count, and permits optional direct `relationshipKey`, separate policy-level qualifying-insurance/evidence confirmations, and conversion status.
- **One calculation authority:** `resolveParentHealthPolicies` normalizes legacy aggregate, legacy linked and dormant direct policies. `calculateInsuranceDeductions` aggregates its eligible shares then applies existing `parentHealthMax`, leaving life/health allocation and other tax rules untouched.
- `src/lib/tax/engine.ts` marks incomplete or conflicted dormant direct cases as incomplete and shows a warning. Legacy detailed completeness conditions are unchanged.
- Legal spouse-parent eligibility outcome for legacy records is unchanged. New direct spouse entries reuse the old spouse gate: no new legal entitlement from alternate filing scenarios.
- Null/unknown income, residence when required, legal-child, qualifying insurance, and evidence confirmation must not yield a new entitlement. Evidence of one policy is never copied to another. TaxPlanner performs an estimate, **not** submission to the Revenue Department or insurer; actual filing requirements are distinct. No national IDs/documents are collected.

## Compatibility and conversion
- `parentHealthInsurancePolicies === undefined` retains aggregate mode. A defined detailed array remains the exclusive authority even if aggregate > 0.
- Original policy IDs and parent IDs, paid premiums, payer counts, Family records and aggregate amount are left intact. No automatic schema data migration on page load.
- `prepareParentHealthConversion` is pure and blocks unresolved/orphan IDs, ambiguous duplicate relationships, conflicting existing profile and any unexplained change in paid/allowed/excess. Preview requires a matching unique relationship and tax-year profile. `confirmParentHealthConversion` requires affirmative user consent and unchanged source snapshot. `rollbackParentHealthConversion` refuses to overwrite intervening edits.
- This dormant conversion utility is **not called by the existing UI**; C3.1B will design actual confirmation and recovery screens.
- Legitimately distinct policies for the same parent are preserved; duplicate *direct policy IDs* or duplicate profiles are conflicts, not two entitlements.
- Migration of legacy aggregate to individual policies is prohibited without further user confirmation. Conversions cannot be silently triggered from hydration.

## Persistence and cross-tab safeguards
- Browser key remains `thai-tax-planner-v0.1`. Existing schema is version **14**, intentionally **not bumped**, since no new direct records may be persisted by the existing UI.
- Optional `persistRevision` on the saved document is an additive, nonfinancial field.
- Normal writes in this branch enter `savePlannerStateSerialized`: an exclusive Web Locks request around reading the saved document, comparing reset generation/schema/revision and writing the new revision. Per-tab writes are also queued in original order.
- If Web Locks is unavailable, normal writes **fail closed** and the page warns; this requires **actual browser compatibility acceptance** before merge. No claim is made that all Safari or Android variants support Web Locks.
- Storage notifications detect remote revision changes and stop local writes. `sessionStorage["thai-tax-planner-conflict-recovery"]` is a best-effort recovery snapshot; it is never automatically applied to the live financial state.
- Reset stays **synchronous**; `resetId` continues to fence old snapshots, and a generation guard prevents old in-tab effects from reporting false success after Reset.
- Storage does not offer atomic compare-and-swap. Web Locks protect cooperating **new-version** tabs only, and cannot control already-open JavaScript from old application versions. A synchronous Reset from another tab is not in the Web Locks critical section. These residual race windows require physical cross-tab QA and an explicit Director risk decision before merge.
- An old-version Vercel rollback is not a browser-local data restore. Do not enable live direct-entry persistence until rollback/compatibility across old JS has passed.

## Financial proof fixtures (expected, run by Vitest)
| Fixture | Legacy baseline result | New resolver result / invariant |
| --- | --- | --- |
| Linked taxpayer father, premium 12,000, 2 payers | Paid 6,000 / Allowed 6,000 / Excess 0 | Same; tax payable, taxable income, total deductions and completeness equal |
| Orphan legacy `parentId`, premium 12,000, 2 payers | Paid 6,000 / Allowed 0 / Excess 6,000 | Same; original policy/parent ID retained |
| Legacy aggregate only, no eligible parent, premium 12,000 | Paid 12,000 / Allowed 0 / Excess 12,000 | Same; no detailed policy auto-created |
| Both aggregate 99,999 and detailed 12,000/2 orphan | Detailed Paid 6,000 / Allowed 0 / Excess 6,000 | Aggregate ignored as authority |
| Direct taxpayer parent, 12,000/2, eligibility confirmed | N/A (dormant fixture) | Paid 6,000 / Allowed 6,000 |
| Direct parent income unknown or 30,001 | N/A | Allowed 0 |
| Direct parent income 30,000 | N/A | Income gate passes |
| Direct two distinct policies 8,000 + 9,000 | N/A | Allowed 15,000 / Excess 2,000 |
| Direct evidence unknown on second policy | N/A | First policy allowed; second not eligible |
| Duplicate direct policy ID or duplicate profile | N/A | Conflict; allowed 0 |
| Missing or false legal-child / qualifying-insurance evidence | N/A | No unsupported entitlement |
| Joint payer 0 / missing | N/A | No allowed amount |

**Proof caveat:** Legacy expected values above come from previous Engine behavior and the existing regression fixture contracts. The new tests compare Engine behavior and explicit old/new conversion states. Browser UAT and production-like old-tab/rollback races cannot be proven through unit tests alone.

## Test plan / release gates
- Full Vitest, ESLint, TypeScript/Next build, exact-head GitHub Actions, Preview READY + matching SHA.
- `parent-health-compat.test.ts`: all four relationships, threshold, unknown, residence, per-policy confirmation, shared 15k cap, duplicate identities, orphan, aggregate precedence, conversion confirmation/financial parity/conflict/rollback.
- `TaxPlannerContext.c3-1a.test.ts`: additive hydration, revision increments, two serialized concurrent tab writes, future-schema rejection, fail-closed no-lock, immediate Reset fencing, interrupted lock callback.
- `engine.test.ts`: full Tax Engine before/after legacy conversion including allowed/excess, payable/taxable income and completeness; direct incompleteness.
- Existing legacy insurance/general/retirement/donation and Reset/Resume tests must pass unchanged.

## Known risks / Director decisions BEFORE MERGE
1. **Browser compatibility — NOT EXECUTED:** Manual Edge, iPhone Safari and Android Chrome, two-tab updates, Reset during pending lock, unsupported Web Locks behavior, and recovery flow must be checked before merging. The user-facing recovery snapshot currently requires a future UX for safe restore; never auto-apply it.
2. **Old-version tabs — structural limitation:** Previously loaded old code may overwrite new optional fields/revision despite new-version guards. No claim of complete cross-version atomicity. Keep direct-entry dormant and require Director acceptance of the residual risk before merge.
3. **Reset lock ordering:** Normal saves are lock-serialized; the required synchronous Reset is not. There remains a narrow cross-tab race involving an in-flight save and Reset; evaluate a browser-level mitigation without compromising synchronous Reset before approving merge.
4. **Legal L1:** Spouse-parent filing-method interpretation remains a separate TAX-LEGAL decision. No Tax Rules modifications are made.
5. **Activation:** C3.1B must not begin until C3.1A passes review and receives explicit Director Merge authorization.

**STOP FOR DIRECTOR SOURCE REVIEW. No auto-merge and no Production deployment.**

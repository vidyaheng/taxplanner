# TAX-C3.1A — R2 Snapshot Authority, Recovery and Browser Acceptance

**Status:** Director source review only; existing PR #15 remains Draft and unmerged. Reviewed R1 HEAD `ae2470d6612ca7882ba6fa6a0544b22e1aa773ce`. No new independent-entry UI, Tax Rules, spouse-parent eligibility changes, automatic legacy conversion or Production deployment.

## A. Snapshot precedence policy

The independent Reset Witness is the only source authorized to fence a generation. A number in `persistRevision` is *not* a trusted cross-version ordering proof: old code can omit it or overwrite it, and localStorage does not offer CAS. A journal candidate is never silently promoted over a different valid primary.

| Condition | Active source | Conflict | Candidate preservation |
| --- | --- | --- | --- |
| Primary valid; journal absent; no inconsistent witness/head | Primary | No | Primary |
| Primary and journal valid, byte-for-byte equal | Primary | No | Both |
| Primary newer revision than journal | **None (fail closed)** | Yes | Both |
| Journal newer revision than primary | **None (fail closed)** | Yes | Both |
| Same revision but differing values | **None (fail closed)** | Yes | Both |
| Valid reset witness, primary from different generation | **Reset witness (clean)** | Yes | Witness and recoverable primary; do not activate pre-Reset data |
| Matching clean reset witness and primary; old head from older generation | **Reset witness (clean)** | Yes | Clean witness and primary |
| Valid reset witness and primary same generation, journal divergent | **None (fail closed)** | Yes | All current-generation candidates |
| Corrupt primary; no authoritative reset | **None (fail closed)** | Yes | Valid journal for export only |
| In-flight journal write (head updated, primary not yet updated) | **None (fail closed)** | Yes | Both |
| Journal head malformed / wrong generation | **None**, unless clean matching reset witness is authoritative | Yes | Recoverable valid candidates |
| Journal pointer exists but journal cannot be parsed | **None** | Yes | Recoverable valid candidates |
| Malformed reset witness | **None (fail closed)** | Yes | No implicit trust of primary |

All valid candidate documents included by `readPlannerProtected()` are exposed in its `candidates` result, with source tags. The current-generation guard does not scan unrelated old generations as candidate financial records; never re-promote pre-Reset data. Every conflicting case prevents automatic financial save.

## B. R2 corrections since R1

- `planner-persistence-guard.ts`: deterministic generation authority, validation and conflict reason, candidate enumeration, stale-head / reset precedence, cleanup protection for newly-written generation.
- `TaxPlannerContext.tsx`: no automatic hydration of ambiguous candidates; block normal save on ambiguous protected state; export all recoverable candidates; require explicit user confirmation **after checking the downloaded file** before allowing user Reset with outstanding recovery.
- `planner-recovery-export.ts`: pure JSON bundle builder/serializer. Keeps `unsavedSnapshot` distinct from `protectedCandidates` and labels each candidate's origin.
- `planner-snapshot-precedence.test.ts`: exhaustive priority and JSON integrity test matrix.
- `planner-persistence-guard.test.ts`: adjusts old test expectations for fail-closed semantics and proves cleanup leaves an interleaved newer-generation journal intact.
- `TaxPlannerContext.c3-1a.test.ts`: complete persisted fixtures for strict snapshot validation.

## C. Deterministic race evidence

Source-level Vitest cases inject synchronous storage callbacks and controlled Web Lock scheduling:
1. Pending save then immediate Reset -> no stale saved result.
2. Reset after a journal write -> witness detects invalid generation.
3. Reset immediately before an old primary write -> stale primary may land last, but witness blocks pre-Reset active hydration.
4. Concurrent newer-generation journal during reset cleanup -> current-generation journal retained, not deleted.
5. Old JS overwrites primary after new-version save -> primary and journal retained; no automatic selection of journal.
6. Corrupt JSON and stale pointer -> fail closed.
7. Future schema / malformed pointer -> no unsafe normal writes.

This is **deterministic source behavior, not Edge two-tab browser evidence**. Reset is synchronous but writes to separate localStorage keys are not a transaction. A real pre-existing old application version cannot be forced to acquire this version's Web Lock.

## D. Recovery export and limitations

The `taxplanner-recovery-bundle-v2` JSON contains `unsavedSnapshot` plus a labeled array `protectedCandidates` (including original IDs and financial inputs). The export utility is pure and never makes network requests. Browser code creates a Blob URL and opens a local download from an explicit click. It **does not claim download completion on click**: the UI asks the user to check that the file exists and opens correctly, and only then allows an explicitly confirmed Reset when recovery data remains. Export failure preserves existing snapshot candidates and keeps Reset blocked.

- A sessionStorage backup may be lost on closing the browser tab, clearing site data or private-mode restrictions.
- The journal persists on the same origin only until explicit Reset cleanup or browser storage clearing; an old tab may still race.
- A browser may block downloads, the filesystem may fail, or users may make a mistaken acknowledgment. There is no reliable web-platform receipt proving that the JSON was saved by the operating system.
- No automatic import/reconciliation of old data, no transmission to a server, no collection of national ID or insurance documents.
- A downloaded JSON contains sensitive income/family data; users should store it privately. Recovery after loss of browser origin data requires the user's separately saved copy.

## E. Browser QA evidence

| Scenario | Test evidence / status |
| --- | --- |
| Deterministic queued / active Save ↔ Reset | Vitest simulated PASS |
| Snapshot precedence, malformed/duplicate metadata | Vitest simulated PASS |
| JSON bundle structure, Income/Family/Deductions/Planning and legacy IDs | Vitest simulated PASS |
| Generic Chromium local Blob download | Browser harness PASS (not TaxPlanner app) |
| Exact PR Preview in Microsoft Edge, autosave→reload→resume | **NOT EXECUTED** |
| Microsoft Edge real two-tab editing and reset/Web Locks race | **NOT EXECUTED** |
| Microsoft Edge recovery banner and actual preview JSON download | **NOT EXECUTED** |
| Real browser future-schema / corrupt primary and unsupported Web Locks | **NOT EXECUTED** |
| iPhone Safari physical | **NOT EXECUTED** |
| Android Chrome physical | **NOT EXECUTED** |

The execution environment blocks navigation to Vercel Preview (`net::ERR_BLOCKED_BY_ADMINISTRATOR`), so no actual preview Edge or Chrome UAT is claimed.

## F. Financial scope

The R2 patch changes browser persistence and its tests only. No edits to `src/lib/tax/deductions.ts`, `src/lib/tax/engine.ts`, `src/tax-rules/2569/index.ts`, Family, Deductions UI, Income or Planner calculation code relative to R1. The existing full Tax Engine test suite and legacy parity fixtures remain mandatory in exact-head CI.

## G. Residual risks / Director decision

**BLOCKER:** Preview browser UAT for Edge two-tab writes, Reset under held Web Lock, recovery download and no unexpected save blocking has not been run.

**Director exception only:** Old-version JS can overwrite the legacy main key. The independent reset witness is an effective guard on *new-app protected hydration*, but independent localStorage writes remain non-atomic; cleanup may race after checking keys. Cannot promise absolute protection or full erasure from concurrent old JS. Storage quota errors or site-data deletion can make all local backups unavailable.

**C3.1B deferred:** UX for manually importing, reviewing and reconciling exported recovery bundles; independent Parent Health UI; any tax-logic changes need separate approval.

**Conclusion: NOT MERGE READY.** Do not merge PR #15, activate C3.1B, enable auto-merge or deploy Production.

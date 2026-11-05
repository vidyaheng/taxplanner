# TAX-C3.1A — Director Safety Correction R1 (PR #15)

**Review baseline:** `c47a0df277623d7a4903a66931bca2b18754f394`. Continue existing Draft PR #15 only. The scope remains dormant: no new Parent Health UI, no auto-conversion, no Tax Rules/spouse eligibility changes, and no Production changes.

## A. Root cause and race timelines

### R1 — Reset against active/queued normal save
1. A normal save starts with document `resetId=A, revision=N`; it may be waiting for Web Locks.
2. Tab B calls **synchronous** `persistPlannerReset()`. It deliberately cannot await the Web Lock.
3. Without a separate witness, an already-active save may write old `resetId=A` after the Reset's main-key write; the old data could appear on reload.
4. **Correction:** Reset synchronously writes an independent `-reset-witness` containing the new clean state and generation, then writes the old main key. New-version normal saves check the witness before/after their writes. Protected hydration checks it and refuses to trust a primary document from the wrong generation. A stale overwrite triggers guarded read and a visible export notice rather than silently restoring stale financial inputs.
5. **Limit:** The witness plus main-key write are not an atomic localStorage transaction, and old JS may still overwrite the legacy main key. This is a **recovery/visibility fence**, not a proof that the legacy key cannot temporarily contain stale data.

### R2 — Old-version tab overwrites new persistence metadata
1. An older tab uses the old single localStorage key, no Web Locks/revision handling.
2. It may overwrite `persistRevision` or the future additive fields, even after new tabs have completed a save.
3. **Correction:** Each new-version save writes a separate *per-generation* recovery journal plus a non-sensitive last-generation pointer before updating the old main key. The pointer also permits safe lookup when the old primary document has malformed JSON. Old JS does not write the journal. On startup the new app compares primary vs the guard journal and displays a guarded snapshot without automatically replacing the primary or overwriting newer content.
4. **Limit:** If the older app wrote before a guarded journal existed, or after the page closes without a recoverable snapshot, that loss is not reversible. New JS cannot make old JS obey a new lock. Never claim absolute cross-version write safety.

### R3 — Hidden/erased conflict backup
1. Prior code retained a single `sessionStorage` backup and showed only an alert.
2. Users could reload/close the tab without exporting their data; newer conflicting snapshots could be less accessible.
3. **Correction:** A persistent, accessible warning surface displays a **user-initiated JSON download** containing both the first retained unsaved snapshot and the last protected snapshot where available. No automatic import or overwrite of the live data. Pending backups are detected on reload, and an unexported backup blocks a user Reset. The snapshot includes financial/family data: user is warned to keep it private.
4. **Limit:** A session-scoped backup may disappear when the tab/window is closed; JavaScript cannot guarantee a download completes. A separate localStorage journal survives reload in the same browser profile, but can be removed by clearing site data. Manual export before closing remains mandatory when a warning is shown.

### R4 — Reset privacy and partial storage failure
- Reset now attempts to remove previous per-generation journals once the new clean witness and primary are synchronously stored.
- If an old tab writes after cleanup, a stale journal might still be recreated; it must never override the new-generation witness.
- If writing the primary key fails *after* writing the witness, Reset returns failure, but future guarded hydration reads the clean witness rather than reviving old financial data. This is a known partial-commit state that requires Browser QA.
- If journal removal fails, the reset itself remains effective, but browser storage cleanup cannot be guaranteed. Do not claim full data erasure across concurrent old JS.

## B. Changed files since reviewed SHA

- `src/store/TaxPlannerContext.tsx`: write/reset witness integration, guarded hydration, cross-tab conflict notices, explicit JSON export, reset cleanup and pending-backup safeguard.
- `src/store/planner-persistence-guard.ts` (new): pure storage witness/journal/guarded-read functions and cleanup.
- `src/store/planner-persistence-guard.test.ts` (new): deterministic interleavings, old JS overwrites, corrupt primary, journal failure, reset interruption and cleanup.
- Existing calculation, Family and Tax Rules implementation remains untouched by this correction.

## C. Deterministic tests — behavior, not source-string checks

`planner-persistence-guard.test.ts` uses controlled callback scheduling and injected storage writes to simulate:
- Queued save pending a lock followed by synchronous Reset -> old save rejected.
- Reset after stale journal write / before primary write -> conflict; clean reset visible.
- Reset during stale primary write, with stale write landing last -> primary may contain stale data; protected hydration reads clean reset witness.
- Old-version tab overwriting primary after new-version write -> journal remains available; no automatic destructive rewrite.
- Old-version overwrite after reset -> witness remains authoritative.
- Corrupt primary with valid journal -> recovered snapshot available via the independent generation pointer.
- Journal write denied -> normal save throws, old primary remains.
- Reset cleanup removes old journals; partial Reset failure does not revive stale data.

Existing `TaxPlannerContext.c3-1a.test.ts`, reset tests and tax-engine financial tests must remain green.

## D. Browser gate (must not be inferred from mocks)

| Browser / scenario | Status |
| --- | --- |
| Mocked queued/active cross-tab Reset timeline | Automated deterministic tests |
| Mocked old-version overwrite/recovery | Automated deterministic tests |
| Edge Desktop with two real tabs | **NOT EXECUTED** |
| Edge Reset during pending real Web Lock | **NOT EXECUTED** |
| Edge conflict JSON download / reload/resume | **NOT EXECUTED** |
| iPhone Safari physical | **NOT EXECUTED** |
| Android Chrome physical | **NOT EXECUTED** |
| Browser with Web Locks unsupported | **NOT EXECUTED** (unit fail-closed path tested) |

## E. Director merge decision

**NOT MERGE READY.** The strong practical mitigation detects/reset-fences old writes for *new app startup*, but the old app can still overwrite the legacy main key. Because normal and synchronous Reset operations cannot jointly enter one exclusive Web Lock, no atomicity guarantee is claimed. Cross-tab browser UAT, real export/recovery download, and explicit acceptance of old-version residual risk are required before Merge.

No auto-merge, no Production deploy, no C3.1B.

## F. Regression and CI evidence

Latest source correction includes the corruption-recovery pointer and explicit reset-cleanup tests. The GitHub Actions workflow checks **full Vitest, ESLint and Next.js production build with TypeScript**; inspect the exact PR HEAD run rather than reusing an earlier commit's result. Previously verified correction run `41964523911` passed 28/28 files and 491/491 tests, including deterministic guard tests.

The Vercel Preview is a non-Production deployment and does **not** count as interactive Edge/iPhone/Android acceptance. Re-check its SHA against the PR HEAD after any documentation or source follow-up commit.

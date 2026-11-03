# P1a validation — 2026-11-03 (Asia/Bangkok)

Base: `2c646cab186ee4b1a93d3e8e8d1b42d0f1b137f7`.
Local runtime: Node 24.19.0 / npm 11.9.0. Remote main was rechecked before branching.

| Gate | Result |
| --- | --- |
| `npm ci` | PASS, 407 packages; initial restricted-sandbox call failed with EPERM connecting to proxy, retry with command network permission passed |
| `npm run test -- --run --cache=false` | PASS, 301 tests / 16 files: existing 226 unchanged + new 75 in 2 files |
| `npm run lint` | PASS, exit 0 |
| `tsc --noEmit --incremental false` | PASS, exit 0 |
| `npm run build` | PASS, compilation, type-check and 11 static pages; existing route list unchanged |
| `npm audit --omit=dev` | PASS, exit 0, zero vulnerabilities |
| `npm audit` | FINDINGS, exit 1, 16 Moderate entries, zero High/Critical |
| `git diff --check` | PASS |

Both audits completed against the registry using command network permission, without
changing environment access controls, dependencies or lockfile. The prior audit network
blocker is resolved for these commands. The full audit's residual is minimatch
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
and inherited ESLint/TypeScript lint-chain entries (16 package entries, not 16 independent
root advisories). This matches the documented S2 residual. No forced fix or downgrade is
included. Director must review continued acceptance before merge.

The existing Vite native config-loader warning remains a future-major compatibility
warning; no config change is included. A test-fixture union assignment type error found
during implementation was corrected before the successful type-check/build.

## Scope and security review

- Only new `src/server/access-foundation/*` and `docs/p1a/*` files are included.
- Source search found no references to the foundation in existing application routes,
  components, config, store or tax libraries. All three production modules carry
  `import 'server-only'`; tests mock that marker only.
- Exact diff against base for existing `src/app`, `src/components`, `src/store`, `src/lib`,
  `src/config`, `src/tax-rules`, package.json and package-lock.json is empty.
- Existing 226 tests are unchanged. The build route inventory remains unchanged.
- No environment secrets, database/provider connection, applied migration, cookie/session
  issuance, analytics or financial transmission was introduced. No Vercel/domain changes
  or manual Production deployment was performed.
- Anonymous invitation possession never becomes individual staff identity. Token purpose,
  tenant/lineage, current revocations and expiration are checked separately.
- No production staff lifetime is approved: pending denies. Future integration must derive
  approval state from trusted policy configuration, not caller claims.
- Conservative invitation-expiry cap needs Director review. The proposal has no RLS allow
  policies, and is not an executable integration or validated migration.

New tests cover exact 12h/2h boundaries, start/end, company/invitation/grant expiry,
calendar month clamping/leap years/Bangkok UTC conversion, invitation reuse and re-entry,
stop vs full revoke, company/grant/session revocation, cross-tenant/lineage rejection,
staff/participant separation, staff issuer permissions, missing state/provider errors,
invalid server time and token format/digest/purpose properties.

Unit tests do not prove PostgreSQL locking, transaction safety, deployed RLS enforcement,
cryptographic randomness statistically, or live authentication security. P1b integration
and actual provider/browser verification remain prerequisites for any live release.

Recommendation: **READY FOR REVIEW** as a dormant Draft PR, not approval to merge or deploy.
Review the existing Moderate development-tooling exception and all P1b decisions in README.

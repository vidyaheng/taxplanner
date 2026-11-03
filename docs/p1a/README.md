# P1a — Dormant Access & Session Foundation

Director-authorized scope: isolated server policy and token primitives, dedicated tests,
and an **unapplied** PostgreSQL proposal. No existing runtime imports these modules.
This is not a deployed authentication system. No database/provider connection, routes,
cookies, financial data transmission, UI changes or dependency changes are included.

## Contracts and trust boundary

`src/server/access-foundation/policy.ts` contains pure decisions. Callers supply an
`Authority<T>` snapshot and a server clock in UTC epoch milliseconds. Missing data or
provider failures must become `missing`/`provider_error`, never a fabricated record or
fallback permission. Future adapters must validate external data against these contracts
and catch provider exceptions before calling policy. These are not arbitrary JSON parsers.
Records must be read coherently from authoritative storage. Never trust client-provided
company IDs, roles, flags, last-activity values or the `approved` lifetime marker.

`evaluateRedemption` checks a reusable invitation; it neither creates nor consumes a
grant. Both QR and Link represent the same bearer invitation. Possession establishes no
verified person or physical device. Landing-page GETs/link previews must remain inert.
Only a future explicit, protected Start Planning POST may transact redemption.
No customer account, registration, email verification or password is required.

`evaluateParticipant` validates tenant/lineage, participant purpose, status, absolute and
idle expiry. A session ends at the earliest of creation + 12h, activity + 2h, company,
grant **and invitation** expiry. Capping derived access by invitation expiry is a
conservative foundation choice; Director review is required before relaxing it.
Start is inclusive and end is exclusive. Company suspension blocks all associated access.
Stopping redemptions blocks only new grants; full invitation revocation blocks all derived
access because every decision requires current invitation state. Grant or session revocation
blocks that scope. Re-entry can create a new session only through a still-valid invitation;
it cannot alter company authorization dates. No policy ever touches local financial data.

`evaluateActivity` first checks the old session, then proposes a new server timestamp.
It does not mutate or persist anything and never slides the original creation time.
Concurrent persistence and revocation races require the transaction protocol below.

`evaluateStaff` separates individual managed-provider identity, company membership and
issuer privilege from anonymous participants. QR issuance needs both issuer role and an
active tenant-matching privilege. Staff lifetime policy defaults to **pending/deny**;
there are no hardcoded production staff durations. The `approved` branch is a testable
future contract, not Director approval of any lifetime. Future adapters must also verify
provider authentication strength, MFA requirements and provider/session revocation.

`calendar.ts` adds three calendar months in Bangkok, clamps the day to the destination
month end, preserves local time and emits canonical UTC timestamps. Supported modern
business dates are 2000–9998; UTC+07 has no DST in this range. It rejects ambiguous,
noncanonical or invalid dates. The issuer must see and confirm the calculated Bangkok
end date before future persistence; no issuer UI exists in P1a.

`tokens.ts` uses Node crypto CSPRNG (32 bytes), canonical unpadded base64url, SHA-256
with a versioned purpose domain and timing-safe fixed-length digest comparison. Opaque
bearers contain no authorization claims. Digest comparison alone never authorizes access;
load a matching purpose-specific authoritative record and evaluate policy. No password
hashing or custom encryption protocol is introduced. Do not reuse invitation tokens as
sessions. Never log raw tokens; redact request URLs, error telemetry and referrers in P1b.
Invitation bearer delivery, rotation, cookie settings, CSRF and rate limits are P1b work.
`server-only` markers are recognized by Next.js without adding a dependency, per its bundled
data-security guide. Unit tests mock only that build-time marker; crypto is not mocked.

## Unapplied schema proposal

`schema-proposal.sql` is a review artifact outside migration folders, with a final ROLLBACK.
It has **not been executed or verified against PostgreSQL**. No Supabase deployment or
provider is selected. Staff identities use provider issuer+subject, not email.
Composite foreign keys maintain invitation/grant/session and membership/issuer tenant
lineage. FK lookup indexes support revocation lookups and joins. Separate tables and
purpose constraints prevent participant/staff credential substitution.

CHECK constraints handle same-row ranges, finiteness and digest shape. They cannot enforce
cross-table expiry caps, current status, issuer authorization or time-dependent expiry.
These remain transaction and policy requirements. `revoked_at != null` must map to
`revoked: true`; all timestamp adapters must reject nonfinite/invalid values and retain
consistent millisecond precision. Staff sessions may span memberships; each company action
must re-evaluate the current target membership and company. No global issuer privilege exists.

RLS is enabled and forced with no allow policies; PUBLIC receives no privileges. This is
deny-by-default scaffolding, not a complete RLS implementation. Owners/bypass roles and
service credentials need explicit review. Future runtime roles must not own tables or have
BYPASSRLS, must receive least privileges, and must never be exposed in a browser. The
provider's actual roles and tenant policies require a separate approved integration.

### Required future transactions

- Lock company, invitation, grant and session in consistent order; obtain server time **after**
  acquiring locks, read current statuses, validate, and commit grant/session/activity changes
  atomically. Locking design must serialize redemption/activity with company, invitation,
  grant and session revocation. Recheck all caps before insert/update. Record security events
  in the same transaction where consistency requires it. Define retry behavior for conflicts.
- Derive a grant's bounds from the current company/invitation, not the request. Do not renew
  the company window during redemption. Invitation reuse has no redemption counter to consume.
- Activity updates must be monotonic and conditioned on the session still being live; never
  overwrite `created_at`. A stale activity write must not revive revoked or expired access.
- Define revocation as effective for authorization transactions that serialize after its commit.
  Document treatment of already in-flight requests; do not promise instantaneous cancellation.
- Avoid stale allow caches; define revocation propagation before any caching is introduced.

### Retention and PostgreSQL verification gates

Audit rows contain only allowlisted security metadata, no financial records, free-form payload,
IP/UA, fingerprints or raw secrets. Retention durations, legal basis, staff identity deletion,
audit access and incident needs remain Director/privacy decisions. Cleanup must follow FK
order (sessions → grants → invitations → company); RESTRICT prevents accidental cascades.
Preserve required audit evidence before deleting parent companies. No cleanup job exists.

Before applying any migration: verify SQL syntax on the approved PostgreSQL version;
exercise CHECK/UNIQUE/composite FK behavior and RLS as actual runtime/anonymous roles;
check tenant-denial paths, EXPLAIN index use, concurrent redemption/revocation/activity races,
lock order/deadlock retries, UTC/Bangkok round trips and millisecond precision, backup/restore,
and retention deletion. Unit tests do not establish PostgreSQL transaction safety or live auth security.

## P1b decisions (not authorized here)

Provider/database and deployment approval; staff MFA and lifetimes; issuer bootstrap;
protection for Start Planning POST, CSRF/origin checks and rate limiting; cookie scope/flags;
activity definition, token rotation/re-entry UX and delivery leak controls; transaction and
RLS implementation; audit retention; observability redaction and integration/browser tests.
Existing Team Access/event access is unchanged and is not the new architecture.

## Review checklist

- [ ] Director accepts policy contracts, conservative invitation cap and schema proposal.
- [ ] All required quality gates are reviewed, with network failures distinguished from advisories.
- [ ] No production route imports the foundation; no existing tax/storage/UI file changed.
- [ ] Staff lifetimes, provider and database remain unapproved for production.
- [ ] PostgreSQL, concurrency, RLS and live authentication verification remain future gates.
- [ ] Stop at Draft PR: no merge, auto-merge, configuration change or Production deployment.

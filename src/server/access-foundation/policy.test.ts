import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { ABSOLUTE_MS, IDLE_MS, evaluateActivity, evaluateParticipant, evaluateRedemption, evaluateStaff, type ParticipantState, type StaffState, type Authority } from './policy';
import { companyAuthorizationWindow } from './calendar';
const now = Date.parse('2026-11-03T00:00:00.000Z');
const day = 86_400_000;
const ready = <T>(value: T): Authority<T> => ({ state: 'ready', value });
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
function participant(): Mutable<ParticipantState> {
  return {
    company: { id: 'c', status: 'active', startsAt: now - day, expiresAt: now + 90 * day },
    invitation: { id: 'i', companyId: 'c', kind: 'shared_company', status: 'active', startsAt: now - day, expiresAt: now + 90 * day },
    grant: { id: 'g', companyId: 'c', invitationId: 'i', purpose: 'participant', revoked: false, startsAt: now - day, expiresAt: now + 90 * day },
    session: { id: 's', companyId: 'c', grantId: 'g', purpose: 'participant', revoked: false, createdAt: now, lastActivityAt: now },
  };
}
function staff(): Mutable<StaffState> {
  return { company: participant().company, membership: { id: 'm', staffId: 'u', companyId: 'c', active: true, role: 'staff' },
    session: { id: 's', staffId: 'u', purpose: 'staff', revoked: false, startsAt: now, expiresAt: now + day },
    issuerPrivilege: null, lifetimePolicy: 'pending' };
}
describe('participant policy', () => {
  it('allows the inclusive start', () => expect(evaluateParticipant(ready(participant()), now).allowed).toBe(true));
  it('rejects exactly 12 hours even with recent activity', () => {
    const p = participant(); p.session = { ...p.session, lastActivityAt: now + ABSOLUTE_MS - 1 };
    expect(evaluateParticipant(ready(p), now + ABSOLUTE_MS).allowed).toBe(false);
    expect(evaluateParticipant(ready(p), now + ABSOLUTE_MS - 1).allowed).toBe(true);
  });
  it('rejects exactly two idle hours', () => {
    expect(evaluateParticipant(ready(participant()), now + IDLE_MS - 1).allowed).toBe(true);
    expect(evaluateParticipant(ready(participant()), now + IDLE_MS).allowed).toBe(false);
  });
  it.each(['company', 'invitation', 'grant'] as const)('%s expiry caps access', key => {
    const p = participant(); Object.assign(p, { [key]: { ...p[key], expiresAt: now + 1 } });
    expect(evaluateParticipant(ready(p), now)).toEqual({ allowed: true, expiresAt: now + 1 });
    expect(evaluateParticipant(ready(p), now + 1).allowed).toBe(false);
  });
  it('activity preserves creation and cannot revive expiration', () => {
    const p = participant(); const before = structuredClone(p);
    expect(evaluateActivity(ready(p), now + 1).nextLastActivityAt).toBe(now + 1);
    expect(evaluateActivity(ready(p), now + IDLE_MS).nextLastActivityAt).toBeUndefined();
    expect(p).toEqual(before);
  });
  it.each(['suspended', 'revoked'] as const)('denies company %s', status => {
    const p = participant(); p.company = { ...p.company, status };
    expect(evaluateParticipant(ready(p), now).allowed).toBe(false);
  });
  it.each(['grant', 'session'] as const)('denies revoked %s', key => {
    const p = participant(); Object.assign(p, { [key]: { ...p[key], revoked: true } });
    expect(evaluateParticipant(ready(p), now).allowed).toBe(false);
  });
  it.each(['invitation', 'grant', 'session'] as const)('denies cross-company %s', key => {
    const p = participant(); Object.assign(p, { [key]: { ...p[key], companyId: 'other' } });
    expect(evaluateParticipant(ready(p), now).allowed).toBe(false);
  });
  it('denies mismatched grant and invitation lineage', () => {
    const p = participant(); p.grant = { ...p.grant, invitationId: 'other' };
    expect(evaluateParticipant(ready(p), now).allowed).toBe(false);
    p.grant = participant().grant; p.session = { ...p.session, grantId: 'other' };
    expect(evaluateParticipant(ready(p), now).allowed).toBe(false);
  });
  it.each([NaN, Infinity, now + 1, now - 1])('rejects invalid/future/out-of-order activity %s', lastActivityAt => {
    const p = participant(); p.session = { ...p.session, lastActivityAt };
    expect(evaluateParticipant(ready(p), now).allowed).toBe(false);
  });
  it('denies future creation', () => {
    const p = participant(); p.session = { ...p.session, createdAt: now + 1 };
    expect(evaluateParticipant(ready(p), now).allowed).toBe(false);
  });
  it('denies staff session or staff grant in participant evaluation', () => {
    const p = participant();
    expect(evaluateParticipant(ready({ ...p, session: { ...p.session, purpose: 'staff' } } as unknown as ParticipantState), now).allowed).toBe(false);
    expect(evaluateParticipant(ready({ ...p, grant: { ...p.grant, purpose: 'staff' } } as unknown as ParticipantState), now).allowed).toBe(false);
  });
  it.each(['missing', 'provider_error'] as const)('fails closed for %s', state => {
    expect(evaluateParticipant({ state }, now).allowed).toBe(false);
    expect(evaluateRedemption({ state }, now).allowed).toBe(false);
    expect(evaluateStaff({ state }, now, 'staff_access').allowed).toBe(false);
  });
  it.each(['company', 'invitation', 'grant', 'session'] as const)('fails closed for missing %s record', key => {
    expect(evaluateParticipant(ready({ ...participant(), [key]: null } as unknown as ParticipantState), now).allowed).toBe(false);
  });
  it.each([NaN, Infinity, now + 0.5])('rejects invalid server time %s', at => expect(evaluateParticipant(ready(participant()), at).allowed).toBe(false));
});
describe('shared invitation policy', () => {
  it('supports reusable redemption and re-entry without extending company end', () => {
    const p = participant(); const before = structuredClone(p);
    expect(evaluateRedemption(ready(p), now)).toEqual(evaluateRedemption(ready(p), now + 1));
    expect(evaluateRedemption(ready(p), now + ABSOLUTE_MS).allowed).toBe(true);
    expect(p).toEqual(before);
  });
  it('enforces inclusive company start and exclusive end', () => {
    const p = participant(); p.company = { ...p.company, startsAt: now, expiresAt: now + day };
    expect(evaluateRedemption(ready(p), now - 1).allowed).toBe(false);
    expect(evaluateRedemption(ready(p), now).allowed).toBe(true);
    expect(evaluateRedemption(ready(p), now + day).allowed).toBe(false);
  });
  it('rejects expired invitation', () => {
    const p = participant(); p.invitation = { ...p.invitation, expiresAt: now };
    expect(evaluateRedemption(ready(p), now).allowed).toBe(false);
  });
  it('stops new redemptions but preserves existing derived access', () => {
    const p = participant(); p.invitation = { ...p.invitation, status: 'redemptions_stopped' };
    expect(evaluateRedemption(ready(p), now).allowed).toBe(false);
    expect(evaluateParticipant(ready(p), now).allowed).toBe(true);
  });
  it('full revocation denies new and derived access', () => {
    const p = participant(); p.invitation = { ...p.invitation, status: 'revoked' };
    expect(evaluateRedemption(ready(p), now).allowed).toBe(false);
    expect(evaluateParticipant(ready(p), now).allowed).toBe(false);
  });
});
describe('staff isolation', () => {
  it('denies pending lifetime policy', () => expect(evaluateStaff(ready(staff()), now, 'staff_access').allowed).toBe(false));
  it('allows individual staff with explicitly approved supplied lifetime', () => expect(evaluateStaff(ready({ ...staff(), lifetimePolicy: 'approved' }), now, 'staff_access').allowed).toBe(true));
  it('requires both issuer role and separate active privilege', () => {
    const s: Mutable<StaffState> = { ...staff(), lifetimePolicy: 'approved' };
    expect(evaluateStaff(ready(s), now, 'issue_invitation').allowed).toBe(false);
    s.membership = { ...s.membership, role: 'issuer' };
    expect(evaluateStaff(ready(s), now, 'issue_invitation').allowed).toBe(false);
    s.issuerPrivilege = { membershipId: 'm', companyId: 'c', active: true };
    expect(evaluateStaff(ready(s), now, 'issue_invitation').allowed).toBe(true);
    s.issuerPrivilege = { ...s.issuerPrivilege, companyId: 'other' };
    expect(evaluateStaff(ready(s), now, 'issue_invitation').allowed).toBe(false);
  });
  it('denies cross-company membership and cross-staff session', () => {
    const s: Mutable<StaffState> = { ...staff(), lifetimePolicy: 'approved' };
    expect(evaluateStaff(ready({ ...s, membership: { ...s.membership, companyId: 'other' } }), now, 'staff_access').allowed).toBe(false);
    expect(evaluateStaff(ready({ ...s, session: { ...s.session, staffId: 'other' } }), now, 'staff_access').allowed).toBe(false);
  });
  it('denies participant purpose in staff evaluation', () => {
    const s = { ...staff(), lifetimePolicy: 'approved', session: { ...staff().session, purpose: 'participant' } } as unknown as StaffState;
    expect(evaluateStaff(ready(s), now, 'staff_access').allowed).toBe(false);
  });
  it.each(['revoked', 'expired', 'inactive', 'suspended'] as const)('denies staff %s', condition => {
    const s: Mutable<StaffState> = { ...staff(), lifetimePolicy: 'approved' };
    if (condition === 'revoked') s.session = { ...s.session, revoked: true };
    if (condition === 'expired') s.session = { ...s.session, expiresAt: now };
    if (condition === 'inactive') s.membership = { ...s.membership, active: false };
    if (condition === 'suspended') s.company = { ...s.company, status: 'suspended' };
    expect(evaluateStaff(ready(s), now, 'staff_access').allowed).toBe(false);
  });
});
describe('Bangkok calendar authorization', () => {
  it.each([
    ['2026-01-30T17:00:00.000Z', '2026-04-29T17:00:00.000Z'],
    ['2023-11-29T17:00:00.000Z', '2024-02-28T17:00:00.000Z'],
    ['2024-11-29T17:00:00.000Z', '2025-02-27T17:00:00.000Z'],
    ['2026-10-31T18:23:45.123Z', '2027-01-31T18:23:45.123Z'],
    ['2026-11-03T00:00:00.000Z', '2027-02-03T00:00:00.000Z'],
  ])('adds three local calendar months %s', (start, end) => expect(companyAuthorizationWindow(start)).toEqual({ startsAt: start, expiresAt: end, timezone: 'Asia/Bangkok' }));
  it.each(['2026-02-30T00:00:00.000Z', '2026-11-03', '2026-11-03T07:00:00+07:00', 'invalid', '1999-01-01T00:00:00.000Z'])('rejects unsupported/noncanonical timestamp %s', start => expect(() => companyAuthorizationWindow(start)).toThrow(RangeError));
});

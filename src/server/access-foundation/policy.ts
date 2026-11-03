import 'server-only';

/** All records and times must come from trusted server/provider state, never request claims. */
export type Window = Readonly<{ startsAt: number; expiresAt: number }>;
// Administrative lifecycle is independent of the customer participant authorization window.
export type CompanyOperations = Readonly<{ id: string; status: 'active' | 'suspended' | 'revoked' }>;
export type Company = Window & CompanyOperations;
export type Invitation = Window & Readonly<{
  id: string; companyId: string; status: 'active' | 'redemptions_stopped' | 'revoked';
  kind: 'shared_company';
}>;
export type Grant = Window & Readonly<{
  id: string; companyId: string; invitationId: string; revoked: boolean;
  purpose: 'participant';
}>;
export type ParticipantSession = Readonly<{
  id: string; companyId: string; grantId: string; purpose: 'participant';
  createdAt: number; lastActivityAt: number; revoked: boolean;
}>;
export type Membership = Readonly<{
  id: string; staffId: string; companyId: string; active: boolean;
  role: 'staff' | 'issuer';
}>;
export type StaffSession = Window & Readonly<{
  id: string; staffId: string; purpose: 'staff'; revoked: boolean;
}>;
export type Authority<T> = Readonly<{ state: 'ready'; value: T }> |
  Readonly<{ state: 'missing' | 'provider_error' }>;
export type Decision = Readonly<{ allowed: true; expiresAt: number }> |
  Readonly<{ allowed: false; reason: 'unavailable' | 'invalid' | 'ineligible' | 'tenant_mismatch' | 'purpose_mismatch' | 'permission_denied' }>;
const deny = (reason: Extract<Decision, { allowed: false }>['reason']): Decision => ({ allowed: false, reason });
export const ABSOLUTE_MS = 12 * 60 * 60 * 1000;
export const IDLE_MS = 2 * 60 * 60 * 1000;
const time = (n: number) => Number.isSafeInteger(n) && Math.abs(n) <= 8_640_000_000_000_000;
const id = (s: string) => typeof s === 'string' && s.trim().length > 0;
function validWindow(w: Window, now: number): boolean {
  return time(now) && time(w.startsAt) && time(w.expiresAt) && w.startsAt < w.expiresAt &&
    w.startsAt <= now && now < w.expiresAt;
}
function companyEligible(c: Company, now: number): boolean {
  return id(c.id) && c.status === 'active' && validWindow(c, now);
}
function invitationEligible(i: Invitation, now: number, redemption: boolean): boolean {
  return id(i.id) && id(i.companyId) && i.kind === 'shared_company' && validWindow(i, now) &&
    (i.status === 'active' || (!redemption && i.status === 'redemptions_stopped'));
}
export type InvitationState = Readonly<{ company: Company; invitation: Invitation }>;
/** Evaluation only: repeat calls neither create nor consume a grant. GET must never redeem. */
export function evaluateRedemption(state: Authority<InvitationState>, now: number): Decision {
  if (state?.state !== 'ready' || !state.value) return deny('unavailable');
  const { company: c, invitation: i } = state.value;
  if (!c || !i) return deny('unavailable');
  if (c.id !== i.companyId) return deny('tenant_mismatch');
  if (!companyEligible(c, now) || !invitationEligible(i, now, true)) return deny('ineligible');
  return { allowed: true, expiresAt: Math.min(c.expiresAt, i.expiresAt) };
}
export type ParticipantState = InvitationState & Readonly<{ grant: Grant; session: ParticipantSession }>;
export function evaluateParticipant(state: Authority<ParticipantState>, now: number): Decision {
  if (state?.state !== 'ready' || !state.value) return deny('unavailable');
  const { company: c, invitation: i, grant: g, session: s } = state.value;
  if (!c || !i || !g || !s) return deny('unavailable');
  if (s.purpose !== 'participant' || g.purpose !== 'participant') return deny('purpose_mismatch');
  if (c.id !== i.companyId || c.id !== g.companyId || c.id !== s.companyId ||
      g.invitationId !== i.id || s.grantId !== g.id) return deny('tenant_mismatch');
  if (!companyEligible(c, now) || !invitationEligible(i, now, false) || g.revoked !== false ||
      s.revoked !== false || !id(g.id) || !id(s.id) || !validWindow(g, now)) return deny('ineligible');
  if (!time(s.createdAt) || !time(s.lastActivityAt) || s.createdAt < Math.max(c.startsAt, i.startsAt, g.startsAt) ||
      s.lastActivityAt < s.createdAt || s.lastActivityAt > now) return deny('invalid');
  const expiresAt = Math.min(s.createdAt + ABSOLUTE_MS, s.lastActivityAt + IDLE_MS,
    c.expiresAt, i.expiresAt, g.expiresAt);
  return now < expiresAt ? { allowed: true, expiresAt } : deny('ineligible');
}
/** Validate before recording activity; an expired session cannot be revived. No I/O or mutation. */
export function evaluateActivity(state: Authority<ParticipantState>, now: number):
  Readonly<{ decision: Decision; nextLastActivityAt?: number }> {
  const decision = evaluateParticipant(state, now);
  return decision.allowed ? { decision, nextLastActivityAt: now } : { decision };
}
export type ApplicationStaffMembership = Readonly<{
  id: string; staffId: string; active: boolean;
}>;
export type StaffLoginState = Readonly<{
  applicationMembership: ApplicationStaffMembership;
  session: StaffSession;
  // Only trusted future configuration may mark a lifetime policy approved.
  lifetimePolicy: 'pending' | 'approved';
}>;
export type StaffState = StaffLoginState & Readonly<{
  company: CompanyOperations;
  membership: Membership;
  issuerPrivilege: Readonly<{ membershipId: string; companyId: string; active: boolean }> | null;
}>;
/** Application login only. This decision grants no company or issuer permission. */
export function evaluateStaffLogin(state: Authority<StaffLoginState>, now: number): Decision {
  if (state?.state !== 'ready' || !state.value) return deny('unavailable');
  const { applicationMembership: a, session: s } = state.value;
  if (!a || !s) return deny('unavailable');
  if (s.purpose !== 'staff') return deny('purpose_mismatch');
  if (a.staffId !== s.staffId) return deny('tenant_mismatch');
  if (state.value.lifetimePolicy !== 'approved' || a.active !== true || s.revoked !== false ||
      !id(a.id) || !id(a.staffId) || !id(s.id) || !validWindow(s, now)) return deny('ineligible');
  return { allowed: true, expiresAt: s.expiresAt };
}
/** Company actions require login AND current tenant authorization, independent of QR dates. */
export function evaluateStaff(state: Authority<StaffState>, now: number, purpose: 'company_access' | 'issue_invitation'): Decision {
  const login = evaluateStaffLogin(state, now);
  if (!login.allowed) return login;
  // The successful login established ready authoritative state, not company access.
  if (state.state !== 'ready') return deny('unavailable');
  const { company: c, membership: m, session: s, issuerPrivilege: p } = state.value;
  if (!c || !m) return deny('unavailable');
  if (m.companyId !== c.id || m.staffId !== s.staffId) return deny('tenant_mismatch');
  if (!id(c.id) || c.status !== 'active' || m.active !== true || !id(m.id) ||
      !['staff', 'issuer'].includes(m.role)) return deny('ineligible');
  if (purpose !== 'company_access' && purpose !== 'issue_invitation') return deny('purpose_mismatch');
  if (purpose === 'issue_invitation' && (m.role !== 'issuer' || !p || p.active !== true ||
      p.companyId !== c.id || p.membershipId !== m.id)) return deny('permission_denied');
  return login;
}

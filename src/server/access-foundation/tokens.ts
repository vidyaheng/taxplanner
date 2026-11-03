import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export type TokenPurpose = 'company_invitation' | 'participant_session' | 'staff_session';
const purposes: readonly string[] = ['company_invitation', 'participant_session', 'staff_session'];
const validPurpose = (p: TokenPurpose) => purposes.includes(p);
/** 256 random bits, no embedded identity, tenant, financial data or authorization claims. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}
export function isToken(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token) &&
    Buffer.from(token, 'base64url').toString('base64url') === token;
}
/** Store the digest, never the bearer. Purpose must also match the authoritative record. */
export function digestToken(token: unknown, purpose: TokenPurpose): string | null {
  if (!validPurpose(purpose) || !isToken(token)) return null;
  return createHash('sha256').update(`taxplanner:p1a:v1:${purpose}:`).update(token).digest('hex');
}
export function matchesToken(token: unknown, purpose: TokenPurpose, storedDigest: unknown): boolean {
  const digest = digestToken(token, purpose);
  if (!digest || typeof storedDigest !== 'string' || !/^[a-f0-9]{64}$/.test(storedDigest)) return false;
  return timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(storedDigest, 'hex'));
}

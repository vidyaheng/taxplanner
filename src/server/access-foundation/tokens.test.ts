import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { digestToken, generateToken, isToken, matchesToken, type TokenPurpose } from './tokens';
const token = Buffer.alloc(32, 7).toString('base64url');
it('generates opaque canonical 256-bit tokens from node CSPRNG', () => {
  const generated = Array.from({ length: 128 }, generateToken);
  expect(generated.every(isToken)).toBe(true);
  expect(new Set(generated).size).toBe(128);
  expect(generated.every(t => Buffer.from(t, 'base64url').length === 32)).toBe(true);
});
it('digests deterministically and isolates purposes', () => {
  const purposes: TokenPurpose[] = ['company_invitation', 'participant_session', 'staff_session'];
  const digests = purposes.map(p => digestToken(token, p));
  expect(new Set(digests).size).toBe(3);
  expect(digests[0]).toMatch(/^[a-f0-9]{64}$/);
  expect(digestToken(token, 'company_invitation')).toBe(digests[0]);
  expect(matchesToken(token, 'staff_session', digests[0])).toBe(false);
});
it('accepts exact bearer and rejects a different canonical bearer', () => {
  const stored = digestToken(token, 'participant_session');
  expect(matchesToken(token, 'participant_session', stored)).toBe(true);
  expect(matchesToken(Buffer.alloc(32, 8).toString('base64url'), 'participant_session', stored)).toBe(false);
});
it.each([null, undefined, 42, {}, '', 'a'.repeat(42), 'a'.repeat(44), '!'.repeat(43), 'A'.repeat(42) + 'B', token + '=', ' ' + token])('rejects malformed bearer %#', value => {
  expect(isToken(value)).toBe(false);
  expect(digestToken(value, 'participant_session')).toBeNull();
  expect(matchesToken(value, 'participant_session', '0'.repeat(64))).toBe(false);
});
it.each([null, '', 'a'.repeat(63), 'A'.repeat(64), 'x'.repeat(64), {}])('rejects malformed digest %#', stored => expect(matchesToken(token, 'staff_session', stored)).toBe(false));
it('rejects unrecognized purpose', () => expect(digestToken(token, 'other' as TokenPurpose)).toBeNull());

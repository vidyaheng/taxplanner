import 'server-only';

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
/** Modern business dates only; Bangkok UTC+07 has no DST in the supported 2000–9998 range. */
export function companyAuthorizationWindow(startUtc: string): Readonly<{ startsAt: string; expiresAt: string; timezone: 'Asia/Bangkok' }> {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(startUtc)) throw new RangeError('Canonical UTC timestamp required');
  const start = new Date(startUtc);
  if (!Number.isFinite(start.getTime()) || start.toISOString() !== startUtc) throw new RangeError('Invalid date');
  const local = new Date(start.getTime() + BANGKOK_OFFSET_MS);
  const year = local.getUTCFullYear();
  if (year < 2000 || year > 9998) throw new RangeError('Unsupported business year');
  const month = local.getUTCMonth() + 3;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const end = Date.UTC(year, month, Math.min(local.getUTCDate(), lastDay),
    local.getUTCHours(), local.getUTCMinutes(), local.getUTCSeconds(), local.getUTCMilliseconds()) - BANGKOK_OFFSET_MS;
  return { startsAt: startUtc, expiresAt: new Date(end).toISOString(), timezone: 'Asia/Bangkok' };
}

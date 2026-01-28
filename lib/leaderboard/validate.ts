/**
 * Input validation for leaderboard API.
 * Keeps route handlers thin; called at the boundary.
 */

const STACKS_ADDRESS_REGEX = /^S[PTM][0-9A-Za-z]{28,}$/

export function parseAddress(raw: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, message: 'Address is required' }
  }
  const trimmed = raw.trim()
  if (!STACKS_ADDRESS_REGEX.test(trimmed)) {
    return { ok: false, message: 'Invalid Stacks address format' }
  }
  return { ok: true, value: trimmed }
}

export function parseScore(raw: unknown): { ok: true; value: number } | { ok: false; message: string } {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : NaN
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    return { ok: false, message: 'Score must be a non-negative integer' }
  }
  return { ok: true, value: n }
}

export function parseLimitOffset(
  limitRaw: string | null,
  offsetRaw: string | null
): { limit: number; offset: number } {
  const limitNum = limitRaw != null && limitRaw !== '' ? parseInt(limitRaw, 10) : NaN
  const offsetNum = offsetRaw != null && offsetRaw !== '' ? parseInt(offsetRaw, 10) : NaN
  const limit = Number.isFinite(limitNum) ? Math.max(1, Math.min(100, limitNum)) : 50
  const offset = Number.isFinite(offsetNum) && offsetNum >= 0 ? offsetNum : 0
  return { limit, offset }
}

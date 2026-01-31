/**
 * Client-side cache for badge ownership (from /api/badge-ownership).
 * Shared so that ClaimGrid can invalidate after a successful claim,
 * and BadgesGrid refetches on next mount/visit — no refresh needed to see "Owned".
 */

const CACHE_TTL_MS = 60_000

const ownershipCache: {
  address: string
  data: Record<string, number | null>
  ts: number
} = { address: '', data: {}, ts: 0 }

export { CACHE_TTL_MS }

export function getBadgeOwnershipCache(
  address: string
): Record<string, number | null> | null {
  const now = Date.now()
  if (
    ownershipCache.address === address &&
    ownershipCache.ts > 0 &&
    now - ownershipCache.ts < CACHE_TTL_MS
  ) {
    return ownershipCache.data
  }
  return null
}

export function setBadgeOwnershipCache(
  address: string,
  data: Record<string, number | null>
): void {
  ownershipCache.address = address
  ownershipCache.data = data
  ownershipCache.ts = Date.now()
}

/**
 * Call after a successful badge claim so that /badges refetches
 * and shows "Owned" without requiring a full page refresh.
 */
export function invalidateBadgeOwnershipCache(): void {
  ownershipCache.ts = 0
}

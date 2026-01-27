/**
 * Client-side badge ownership helper
 *
 * Fetch ownership dari backend API (/api/badge-ownership), bukan langsung ke Hiro.
 * Dipakai oleh BadgesGrid & ClaimGrid untuk konsistensi dan menghindari CORS/429.
 */

import type { BadgeTier } from '@/lib/game/types'

export type OwnershipByTier = Record<BadgeTier, number | null>

export interface BadgeOwnershipResponse {
  data: OwnershipByTier
}

/**
 * Fetch badge ownership dari backend API (semua tier sekaligus)
 */
export async function fetchBadgeOwnership(
  address: string
): Promise<OwnershipByTier> {
  if (!address || address.trim() === '') {
    throw new Error('Address required')
  }

  const res = await fetch(
    `/api/badge-ownership?address=${encodeURIComponent(address.trim())}`
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = typeof err?.error === 'string' ? err.error : `HTTP ${res.status}`
    throw new Error(msg)
  }

  const json: BadgeOwnershipResponse = await res.json()
  if (!json?.data || typeof json.data !== 'object') {
    throw new Error('Invalid response from badge ownership API')
  }

  return json.data as OwnershipByTier
}

/**
 * Get ownership untuk single tier dari result
 */
export function getOwnershipForTier(
  ownershipByTier: OwnershipByTier,
  tier: BadgeTier
): number | null {
  return ownershipByTier[tier] ?? null
}

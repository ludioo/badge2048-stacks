import { DEFAULT_BADGES } from '@/lib/game/constants'
import type { Badge, BadgeState, BadgeTier } from '@/lib/game/types'

export type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem?: (key: string) => void
}

export const BADGES_STORAGE_KEY = 'badges_v1'
export const LEGACY_BADGES_STORAGE_KEY = 'badges'
export const BADGE_UNLOCKED_EVENT = 'badge_unlocked'

const badgeTiers = new Set<BadgeTier>(['bronze', 'silver', 'gold', 'elite'])

const isBadge = (value: unknown): value is Badge => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Badge
  return (
    badgeTiers.has(candidate.tier) &&
    typeof candidate.threshold === 'number' &&
    typeof candidate.unlocked === 'boolean' &&
    typeof candidate.claimed === 'boolean' &&
    (candidate.claimedAt === undefined || typeof candidate.claimedAt === 'string') &&
    // Optional onchain fields: validate type if present, allow undefined for backward compatibility
    (candidate.onchainMinted === undefined || typeof candidate.onchainMinted === 'boolean') &&
    (candidate.tokenId === undefined || typeof candidate.tokenId === 'number') &&
    (candidate.txId === undefined || typeof candidate.txId === 'string') &&
    (candidate.mintedAt === undefined || typeof candidate.mintedAt === 'string')
  )
}

export const areBadgeStatesEqual = (left: BadgeState, right: BadgeState) => {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    const leftBadge = left[index]
    const rightBadge = right[index]
    if (!rightBadge) return false
    if (
      leftBadge.tier !== rightBadge.tier ||
      leftBadge.threshold !== rightBadge.threshold ||
      leftBadge.unlocked !== rightBadge.unlocked ||
      leftBadge.claimed !== rightBadge.claimed ||
      leftBadge.claimedAt !== rightBadge.claimedAt ||
      leftBadge.onchainMinted !== rightBadge.onchainMinted ||
      leftBadge.tokenId !== rightBadge.tokenId ||
      leftBadge.txId !== rightBadge.txId ||
      leftBadge.mintedAt !== rightBadge.mintedAt
    ) {
      return false
    }
  }
  return true
}

const cloneBadgeState = (badges: BadgeState): BadgeState =>
  badges.map((badge) => ({ ...badge }))

export const normalizeBadgeState = (badges: BadgeState): BadgeState => {
  const badgeByTier = new Map<BadgeTier, Badge>()
  badges.filter(isBadge).forEach((badge) => {
    badgeByTier.set(badge.tier, badge)
  })

  return DEFAULT_BADGES.map((defaultBadge) => {
    const stored = badgeByTier.get(defaultBadge.tier)
    const claimedAt = stored?.claimed && stored.claimedAt ? stored.claimedAt : undefined
    return {
      ...defaultBadge,
      unlocked: stored?.unlocked ?? defaultBadge.unlocked,
      claimed: stored?.claimed ?? defaultBadge.claimed,
      ...(claimedAt ? { claimedAt } : {}),
      // Preserve onchain fields if present
      ...(stored?.onchainMinted !== undefined ? { onchainMinted: stored.onchainMinted } : {}),
      ...(stored?.tokenId !== undefined ? { tokenId: stored.tokenId } : {}),
      ...(stored?.txId !== undefined ? { txId: stored.txId } : {}),
      ...(stored?.mintedAt !== undefined ? { mintedAt: stored.mintedAt } : {}),
    }
  })
}

export const createDefaultBadges = (): BadgeState =>
  cloneBadgeState(DEFAULT_BADGES)

const extractBadgeState = (value: unknown): BadgeState | null => {
  if (Array.isArray(value)) {
    return value.filter(isBadge)
  }

  if (value && typeof value === 'object') {
    const record = value as { badges?: unknown }
    if (Array.isArray(record.badges)) {
      return record.badges.filter(isBadge)
    }
  }

  return null
}

const getStorage = (storage?: StorageLike): StorageLike | null => {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const readBadgesFromStorage = (
  storage: StorageLike,
  key: string
): BadgeState | null => {
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const extracted = extractBadgeState(parsed)
    if (!extracted) return null
    return normalizeBadgeState(extracted)
  } catch {
    return null
  }
}

export const loadBadgesFromStorage = (storage?: StorageLike): BadgeState => {
  const resolvedStorage = getStorage(storage)
  if (!resolvedStorage) {
    return createDefaultBadges()
  }

  const current = readBadgesFromStorage(resolvedStorage, BADGES_STORAGE_KEY)
  if (current) return current

  const legacy = readBadgesFromStorage(resolvedStorage, LEGACY_BADGES_STORAGE_KEY)
  if (legacy) {
    saveBadgesToStorage(legacy, resolvedStorage)
    return legacy
  }

  return createDefaultBadges()
}

export const saveBadgesToStorage = (badges: BadgeState, storage?: StorageLike) => {
  const resolvedStorage = getStorage(storage)
  if (!resolvedStorage) return
  try {
    const normalized = normalizeBadgeState(badges)
    resolvedStorage.setItem(
      BADGES_STORAGE_KEY,
      JSON.stringify({ badges: normalized })
    )
  } catch {
    // Ignore storage write errors (e.g. storage disabled or quota exceeded)
  }
}


export const unlockBadgesForScore = (
  score: number,
  badges: BadgeState
): { badges: BadgeState; didChange: boolean; newlyUnlocked: BadgeTier[] } => {
  const normalized = normalizeBadgeState(badges)
  const newlyUnlocked: BadgeTier[] = []

  const updated = normalized.map((badge) => {
    if (!badge.unlocked && score >= badge.threshold) {
      newlyUnlocked.push(badge.tier)
      return { ...badge, unlocked: true }
    }
    return badge
  })

  const normalizedChanged = !areBadgeStatesEqual(normalized, badges)
  const unlocksChanged = !areBadgeStatesEqual(updated, normalized)

  return {
    badges: updated,
    didChange: normalizedChanged || unlocksChanged,
    newlyUnlocked,
  }
}

export const claimBadgeForTier = (
  tier: BadgeTier,
  badges: BadgeState,
  claimedAt: string = new Date().toISOString()
): { badges: BadgeState; didChange: boolean; claimedBadge?: Badge } => {
  const normalized = normalizeBadgeState(badges)
  let claimedBadge: Badge | undefined

  const updated = normalized.map((badge) => {
    if (badge.tier !== tier) return badge
    if (!badge.unlocked || badge.claimed) return badge
    claimedBadge = { ...badge, claimed: true, claimedAt }
    return claimedBadge
  })

  const normalizedChanged = !areBadgeStatesEqual(normalized, badges)
  const claimChanged = !areBadgeStatesEqual(updated, normalized)

  return {
    badges: updated,
    didChange: normalizedChanged || claimChanged,
    claimedBadge,
  }
}

/**
 * Unclaim a badge for a specific tier (for testing purposes).
 * Resets the badge to unlocked but not claimed state.
 * Note: This does NOT remove onchain mint data - only resets claimed state.
 * Use with caution - this is primarily for testing/development.
 */
export const unclaimBadgeForTier = (
  tier: BadgeTier,
  badges: BadgeState
): { badges: BadgeState; didChange: boolean; unclaimedBadge?: Badge } => {
  const normalized = normalizeBadgeState(badges)
  let unclaimedBadge: Badge | undefined

  const updated = normalized.map((badge) => {
    if (badge.tier !== tier) return badge
    if (!badge.unlocked || !badge.claimed) return badge
    // Reset claimed state but preserve unlocked state and onchain data
    unclaimedBadge = {
      ...badge,
      claimed: false,
      claimedAt: undefined,
      // Note: onchainMinted, tokenId, txId, mintedAt are preserved
      // This allows testing claim flow again even if badge was minted onchain
    }
    return unclaimedBadge
  })

  const normalizedChanged = !areBadgeStatesEqual(normalized, badges)
  const unclaimChanged = !areBadgeStatesEqual(updated, normalized)

  return {
    badges: updated,
    didChange: normalizedChanged || unclaimChanged,
    unclaimedBadge,
  }
}

/**
 * Fully reset a badge (unclaim and clear onchain data).
 * Useful for testing purposes to completely reset badge state.
 * 
 * @param tier - Badge tier to reset
 * @param badges - Current badge state
 * @returns Updated badge state with claimed and onchain data cleared
 */
export const resetBadgeForTier = (
  tier: BadgeTier,
  badges: BadgeState
): { badges: BadgeState; didChange: boolean; resetBadge?: Badge } => {
  const normalized = normalizeBadgeState(badges)
  let resetBadge: Badge | undefined

  const updated = normalized.map((badge) => {
    if (badge.tier !== tier) return badge
    // Fully reset: unclaim and clear all onchain data
    resetBadge = {
      ...badge,
      claimed: false,
      claimedAt: undefined,
      onchainMinted: undefined,
      tokenId: undefined,
      txId: undefined,
      mintedAt: undefined,
    }
    return resetBadge
  })

  const normalizedChanged = !areBadgeStatesEqual(normalized, badges)
  const resetChanged = !areBadgeStatesEqual(updated, normalized)

  return {
    badges: updated,
    didChange: normalizedChanged || resetChanged,
    resetBadge,
  }
}

export const emitBadgeUnlocked = (detail: { tiers: BadgeTier[]; score: number }) => {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(
      new CustomEvent(BADGE_UNLOCKED_EVENT, {
        detail: {
          ...detail,
          timestamp: new Date().toISOString(),
        },
      })
    )
  } catch {
    // Ignore analytics event errors
  }
}

// --- Badge sync helpers (Step 7) ---

/**
 * Returns true if the badge is claimed but not yet minted onchain.
 * Use this to show "Mint onchain" for claimed badges that need minting.
 */
export const badgeNeedsMinting = (badge: Badge): boolean =>
  badge.claimed === true && badge.onchainMinted !== true

export type OnchainBadgeData = {
  tokenId: number
  txId?: string
  mintedAt?: string
}

/**
 * Returns a new badge with onchain mint data set.
 * Preserves all other fields. Use after successful mint transaction.
 */
export const updateBadgeWithOnchainData = (
  badge: Badge,
  data: { tokenId: number; txId: string; mintedAt: string }
): Badge => ({
  ...badge,
  unlocked: badge.unlocked, // Explicitly preserve unlocked status
  onchainMinted: true,
  tokenId: data.tokenId,
  txId: data.txId,
  mintedAt: data.mintedAt,
})

/**
 * Merges offchain badge state with onchain data per tier.
 * Use when fetching ownership from contract/indexer and combining with localStorage.
 */
export const mergeOffchainAndOnchainBadges = (
  offchain: BadgeState,
  onchainByTier: Map<BadgeTier, OnchainBadgeData>
): BadgeState => {
  const normalized = normalizeBadgeState(offchain)
  return normalized.map((badge) => {
    const onchain = onchainByTier.get(badge.tier)
    if (!onchain) return badge
    return {
      ...badge,
      onchainMinted: true,
      tokenId: onchain.tokenId,
      ...(onchain.txId !== undefined ? { txId: onchain.txId } : {}),
      ...(onchain.mintedAt !== undefined ? { mintedAt: onchain.mintedAt } : {}),
    }
  })
}

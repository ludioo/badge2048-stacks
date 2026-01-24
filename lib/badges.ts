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
    typeof candidate.claimed === 'boolean'
  )
}

const areBadgeStatesEqual = (left: BadgeState, right: BadgeState) => {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    const leftBadge = left[index]
    const rightBadge = right[index]
    if (!rightBadge) return false
    if (
      leftBadge.tier !== rightBadge.tier ||
      leftBadge.threshold !== rightBadge.threshold ||
      leftBadge.unlocked !== rightBadge.unlocked ||
      leftBadge.claimed !== rightBadge.claimed
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
    return {
      ...defaultBadge,
      unlocked: stored?.unlocked ?? defaultBadge.unlocked,
      claimed: stored?.claimed ?? defaultBadge.claimed,
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

import { describe, expect, it } from 'vitest'
import { DEFAULT_BADGES } from '@/lib/game/constants'
import type { BadgeState } from '@/lib/game/types'
import {
  BADGES_STORAGE_KEY,
  LEGACY_BADGES_STORAGE_KEY,
  loadBadgesFromStorage,
  normalizeBadgeState,
  unlockBadgesForScore,
} from '@/lib/badges'

const createStorage = (initial: Record<string, string> = {}) => {
  const store = new Map(Object.entries(initial))
  return {
    storage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    },
    getRaw: (key: string) => store.get(key) ?? null,
  }
}

describe('unlockBadgesForScore', () => {
  it('returns unchanged for low score', () => {
    const { badges, didChange, newlyUnlocked } = unlockBadgesForScore(512, DEFAULT_BADGES)
    expect(badges).toEqual(DEFAULT_BADGES)
    expect(didChange).toBe(false)
    expect(newlyUnlocked).toEqual([])
  })

  it('unlocks bronze at threshold', () => {
    const { badges, didChange, newlyUnlocked } = unlockBadgesForScore(1024, DEFAULT_BADGES)
    const bronze = badges.find((badge) => badge.tier === 'bronze')

    expect(bronze?.unlocked).toBe(true)
    expect(bronze?.claimed).toBe(false)
    expect(newlyUnlocked).toEqual(['bronze'])
    expect(didChange).toBe(true)
  })

  it('unlocks multiple tiers for high score', () => {
    const { badges, newlyUnlocked } = unlockBadgesForScore(5000, DEFAULT_BADGES)
    const unlockedTiers = badges.filter((badge) => badge.unlocked).map((badge) => badge.tier)

    expect(unlockedTiers).toEqual(['bronze', 'silver', 'gold'])
    expect(newlyUnlocked).toEqual(['bronze', 'silver', 'gold'])
  })

  it('does not re-unlock already unlocked tiers', () => {
    const preUnlocked = DEFAULT_BADGES.map((badge) =>
      badge.tier === 'bronze' ? { ...badge, unlocked: true } : badge
    )
    const { badges, didChange, newlyUnlocked } = unlockBadgesForScore(1024, preUnlocked)

    expect(badges).toEqual(preUnlocked)
    expect(newlyUnlocked).toEqual([])
    expect(didChange).toBe(false)
  })
})

describe('normalizeBadgeState', () => {
  it('fills missing tiers and keeps stored flags', () => {
    const partial = [
      { tier: 'silver', threshold: 2048, unlocked: true, claimed: false },
    ] as BadgeState

    const normalized = normalizeBadgeState(partial)
    const silver = normalized.find((badge) => badge.tier === 'silver')
    const bronze = normalized.find((badge) => badge.tier === 'bronze')

    expect(normalized).toHaveLength(DEFAULT_BADGES.length)
    expect(silver?.unlocked).toBe(true)
    expect(bronze?.unlocked).toBe(false)
  })
})

describe('loadBadgesFromStorage', () => {
  it('loads badges from array payload', () => {
    const stored = JSON.stringify([
      { tier: 'bronze', threshold: 1024, unlocked: true, claimed: false },
    ])
    const { storage } = createStorage({ [BADGES_STORAGE_KEY]: stored })

    const loaded = loadBadgesFromStorage(storage)
    const bronze = loaded.find((badge) => badge.tier === 'bronze')

    expect(bronze?.unlocked).toBe(true)
  })

  it('loads badges from object payload', () => {
    const stored = JSON.stringify({
      badges: [{ tier: 'silver', threshold: 2048, unlocked: true, claimed: false }],
    })
    const { storage } = createStorage({ [BADGES_STORAGE_KEY]: stored })

    const loaded = loadBadgesFromStorage(storage)
    const silver = loaded.find((badge) => badge.tier === 'silver')

    expect(silver?.unlocked).toBe(true)
  })

  it('migrates legacy key to current schema', () => {
    const stored = JSON.stringify([
      { tier: 'gold', threshold: 4096, unlocked: true, claimed: false },
    ])
    const { storage, getRaw } = createStorage({ [LEGACY_BADGES_STORAGE_KEY]: stored })

    const loaded = loadBadgesFromStorage(storage)
    const gold = loaded.find((badge) => badge.tier === 'gold')

    expect(gold?.unlocked).toBe(true)
    expect(getRaw(BADGES_STORAGE_KEY)).not.toBeNull()
  })

  it('returns defaults for corrupt data', () => {
    const { storage } = createStorage({ [BADGES_STORAGE_KEY]: 'not-json' })

    const loaded = loadBadgesFromStorage(storage)

    expect(loaded).toEqual(DEFAULT_BADGES)
  })
})

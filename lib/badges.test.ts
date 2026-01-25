import { describe, expect, it } from 'vitest'
import { DEFAULT_BADGES } from '@/lib/game/constants'
import type { Badge, BadgeState, BadgeTier } from '@/lib/game/types'
import {
  areBadgeStatesEqual,
  badgeNeedsMinting,
  BADGES_STORAGE_KEY,
  LEGACY_BADGES_STORAGE_KEY,
  claimBadgeForTier,
  loadBadgesFromStorage,
  mergeOffchainAndOnchainBadges,
  normalizeBadgeState,
  saveBadgesToStorage,
  unlockBadgesForScore,
  updateBadgeWithOnchainData,
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

  it('preserves onchain fields when present in stored badge', () => {
    const partial: BadgeState = [
      {
        tier: 'gold',
        threshold: 4096,
        unlocked: true,
        claimed: true,
        claimedAt: '2026-01-25T10:00:00.000Z',
        onchainMinted: true,
        tokenId: 5,
        txId: '0xgold',
        mintedAt: '2026-01-25T10:05:00.000Z',
      },
    ]

    const normalized = normalizeBadgeState(partial)
    const gold = normalized.find((badge) => badge.tier === 'gold')

    expect(gold?.onchainMinted).toBe(true)
    expect(gold?.tokenId).toBe(5)
    expect(gold?.txId).toBe('0xgold')
    expect(gold?.mintedAt).toBe('2026-01-25T10:05:00.000Z')
  })

  it('does not add onchain fields when not present in stored badge', () => {
    const partial: BadgeState = [
      {
        tier: 'elite',
        threshold: 8192,
        unlocked: true,
        claimed: false,
      },
    ]

    const normalized = normalizeBadgeState(partial)
    const elite = normalized.find((badge) => badge.tier === 'elite')

    expect(elite?.unlocked).toBe(true)
    expect(elite?.onchainMinted).toBeUndefined()
    expect(elite?.tokenId).toBeUndefined()
    expect(elite?.txId).toBeUndefined()
    expect(elite?.mintedAt).toBeUndefined()
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

describe('claim flow', () => {
  it('unlocks, claims, and persists a badge', () => {
    const { badges: unlocked } = unlockBadgesForScore(2048, DEFAULT_BADGES)
    const claimedAt = '2026-01-24T10:15:30.000Z'
    const { badges: claimed, claimedBadge, didChange } = claimBadgeForTier(
      'bronze',
      unlocked,
      claimedAt
    )

    expect(didChange).toBe(true)
    expect(claimedBadge?.claimed).toBe(true)
    expect(claimedBadge?.claimedAt).toBe(claimedAt)

    const { storage } = createStorage()
    saveBadgesToStorage(claimed, storage)
    const loaded = loadBadgesFromStorage(storage)
    const bronze = loaded.find((badge) => badge.tier === 'bronze')

    expect(bronze?.claimed).toBe(true)
    expect(bronze?.claimedAt).toBe(claimedAt)
  })
})

describe('Step 5: unlock/claim preserve onchain fields', () => {
  it('unlockBadgesForScore preserves onchain fields when unlocking new tier', () => {
    const bronzeWithOnchain: Badge = {
      tier: 'bronze',
      threshold: 1024,
      unlocked: true,
      claimed: true,
      claimedAt: '2026-01-25T10:00:00.000Z',
      onchainMinted: true,
      tokenId: 1,
      txId: '0xabc',
      mintedAt: '2026-01-25T10:00:00.000Z',
    }
    const silver = DEFAULT_BADGES.find((b) => b.tier === 'silver')!
    const gold = DEFAULT_BADGES.find((b) => b.tier === 'gold')!
    const elite = DEFAULT_BADGES.find((b) => b.tier === 'elite')!
    const state: BadgeState = [bronzeWithOnchain, silver, gold, elite]

    const { badges } = unlockBadgesForScore(2048, state)

    const bronze = badges.find((b) => b.tier === 'bronze')
    expect(bronze?.onchainMinted).toBe(true)
    expect(bronze?.tokenId).toBe(1)
    expect(bronze?.txId).toBe('0xabc')
    expect(bronze?.mintedAt).toBe('2026-01-25T10:00:00.000Z')
  })

  it('claimBadgeForTier preserves onchain fields on other badges', () => {
    const bronzeWithOnchain: Badge = {
      tier: 'bronze',
      threshold: 1024,
      unlocked: true,
      claimed: true,
      claimedAt: '2026-01-25T10:00:00.000Z',
      onchainMinted: true,
      tokenId: 1,
      txId: '0xabc',
      mintedAt: '2026-01-25T10:00:00.000Z',
    }
    const silverUnlocked = {
      ...DEFAULT_BADGES.find((b) => b.tier === 'silver')!,
      unlocked: true,
      claimed: false,
    }
    const gold = DEFAULT_BADGES.find((b) => b.tier === 'gold')!
    const elite = DEFAULT_BADGES.find((b) => b.tier === 'elite')!
    const state: BadgeState = [bronzeWithOnchain, silverUnlocked, gold, elite]

    const { badges } = claimBadgeForTier('silver', state, '2026-01-25T12:00:00.000Z')

    const bronze = badges.find((b) => b.tier === 'bronze')
    expect(bronze?.onchainMinted).toBe(true)
    expect(bronze?.tokenId).toBe(1)
    expect(bronze?.txId).toBe('0xabc')
    expect(bronze?.mintedAt).toBe('2026-01-25T10:00:00.000Z')
  })

  it('claimBadgeForTier preserves onchain fields on claimed badge when spread', () => {
    const silverUnlockedWithOnchain: Badge = {
      tier: 'silver',
      threshold: 2048,
      unlocked: true,
      claimed: false,
      onchainMinted: false,
      tokenId: 0,
      txId: '0xprev',
      mintedAt: '2026-01-25T09:00:00.000Z',
    }
    const rest = DEFAULT_BADGES.filter((b) => b.tier !== 'silver')
    const state: BadgeState = [silverUnlockedWithOnchain, ...rest]

    const { badges, claimedBadge } = claimBadgeForTier('silver', state, '2026-01-25T12:00:00.000Z')

    expect(claimedBadge?.claimed).toBe(true)
    expect(claimedBadge?.claimedAt).toBe('2026-01-25T12:00:00.000Z')
    expect(claimedBadge?.onchainMinted).toBe(false)
    expect(claimedBadge?.tokenId).toBe(0)
    expect(claimedBadge?.txId).toBe('0xprev')
    expect(claimedBadge?.mintedAt).toBe('2026-01-25T09:00:00.000Z')

    const silver = badges.find((b) => b.tier === 'silver')
    expect(silver?.onchainMinted).toBe(false)
    expect(silver?.tokenId).toBe(0)
    expect(silver?.txId).toBe('0xprev')
  })
})

describe('isBadge validation with onchain fields', () => {
  it('accepts old badge format without onchain fields (backward compatibility)', () => {
    const oldBadge = {
      tier: 'bronze' as const,
      threshold: 1024,
      unlocked: true,
      claimed: false,
    }
    const { storage } = createStorage({
      [BADGES_STORAGE_KEY]: JSON.stringify({ badges: [oldBadge] }),
    })

    const loaded = loadBadgesFromStorage(storage)
    const bronze = loaded.find((badge) => badge.tier === 'bronze')

    expect(bronze).toBeDefined()
    expect(bronze?.unlocked).toBe(true)
    expect(bronze?.onchainMinted).toBeUndefined()
    expect(bronze?.tokenId).toBeUndefined()
    expect(bronze?.txId).toBeUndefined()
    expect(bronze?.mintedAt).toBeUndefined()
  })

  it('accepts badge with all onchain fields', () => {
    const badgeWithOnchain: Badge = {
      tier: 'silver',
      threshold: 2048,
      unlocked: true,
      claimed: true,
      claimedAt: '2026-01-25T10:00:00.000Z',
      onchainMinted: true,
      tokenId: 1,
      txId: '0x1234567890abcdef',
      mintedAt: '2026-01-25T10:05:00.000Z',
    }
    const { storage } = createStorage({
      [BADGES_STORAGE_KEY]: JSON.stringify({ badges: [badgeWithOnchain] }),
    })

    const loaded = loadBadgesFromStorage(storage)
    const silver = loaded.find((badge) => badge.tier === 'silver')

    expect(silver).toBeDefined()
    expect(silver?.onchainMinted).toBe(true)
    expect(silver?.tokenId).toBe(1)
    expect(silver?.txId).toBe('0x1234567890abcdef')
    expect(silver?.mintedAt).toBe('2026-01-25T10:05:00.000Z')
  })

  it('accepts badge with partial onchain fields', () => {
    const badgePartial: Badge = {
      tier: 'gold',
      threshold: 4096,
      unlocked: true,
      claimed: true,
      onchainMinted: true,
      tokenId: 2,
      // txId and mintedAt missing
    }
    const { storage } = createStorage({
      [BADGES_STORAGE_KEY]: JSON.stringify({ badges: [badgePartial] }),
    })

    const loaded = loadBadgesFromStorage(storage)
    const gold = loaded.find((badge) => badge.tier === 'gold')

    expect(gold).toBeDefined()
    expect(gold?.onchainMinted).toBe(true)
    expect(gold?.tokenId).toBe(2)
    expect(gold?.txId).toBeUndefined()
    expect(gold?.mintedAt).toBeUndefined()
  })

  it('rejects badge with invalid onchainMinted type', () => {
    const invalidBadge = {
      tier: 'bronze' as const,
      threshold: 1024,
      unlocked: true,
      claimed: false,
      onchainMinted: 'true', // string instead of boolean
    }
    const { storage } = createStorage({
      [BADGES_STORAGE_KEY]: JSON.stringify({ badges: [invalidBadge] }),
    })

    const loaded = loadBadgesFromStorage(storage)
    // Invalid badge should be filtered out, so bronze should have default values
    const bronze = loaded.find((badge) => badge.tier === 'bronze')
    expect(bronze?.unlocked).toBe(false) // default, not the invalid badge
  })

  it('rejects badge with invalid tokenId type', () => {
    const invalidBadge = {
      tier: 'silver' as const,
      threshold: 2048,
      unlocked: true,
      claimed: false,
      tokenId: '1', // string instead of number
    }
    const { storage } = createStorage({
      [BADGES_STORAGE_KEY]: JSON.stringify({ badges: [invalidBadge] }),
    })

    const loaded = loadBadgesFromStorage(storage)
    const silver = loaded.find((badge) => badge.tier === 'silver')
    expect(silver?.unlocked).toBe(false) // default, not the invalid badge
  })

  it('rejects badge with invalid txId type', () => {
    const invalidBadge = {
      tier: 'gold' as const,
      threshold: 4096,
      unlocked: true,
      claimed: false,
      txId: 12345, // number instead of string
    }
    const { storage } = createStorage({
      [BADGES_STORAGE_KEY]: JSON.stringify({ badges: [invalidBadge] }),
    })

    const loaded = loadBadgesFromStorage(storage)
    const gold = loaded.find((badge) => badge.tier === 'gold')
    expect(gold?.unlocked).toBe(false) // default, not the invalid badge
  })

  it('rejects badge with invalid mintedAt type', () => {
    const invalidBadge = {
      tier: 'elite' as const,
      threshold: 8192,
      unlocked: true,
      claimed: false,
      mintedAt: 1234567890, // number instead of string
    }
    const { storage } = createStorage({
      [BADGES_STORAGE_KEY]: JSON.stringify({ badges: [invalidBadge] }),
    })

    const loaded = loadBadgesFromStorage(storage)
    const elite = loaded.find((badge) => badge.tier === 'elite')
    expect(elite?.unlocked).toBe(false) // default, not the invalid badge
  })

  it('preserves onchain fields through save/load round-trip', () => {
    const badgeWithOnchain: Badge = {
      tier: 'bronze',
      threshold: 1024,
      unlocked: true,
      claimed: true,
      claimedAt: '2026-01-25T10:00:00.000Z',
      onchainMinted: true,
      tokenId: 42,
      txId: '0xabcdef1234567890',
      mintedAt: '2026-01-25T10:10:00.000Z',
    }
    const { storage } = createStorage()

    saveBadgesToStorage([badgeWithOnchain], storage)
    const loaded = loadBadgesFromStorage(storage)
    const bronze = loaded.find((badge) => badge.tier === 'bronze')

    expect(bronze?.onchainMinted).toBe(true)
    expect(bronze?.tokenId).toBe(42)
    expect(bronze?.txId).toBe('0xabcdef1234567890')
    expect(bronze?.mintedAt).toBe('2026-01-25T10:10:00.000Z')
  })
})

describe('Step 6: Save/Load backward compatibility', () => {
  it('loads old payload without onchain fields and returns valid state', () => {
    const oldPayload = JSON.stringify({
      badges: [
        { tier: 'bronze', threshold: 1024, unlocked: true, claimed: true, claimedAt: '2026-01-25T10:00:00.000Z' },
        { tier: 'silver', threshold: 2048, unlocked: true, claimed: false },
      ],
    })
    const { storage } = createStorage({ [BADGES_STORAGE_KEY]: oldPayload })

    const loaded = loadBadgesFromStorage(storage)
    const bronze = loaded.find((b) => b.tier === 'bronze')
    const silver = loaded.find((b) => b.tier === 'silver')

    expect(bronze).toBeDefined()
    expect(bronze?.unlocked).toBe(true)
    expect(bronze?.claimed).toBe(true)
    expect(bronze?.onchainMinted).toBeUndefined()
    expect(bronze?.tokenId).toBeUndefined()
    expect(bronze?.txId).toBeUndefined()
    expect(bronze?.mintedAt).toBeUndefined()

    expect(silver).toBeDefined()
    expect(silver?.unlocked).toBe(true)
    expect(silver?.claimed).toBe(false)
  })

  it('handles mixed state: some badges with onchain, some without', () => {
    const mixedState: BadgeState = [
      {
        tier: 'bronze',
        threshold: 1024,
        unlocked: true,
        claimed: true,
        claimedAt: '2026-01-25T10:00:00.000Z',
        onchainMinted: true,
        tokenId: 1,
        txId: '0xabc',
        mintedAt: '2026-01-25T10:00:00.000Z',
      },
      {
        tier: 'silver',
        threshold: 2048,
        unlocked: true,
        claimed: false,
      },
    ]
    const { storage } = createStorage()

    saveBadgesToStorage(mixedState, storage)
    const loaded = loadBadgesFromStorage(storage)

    const bronze = loaded.find((b) => b.tier === 'bronze')
    const silver = loaded.find((b) => b.tier === 'silver')

    expect(bronze?.onchainMinted).toBe(true)
    expect(bronze?.tokenId).toBe(1)
    expect(silver?.onchainMinted).toBeUndefined()
    expect(silver?.tokenId).toBeUndefined()
  })

  it('handles multiple save/load cycles preserving onchain fields', () => {
    const badgeWithOnchain: Badge = {
      tier: 'gold',
      threshold: 4096,
      unlocked: true,
      claimed: true,
      claimedAt: '2026-01-25T10:00:00.000Z',
      onchainMinted: true,
      tokenId: 99,
      txId: '0xmultiple',
      mintedAt: '2026-01-25T10:00:00.000Z',
    }
    const { storage } = createStorage()

    // First save/load
    saveBadgesToStorage([badgeWithOnchain], storage)
    let loaded = loadBadgesFromStorage(storage)
    let gold = loaded.find((b) => b.tier === 'gold')
    expect(gold?.tokenId).toBe(99)

    // Modify and save again
    const modified = loaded.map((b) =>
      b.tier === 'gold' ? { ...b, tokenId: 100, txId: '0xmodified' } : b
    )
    saveBadgesToStorage(modified, storage)

    // Second load
    loaded = loadBadgesFromStorage(storage)
    gold = loaded.find((b) => b.tier === 'gold')
    expect(gold?.tokenId).toBe(100)
    expect(gold?.txId).toBe('0xmodified')
    expect(gold?.onchainMinted).toBe(true)
  })

  it('migrates legacy key without onchain fields correctly', () => {
    const legacyPayload = JSON.stringify([
      { tier: 'elite', threshold: 8192, unlocked: true, claimed: true, claimedAt: '2026-01-25T09:00:00.000Z' },
    ])
    const { storage, getRaw } = createStorage({ [LEGACY_BADGES_STORAGE_KEY]: legacyPayload })

    const loaded = loadBadgesFromStorage(storage)
    const elite = loaded.find((b) => b.tier === 'elite')

    expect(elite?.unlocked).toBe(true)
    expect(elite?.claimed).toBe(true)
    expect(elite?.onchainMinted).toBeUndefined()
    expect(getRaw(BADGES_STORAGE_KEY)).not.toBeNull()
  })

  it('migrates legacy key with onchain fields if present', () => {
    const legacyWithOnchain = JSON.stringify([
      {
        tier: 'bronze',
        threshold: 1024,
        unlocked: true,
        claimed: true,
        claimedAt: '2026-01-25T10:00:00.000Z',
        onchainMinted: true,
        tokenId: 50,
        txId: '0xlegacy',
        mintedAt: '2026-01-25T10:00:00.000Z',
      },
    ])
    const { storage, getRaw } = createStorage({ [LEGACY_BADGES_STORAGE_KEY]: legacyWithOnchain })

    const loaded = loadBadgesFromStorage(storage)
    const bronze = loaded.find((b) => b.tier === 'bronze')

    expect(bronze?.onchainMinted).toBe(true)
    expect(bronze?.tokenId).toBe(50)
    expect(bronze?.txId).toBe('0xlegacy')
    expect(getRaw(BADGES_STORAGE_KEY)).not.toBeNull()
  })
})

describe('areBadgeStatesEqual with onchain fields', () => {
  it('returns true for identical states without onchain fields', () => {
    const a = normalizeBadgeState(DEFAULT_BADGES)
    const b = normalizeBadgeState(DEFAULT_BADGES)
    expect(areBadgeStatesEqual(a, b)).toBe(true)
  })

  it('returns true for identical states with onchain fields', () => {
    const withOnchain: BadgeState = DEFAULT_BADGES.map((b) =>
      b.tier === 'bronze'
        ? { ...b, unlocked: true, claimed: true, onchainMinted: true, tokenId: 1, txId: '0x', mintedAt: '2026-01-25T00:00:00.000Z' }
        : b
    )
    const a = normalizeBadgeState(withOnchain)
    const b = normalizeBadgeState(withOnchain)
    expect(areBadgeStatesEqual(a, b)).toBe(true)
  })

  it('returns false when onchain fields differ', () => {
    const base: BadgeState = DEFAULT_BADGES.map((b) =>
      b.tier === 'bronze' ? { ...b, unlocked: true, claimed: true } : b
    )
    const withMint: BadgeState = base.map((b) =>
      b.tier === 'bronze' ? { ...b, onchainMinted: true, tokenId: 1, txId: '0x', mintedAt: '2026-01-25T00:00:00.000Z' } : b
    )
    const a = normalizeBadgeState(base)
    const b = normalizeBadgeState(withMint)
    expect(areBadgeStatesEqual(a, b)).toBe(false)
  })

  it('returns false when one has onchain fields and the other does not', () => {
    const noOnchain = normalizeBadgeState(
      DEFAULT_BADGES.map((b) => (b.tier === 'bronze' ? { ...b, unlocked: true, claimed: true } : b))
    )
    const withOnchain = normalizeBadgeState(
      DEFAULT_BADGES.map((b) =>
        b.tier === 'bronze'
          ? { ...b, unlocked: true, claimed: true, onchainMinted: true, tokenId: 1, txId: '0x', mintedAt: '2026-01-25T00:00:00.000Z' }
          : b
      )
    )
    expect(areBadgeStatesEqual(noOnchain, withOnchain)).toBe(false)
  })

  it('returns false when tokenId differs', () => {
    const base: Badge = {
      tier: 'silver',
      threshold: 2048,
      unlocked: true,
      claimed: true,
      onchainMinted: true,
      tokenId: 1,
      txId: '0x',
      mintedAt: '2026-01-25T00:00:00.000Z',
    }
    const a = normalizeBadgeState([base])
    const b = normalizeBadgeState([{ ...base, tokenId: 2 }])
    expect(areBadgeStatesEqual(a, b)).toBe(false)
  })
})

describe('Step 7: Badge sync helpers', () => {
  describe('badgeNeedsMinting', () => {
    it('returns true when claimed but not onchain minted', () => {
      const badge: Badge = {
        tier: 'bronze',
        threshold: 1024,
        unlocked: true,
        claimed: true,
        claimedAt: '2026-01-25T10:00:00.000Z',
      }
      expect(badgeNeedsMinting(badge)).toBe(true)
    })

    it('returns false when claimed and onchain minted', () => {
      const badge: Badge = {
        tier: 'bronze',
        threshold: 1024,
        unlocked: true,
        claimed: true,
        claimedAt: '2026-01-25T10:00:00.000Z',
        onchainMinted: true,
        tokenId: 1,
        txId: '0x',
        mintedAt: '2026-01-25T10:05:00.000Z',
      }
      expect(badgeNeedsMinting(badge)).toBe(false)
    })

    it('returns false when unlocked only (not claimed)', () => {
      const badge: Badge = {
        tier: 'silver',
        threshold: 2048,
        unlocked: true,
        claimed: false,
      }
      expect(badgeNeedsMinting(badge)).toBe(false)
    })

    it('returns false when locked', () => {
      const badge: Badge = {
        tier: 'gold',
        threshold: 4096,
        unlocked: false,
        claimed: false,
      }
      expect(badgeNeedsMinting(badge)).toBe(false)
    })
  })

  describe('updateBadgeWithOnchainData', () => {
    it('returns badge with onchain fields set and others preserved', () => {
      const badge: Badge = {
        tier: 'bronze',
        threshold: 1024,
        unlocked: true,
        claimed: true,
        claimedAt: '2026-01-25T10:00:00.000Z',
      }
      const data = { tokenId: 42, txId: '0xabc', mintedAt: '2026-01-25T10:10:00.000Z' }
      const updated = updateBadgeWithOnchainData(badge, data)

      expect(updated.onchainMinted).toBe(true)
      expect(updated.tokenId).toBe(42)
      expect(updated.txId).toBe('0xabc')
      expect(updated.mintedAt).toBe('2026-01-25T10:10:00.000Z')
      expect(updated.tier).toBe('bronze')
      expect(updated.threshold).toBe(1024)
      expect(updated.unlocked).toBe(true)
      expect(updated.claimed).toBe(true)
      expect(updated.claimedAt).toBe('2026-01-25T10:00:00.000Z')
    })

    it('preserves existing onchain fields when overwriting', () => {
      const badge: Badge = {
        tier: 'silver',
        threshold: 2048,
        unlocked: true,
        claimed: true,
        onchainMinted: false,
        tokenId: 0,
      }
      const data = { tokenId: 1, txId: '0xnew', mintedAt: '2026-01-25T11:00:00.000Z' }
      const updated = updateBadgeWithOnchainData(badge, data)

      expect(updated.onchainMinted).toBe(true)
      expect(updated.tokenId).toBe(1)
      expect(updated.txId).toBe('0xnew')
      expect(updated.mintedAt).toBe('2026-01-25T11:00:00.000Z')
    })
  })

  describe('mergeOffchainAndOnchainBadges', () => {
    it('merges onchain data into offchain badges by tier', () => {
      const offchain = normalizeBadgeState(
        DEFAULT_BADGES.map((b) =>
          b.tier === 'bronze' ? { ...b, unlocked: true, claimed: true } : b
        )
      )
      const onchainByTier = new Map<BadgeTier, { tokenId: number; txId?: string; mintedAt?: string }>([
        ['bronze', { tokenId: 1, txId: '0xbronze', mintedAt: '2026-01-25T10:00:00.000Z' }],
      ])

      const merged = mergeOffchainAndOnchainBadges(offchain, onchainByTier)
      const bronze = merged.find((b) => b.tier === 'bronze')
      const silver = merged.find((b) => b.tier === 'silver')

      expect(bronze?.onchainMinted).toBe(true)
      expect(bronze?.tokenId).toBe(1)
      expect(bronze?.txId).toBe('0xbronze')
      expect(bronze?.mintedAt).toBe('2026-01-25T10:00:00.000Z')
      expect(silver?.onchainMinted).toBeUndefined()
      expect(silver?.tokenId).toBeUndefined()
    })

    it('leaves badges unchanged when no onchain data for tier', () => {
      const offchain = normalizeBadgeState(DEFAULT_BADGES)
      const onchainByTier = new Map<BadgeTier, { tokenId: number; txId?: string; mintedAt?: string }>()

      const merged = mergeOffchainAndOnchainBadges(offchain, onchainByTier)
      expect(areBadgeStatesEqual(merged, offchain)).toBe(true)
    })

    it('handles partial onchain data (tokenId only)', () => {
      const offchain = normalizeBadgeState(
        DEFAULT_BADGES.map((b) =>
          b.tier === 'gold' ? { ...b, unlocked: true, claimed: true } : b
        )
      )
      const onchainByTier = new Map<BadgeTier, { tokenId: number; txId?: string; mintedAt?: string }>([
        ['gold', { tokenId: 99 }],
      ])

      const merged = mergeOffchainAndOnchainBadges(offchain, onchainByTier)
      const gold = merged.find((b) => b.tier === 'gold')

      expect(gold?.onchainMinted).toBe(true)
      expect(gold?.tokenId).toBe(99)
      expect(gold?.txId).toBeUndefined()
      expect(gold?.mintedAt).toBeUndefined()
    })
  })
})

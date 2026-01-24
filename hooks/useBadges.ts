'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BadgeState, BadgeTier } from '@/lib/game/types'
import {
  createDefaultBadges,
  emitBadgeUnlocked,
  loadBadgesFromStorage,
  saveBadgesToStorage,
  unlockBadgesForScore,
} from '@/lib/badges'

export function useBadges() {
  const [badges, setBadges] = useState<BadgeState>(() => {
    if (typeof window === 'undefined') {
      return createDefaultBadges()
    }
    return loadBadgesFromStorage()
  })
  const badgesRef = useRef(badges)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = loadBadgesFromStorage()
    setBadges(stored)
    saveBadgesToStorage(stored)
  }, [])

  useEffect(() => {
    badgesRef.current = badges
  }, [badges])

  const unlockBadges = useCallback(
    (score: number): { newlyUnlocked: BadgeTier[]; badges: BadgeState } => {
      const { badges: updated, didChange, newlyUnlocked } = unlockBadgesForScore(
        score,
        badgesRef.current
      )

      let nextBadges = badgesRef.current

      if (didChange) {
        nextBadges = updated
        badgesRef.current = updated
        setBadges(updated)
        saveBadgesToStorage(updated)
      }

      if (newlyUnlocked.length > 0) {
        emitBadgeUnlocked({ tiers: newlyUnlocked, score })
      }

      return { newlyUnlocked, badges: nextBadges }
    },
    []
  )

  const replaceBadges = useCallback((nextBadges: BadgeState) => {
    setBadges(nextBadges)
    saveBadgesToStorage(nextBadges)
  }, [])


  return {
    badges,
    unlockBadges,
    replaceBadges,
  }
}

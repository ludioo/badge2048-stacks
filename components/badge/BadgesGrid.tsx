'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useBadges } from '@/hooks/useBadges'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { BadgeCard } from '@/components/badge/BadgeCard'
import { loadHighScore } from '@/lib/highScore'
import {
  getBadgeOwnershipCache,
  setBadgeOwnershipCache,
} from '@/lib/badgeOwnershipCache'

export function BadgesGrid() {
  const { badges } = useBadges()
  const { isAuthenticated, address } = useStacksWallet()

  // Ownership dibaca lewat backend /api/badge-ownership (mainnet/testnet dari env).
  const [onchainByTier, setOnchainByTier] = useState<Record<string, number | null> | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  // Current high score as source of truth for "unlocked" — avoids showing claimable from stale localStorage (e.g. testnet).
  const [highScore, setHighScore] = useState(0)
  useEffect(() => {
    setHighScore(loadHighScore())
    const onFocus = () => setHighScore(loadHighScore())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !address) {
      setOnchainByTier(null)
      return
    }
    const cached = getBadgeOwnershipCache(address)
    if (cached !== null) {
      setOnchainByTier(cached)
      return
    }
    let cancelled = false
    setIsSyncing(true)
    const run = async () => {
      try {
        const res = await fetch(
          `/api/badge-ownership?address=${encodeURIComponent(address)}`
        )
        if (cancelled) return
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || `HTTP ${res.status}`)
        }
        const json = await res.json()
        const data = (json?.data ?? {}) as Record<string, number | null>
        if (!cancelled) {
          setBadgeOwnershipCache(address, data)
          setOnchainByTier(data)
          // Diagnostic: verifikasi API pakai mainnet/testnet (cek header response)
          const apiNetwork = res.headers.get('X-Stacks-Network')
          const apiContract = res.headers.get('X-Contract-Address')
          console.log('[BadgesGrid] API badge-ownership response headers', {
            'X-Stacks-Network': apiNetwork,
            'X-Contract-Address': apiContract,
          })
        }
      } catch {
        if (!cancelled) setOnchainByTier(null)
      } finally {
        if (!cancelled) setIsSyncing(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [isAuthenticated, address])

  // effectiveBadges:
  // - Wallet disconnected → all locked (no stale localStorage).
  // - Wallet connected but syncing (onchainByTier === null) → tampilkan semua locked; jangan pakai unlocked/claimed dari localStorage.
  // - Wallet connected dan sync selesai → owned/claimed/onchainMinted dari onchainByTier; unlocked hanya dari chain (non-owned = locked).
  const effectiveBadges = useMemo(() => {
    if (!isAuthenticated || !address) {
      return badges.map((b) => ({ ...b, unlocked: false, claimed: false }))
    }
    if (onchainByTier === null) {
      return badges.map((b) => ({
        ...b,
        onchainMinted: false,
        claimed: false,
        unlocked: false,
      }))
    }
    return badges.map((b) => {
      const tokenId = onchainByTier[b.tier]
      if (tokenId != null) {
        return { ...b, onchainMinted: true, claimed: true, tokenId, unlocked: true }
      }
      // Not minted onchain: unlocked from current high score only (mainnet/testnet consistency).
      // Avoids showing claimable from stale localStorage (e.g. old testnet play).
      return {
        ...b,
        onchainMinted: false,
        claimed: false,
        tokenId: undefined,
        unlocked: highScore >= b.threshold,
      }
    })
  }, [badges, isAuthenticated, address, onchainByTier, highScore])

  const sortedBadges = useMemo(
    () => [...effectiveBadges].sort((left, right) => left.threshold - right.threshold),
    [effectiveBadges]
  )

  const claimedCount = effectiveBadges.filter((badge) => badge.claimed).length
  const claimableCount = effectiveBadges.filter(
    (badge) => badge.unlocked && !badge.claimed
  ).length
  const lockedCount = effectiveBadges.length - claimedCount - claimableCount
  const totalCount = effectiveBadges.length
  const unlockedCount = effectiveBadges.filter((badge) => badge.unlocked).length
  const progress =
    totalCount === 0 ? 0 : Math.round((unlockedCount / totalCount) * 100)

  // Diagnostic: bantu verifikasi mainnet vs high score (bisa dihapus setelah fix dikonfirmasi)
  const networkFromEnv =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_STACKS_NETWORK
      ? process.env.NEXT_PUBLIC_STACKS_NETWORK
      : '(not set)'
  useEffect(() => {
    console.log('[BadgesGrid] diagnostic', {
      network: networkFromEnv,
      highScore,
      loadHighScoreNow: loadHighScore(),
      claimableCount,
      unlockedCount,
      onchainByTierNull: onchainByTier === null,
    })
  }, [networkFromEnv, highScore, claimableCount, unlockedCount, onchainByTier])

  return (
    <div className="space-y-6">
      {isAuthenticated && address && isSyncing && (
        <div className="rounded-lg border border-[#FB6331] bg-[#FD9E7F]/20 p-3 text-sm text-[#F4622F]">
          <p className="font-medium">Checking badge status with blockchain…</p>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Unlocked progress</p>
            <p className="text-lg font-semibold text-slate-900">
              {unlockedCount} of {totalCount} badges unlocked
            </p>
          </div>
          {claimableCount > 0 ? (
            <Link
              href="/claim"
              className="rounded-full border border-[#FB6331] bg-[#FD9E7F]/20 px-4 py-2.5 min-h-[44px] inline-flex items-center text-xs font-semibold uppercase tracking-wide text-[#F4622F]"
            >
              Go to Claim
            </Link>
          ) : (
            <span className="text-xs text-slate-500">No badges ready to claim</span>
          )}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-[#F4622F] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1">
          Owned: {claimedCount}
        </div>
        <div className="rounded-full border border-[#FB6331] bg-[#FD9E7F]/20 px-3 py-1 text-[#F4622F]">
          Claimable: {claimableCount}
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500">
          Locked: {lockedCount}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sortedBadges.map((badge) => (
          <BadgeCard key={badge.tier} badge={badge} />
        ))}
      </div>
    </div>
  )
}

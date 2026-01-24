'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useBadges } from '@/hooks/useBadges'
import { BadgeCard } from '@/components/badge/BadgeCard'

export function BadgesGrid() {
  const { badges } = useBadges()

  const sortedBadges = useMemo(
    () => [...badges].sort((left, right) => left.threshold - right.threshold),
    [badges]
  )

  const claimedCount = badges.filter((badge) => badge.claimed).length
  const claimableCount = badges.filter((badge) => badge.unlocked && !badge.claimed).length
  const lockedCount = badges.length - claimedCount - claimableCount
  const totalCount = badges.length
  const unlockedCount = badges.filter((badge) => badge.unlocked).length
  const progress = totalCount === 0 ? 0 : Math.round((unlockedCount / totalCount) * 100)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Unlocked progress</p>
            <p className="text-lg font-semibold text-slate-900">
              {unlockedCount} of {totalCount} badges unlocked
            </p>
          </div>
          {claimableCount > 0 ? (
            <Link
              href="/claim"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700"
            >
              Go to Claim
            </Link>
          ) : (
            <span className="text-xs text-slate-500">No badges ready to claim</span>
          )}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1">
          Owned: {claimedCount}
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
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

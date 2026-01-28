'use client'

import Link from 'next/link'
import { useLeaderboardRank } from '@/hooks/useLeaderboardRank'

interface MyRankCardProps {
  address: string | undefined
}

export function MyRankCard({ address }: MyRankCardProps) {
  const { data, status, error } = useLeaderboardRank(address)

  if (!address) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
        <p>Connect your wallet to see your rank.</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500">
        <p>Loading your rank…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
        <p>{error ?? 'Failed to load rank'}</p>
        <p className="mt-1 text-xs">Play a game and submit your score to appear on the leaderboard.</p>
      </div>
    )
  }

  if (status === 'success' && data) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Your rank</p>
            <p className="text-lg font-bold text-emerald-900">
              #{data.rank} of {data.total}
            </p>
            <p className="text-sm text-emerald-800">Best score: {data.score.toLocaleString()}</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

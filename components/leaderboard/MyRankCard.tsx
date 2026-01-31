'use client'

import Link from 'next/link'
import { useLeaderboardRank } from '@/hooks/useLeaderboardRank'

interface MyRankCardProps {
  address: string | undefined
}

export function MyRankCard({ address }: MyRankCardProps) {
  const { data, status, error } = useLeaderboardRank(address)

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-[#FD9E7F] bg-white px-4 py-3 text-center text-sm text-[#4B5563]">
        <p>Loading your rank…</p>
      </div>
    )
  }

  // Don't show error state - if address is not on leaderboard, it will be visible in Top Score section
  if (status === 'error') {
    return null
  }

  if (status === 'success' && data) {
    return (
      <div className="rounded-xl border border-[#FD9E7F]/50 bg-[#FD9E7F]/15 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#374151]">Your rank</p>
            <p className="text-lg font-bold text-[#171717]">
              #{data.rank} of {data.total}
            </p>
            <p className="text-sm text-[#374151]">Best score: {data.score.toLocaleString()}</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

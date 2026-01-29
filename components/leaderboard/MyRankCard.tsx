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
      <div className="rounded-xl border border-[#FD9E7F] bg-[#FD9E7F]/10 px-4 py-3 text-center text-sm text-[#4B5563]">
        <p>Connect your wallet to see your rank.</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-[#FD9E7F] bg-white px-4 py-3 text-center text-sm text-[#4B5563]">
        <p>Loading your rank…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-[#FB6331] bg-[#FD9E7F]/20 px-4 py-3 text-center text-sm text-[#E8552A]">
        <p>{error ?? 'Failed to load rank'}</p>
        <p className="mt-1 text-xs">Play a game and submit your score to appear on the leaderboard.</p>
      </div>
    )
  }

  if (status === 'success' && data) {
    return (
      <div className="rounded-xl border border-[#FB6331] bg-[#FD9E7F]/20 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F4622F]">Your rank</p>
            <p className="text-lg font-bold text-[#E8552A]">
              #{data.rank} of {data.total}
            </p>
            <p className="text-sm text-[#F4622F]">Best score: {data.score.toLocaleString()}</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

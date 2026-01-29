'use client'

import Link from 'next/link'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { MyRankCard } from '@/components/leaderboard/MyRankCard'

export function LeaderboardView() {
  const { data, status, error, refetch } = useLeaderboard(50, 0)
  const { address } = useStacksWallet()

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F4622F]">Leaderboard</h1>
        <p className="mt-1 text-sm text-[#4B5563]">
          Top scores by wallet. Connect your wallet and play to submit your score.
        </p>
      </div>

      <div className="space-y-6">
        <MyRankCard address={address} />

        <div id="top-scores">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#4B5563]">
            Top scores
          </h2>
          {status === 'loading' && (
            <div className="flex items-center justify-center rounded-xl border border-[#FD9E7F] bg-white py-12 text-[#4B5563]">
              Loading leaderboard…
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-xl border border-[#FB6331] bg-[#FD9E7F]/20 px-4 py-4 text-[#E8552A]">
              <p className="font-medium">{error ?? 'Failed to load leaderboard'}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}
          {status === 'success' && data && (
            <LeaderboardTable entries={data.entries} total={data.total} />
          )}
        </div>

        <p className="text-center text-xs text-[#6B7280]">
          <Link href="/play" className="underline hover:no-underline">
            Play
          </Link>
          {' · '}
          <Link href="/leaderboard" className="underline hover:no-underline">
            Leaderboard
          </Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import type { LeaderboardEntry } from '@/lib/leaderboard/types'

function shortenAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  total: number
}

export function LeaderboardTable({ entries, total }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-[#FD9E7F] bg-white px-6 py-10 text-center text-[#4B5563]">
        <p className="font-medium">No entries yet</p>
        <p className="mt-1 text-sm">Play a game and connect your wallet to submit your score.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#FD9E7F] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[260px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#FD9E7F] bg-[#FD9E7F]/10">
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-[#F4622F]">Rank</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-[#F4622F]">Address</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-[#F4622F] text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.address}
                className="border-b border-[#FD9E7F]/20 last:border-b-0 hover:bg-[#FD9E7F]/5"
              >
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-[#F4622F]">#{e.rank}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono text-[#4B5563]" title={e.address}>
                  {shortenAddress(e.address)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-semibold text-[#E8552A]">
                  {e.score.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > entries.length && (
        <div className="border-t border-[#FD9E7F]/20 px-4 py-2 text-xs text-[#6B7280]">
          Showing {entries.length} of {total}
        </div>
      )}
    </div>
  )
}

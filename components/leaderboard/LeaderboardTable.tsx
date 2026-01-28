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
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
        <p className="font-medium">No entries yet</p>
        <p className="mt-1 text-sm">Play a game and connect your wallet to submit your score.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[260px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-slate-700">Rank</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-slate-700">Address</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-slate-700 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.address}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
              >
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-slate-900">#{e.rank}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono text-slate-600" title={e.address}>
                  {shortenAddress(e.address)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-semibold text-slate-800">
                  {e.score.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > entries.length && (
        <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          Showing {entries.length} of {total}
        </div>
      )}
    </div>
  )
}

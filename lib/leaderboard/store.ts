/**
 * In-memory leaderboard store.
 * No localStorage; data is lost on server restart (MVP).
 * Submit requires wallet; if not connected, score is not persisted (player's risk).
 */

import type { LeaderboardEntry } from './types'

const data = new Map<string, { score: number; updatedAt: string }>()

export function submitScore(address: string, score: number): { updated: boolean; bestScore: number } {
  const now = new Date().toISOString()
  const existing = data.get(address)
  if (!existing) {
    data.set(address, { score, updatedAt: now })
    return { updated: true, bestScore: score }
  }
  if (score > existing.score) {
    data.set(address, { score, updatedAt: now })
    return { updated: true, bestScore: score }
  }
  return { updated: false, bestScore: existing.score }
}

export function getTop(limit: number, offset: number): { entries: LeaderboardEntry[]; total: number } {
  const all = Array.from(data.entries())
    .map(([address, { score, updatedAt }]) => ({ address, score, updatedAt }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    })
  const total = all.length
  const slice = all.slice(offset, offset + limit)
  const entries: LeaderboardEntry[] = slice.map((row, i) => ({
    rank: offset + i + 1,
    address: row.address,
    score: row.score,
    updatedAt: row.updatedAt,
  }))
  return { entries, total }
}

export function getRank(address: string): { rank: number; address: string; score: number; total: number } | null {
  const entry = data.get(address)
  if (!entry) return null
  const all = Array.from(data.entries())
    .map(([addr, { score, updatedAt }]) => ({ address: addr, score, updatedAt }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    })
  const idx = all.findIndex((r) => r.address === address)
  if (idx === -1) return null
  return {
    rank: idx + 1,
    address,
    score: entry.score,
    total: all.length,
  }
}

/**
 * Clear the in-memory store. For testing only; do not use in production.
 */
export function _clearLeaderboardForTesting(): void {
  data.clear()
}

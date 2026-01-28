/**
 * Leaderboard domain types.
 * Leaderboard is 100% off-chain; no localStorage for leaderboard data.
 */

export interface LeaderboardEntry {
  rank: number
  address: string
  score: number
  updatedAt: string
}

export interface LeaderboardListResponse {
  entries: LeaderboardEntry[]
  total: number
}

export interface LeaderboardRankResponse {
  rank: number
  address: string
  score: number
  total: number
}

export interface LeaderboardSubmitResponse {
  updated: boolean
  bestScore: number
}

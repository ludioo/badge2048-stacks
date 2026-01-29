/**
 * Leaderboard domain types.
 * 
 * Hybrid architecture:
 * - Onchain: High scores stored via contract (source of truth)
 * - Offchain: Leaderboard computed from cached data for performance
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

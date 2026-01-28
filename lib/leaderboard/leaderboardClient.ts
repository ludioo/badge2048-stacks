/**
 * Client for leaderboard API. All reads go through backend /api/leaderboard.
 * No localStorage; submit requires wallet. Data is server in-memory only.
 */

import type {
  LeaderboardListResponse,
  LeaderboardRankResponse,
  LeaderboardSubmitResponse,
} from './types'

async function parseError(res: Response): Promise<string> {
  const j = await res.json().catch(() => ({}))
  if (j?.error && typeof j.error === 'object' && typeof j.error.message === 'string') {
    return j.error.message
  }
  if (typeof j?.error === 'string') return j.error
  return `HTTP ${res.status}`
}

export async function fetchLeaderboard(
  limit = 50,
  offset = 0
): Promise<LeaderboardListResponse> {
  const u = new URL('/api/leaderboard', typeof window !== 'undefined' ? window.location.origin : '')
  u.searchParams.set('limit', String(limit))
  u.searchParams.set('offset', String(offset))
  const res = await fetch(u.toString())
  if (!res.ok) throw new Error(await parseError(res))
  const json: { data?: LeaderboardListResponse } = await res.json()
  if (!json?.data || !Array.isArray(json.data.entries)) {
    throw new Error('Invalid response from leaderboard API')
  }
  return json.data
}

export async function fetchRank(address: string): Promise<LeaderboardRankResponse> {
  if (!address || !address.trim()) throw new Error('Address is required')
  const u = new URL('/api/leaderboard/rank', typeof window !== 'undefined' ? window.location.origin : '')
  u.searchParams.set('address', address.trim())
  const res = await fetch(u.toString())
  if (res.status === 404) throw new Error('Address not on leaderboard')
  if (!res.ok) throw new Error(await parseError(res))
  const json: { data?: LeaderboardRankResponse } = await res.json()
  if (!json?.data || typeof json.data.rank !== 'number') {
    throw new Error('Invalid response from leaderboard rank API')
  }
  return json.data
}

export async function submitScore(
  address: string,
  score: number
): Promise<LeaderboardSubmitResponse> {
  if (!address || !address.trim()) throw new Error('Address is required')
  const res = await fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address.trim(), score }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const json: { data?: LeaderboardSubmitResponse } = await res.json()
  if (!json?.data || typeof json.data.updated !== 'boolean') {
    throw new Error('Invalid response from leaderboard submit API')
  }
  return json.data
}

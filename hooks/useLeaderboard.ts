'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchLeaderboard } from '@/lib/leaderboard/leaderboardClient'
import type { LeaderboardEntry } from '@/lib/leaderboard/types'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function useLeaderboard(limit = 50, offset = 0) {
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<{ entries: LeaderboardEntry[]; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetchLeaderboard(limit, offset)
      setData(res)
      setStatus('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leaderboard')
      setStatus('error')
    }
  }, [limit, offset])

  useEffect(() => {
    load()
  }, [load])

  return { data, status, error, refetch: load }
}

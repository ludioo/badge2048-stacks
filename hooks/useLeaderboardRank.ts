'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchRank } from '@/lib/leaderboard/leaderboardClient'
import type { LeaderboardRankResponse } from '@/lib/leaderboard/types'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function useLeaderboardRank(address: string | undefined) {
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<LeaderboardRankResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!address || !address.trim()) {
      setStatus('idle')
      setData(null)
      setError(null)
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const res = await fetchRank(address)
      setData(res)
      setStatus('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rank')
      setData(null)
      setStatus('error')
    }
  }, [address])

  useEffect(() => {
    load()
  }, [load])

  return { data, status, error, refetch: load }
}

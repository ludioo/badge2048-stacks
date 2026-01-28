'use client'

import { useCallback, useState } from 'react'
import { submitScore as submitScoreApi } from '@/lib/leaderboard/leaderboardClient'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function useSubmitScore() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const submitScore = useCallback(async (address: string, score: number): Promise<void> => {
    setStatus('submitting')
    setError(null)
    try {
      await submitScoreApi(address, score)
      setStatus('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit score')
      setStatus('error')
      throw e
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  return { submitScore, status, error, reset }
}

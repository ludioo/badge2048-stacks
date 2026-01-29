'use client'

import { useCallback, useState } from 'react'
import { submitScore as submitScoreApi } from '@/lib/leaderboard/leaderboardClient'
import { useBadgeContract } from '@/hooks/useBadgeContract'

type Status = 'idle' | 'submitting' | 'submitting-onchain' | 'success' | 'error'

export interface SubmitScoreOptions {
  /**
   * If true, submit score onchain via update-high-score contract call.
   * If false, only submit to offchain backend (legacy behavior).
   * @default true
   */
  submitOnchain?: boolean
  /**
   * Callback when onchain transaction finishes successfully
   */
  onOnchainSuccess?: (txId: string) => void
  /**
   * Callback when onchain transaction is cancelled
   */
  onOnchainCancel?: () => void
}

export function useSubmitScore() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const { updateHighScore } = useBadgeContract()

  const submitScore = useCallback(
    async (address: string, score: number, options?: SubmitScoreOptions): Promise<void> => {
      const { submitOnchain = true, onOnchainSuccess, onOnchainCancel } = options || {}
      setStatus('submitting')
      setError(null)

      try {
        // Step 1: Submit onchain if enabled (hybrid approach)
        if (submitOnchain) {
          setStatus('submitting-onchain')
          const onchainResult = await updateHighScore({
            score,
            onFinish: (data) => {
              const txId = data.txId
              onOnchainSuccess?.(txId)
              // After onchain success, submit to backend for leaderboard sync
              // Backend will sync with onchain data, but we also submit here for immediate update
              submitScoreApi(address, score).catch((e) => {
                console.warn('Failed to submit to backend after onchain success:', e)
                // Don't throw - onchain is source of truth
              })
            },
            onCancel: () => {
              onOnchainCancel?.()
              setStatus('error')
              setError('Transaction cancelled by user')
              throw new Error('Transaction cancelled')
            },
          })

          if (onchainResult.status === 'error') {
            setStatus('error')
            setError(onchainResult.error || 'Failed to submit score onchain')
            throw new Error(onchainResult.error || 'Failed to submit score onchain')
          }

          // If onchain succeeded, also submit to backend (non-blocking)
          // Backend will eventually sync with onchain, but this gives immediate feedback
          try {
            await submitScoreApi(address, score)
          } catch (e) {
            // Non-fatal: onchain is source of truth, backend will sync later
            console.warn('Backend submit failed, but onchain succeeded:', e)
          }
        } else {
          // Legacy: only offchain submission
          await submitScoreApi(address, score)
        }

        setStatus('success')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit score')
        setStatus('error')
        throw e
      }
    },
    [updateHighScore]
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  return { submitScore, status, error, reset }
}

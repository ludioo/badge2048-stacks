/**
 * Onchain leaderboard sync service.
 * Syncs high scores from onchain contract to offchain leaderboard store.
 * 
 * Hybrid approach: Onchain is source of truth for scores, offchain computes leaderboard.
 */

import { contractConfig, isTestnet, apiUrl } from '@/lib/stacks/config'
import { CONTRACT_FUNCTIONS } from '@/lib/stacks/constants'
import type { LeaderboardEntry } from './types'

interface OnchainHighScore {
  address: string
  score: number
}

/**
 * Fetch high score for a single address from onchain contract
 */
export async function fetchOnchainHighScore(address: string): Promise<number> {
  try {
    const response = await fetch(`${apiUrl}/v2/contracts/call-read/${contractConfig.address.split('.')[0]}/${contractConfig.name}/${CONTRACT_FUNCTIONS.GET_HIGH_SCORE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: address,
        arguments: [
          {
            type: 'principal',
            value: address,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch onchain high score: ${response.statusText}`)
    }

    const data = await response.json()
    // Parse Clarity response: { value: { value: number } }
    const score = data.result?.value?.value || 0
    return Number(score)
  } catch (error) {
    console.error('Error fetching onchain high score:', error)
    throw error
  }
}

/**
 * Fetch all high scores from onchain via events/indexer.
 * 
 * Note: This is a simplified version. In production, you'd use:
 * - An indexer service (Hiro API, talent.app, etc.)
 * - Event logs from high-score-updated events
 * - Or a backend service that maintains a cache
 * 
 * For now, we'll query individual addresses that we know about.
 * A proper implementation would index events.
 */
export async function fetchAllOnchainHighScores(
  knownAddresses: string[]
): Promise<OnchainHighScore[]> {
  const results: OnchainHighScore[] = []

  // Fetch scores for known addresses in parallel (with limit to avoid rate limits)
  const batchSize = 10
  for (let i = 0; i < knownAddresses.length; i += batchSize) {
    const batch = knownAddresses.slice(i, i + batchSize)
    const promises = batch.map(async (address) => {
      try {
        const score = await fetchOnchainHighScore(address)
        if (score > 0) {
          return { address, score }
        }
        return null
      } catch (error) {
        console.warn(`Failed to fetch score for ${address}:`, error)
        return null
      }
    })

    const batchResults = await Promise.all(promises)
    results.push(...batchResults.filter((r): r is OnchainHighScore => r !== null))
  }

  return results
}

/**
 * Sync onchain high scores to offchain store.
 * This should be called periodically by backend or after onchain updates.
 */
export async function syncOnchainToOffchain(
  knownAddresses: string[]
): Promise<{ synced: number; errors: number }> {
  try {
    const onchainScores = await fetchAllOnchainHighScores(knownAddresses)
    let synced = 0
    let errors = 0

    // Submit each score to backend (backend will update if score is higher)
    for (const { address, score } of onchainScores) {
      try {
        const response = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, score }),
        })
        if (response.ok) {
          synced++
        } else {
          errors++
        }
      } catch (error) {
        console.warn(`Failed to sync ${address}:`, error)
        errors++
      }
    }

    return { synced, errors }
  } catch (error) {
    console.error('Error syncing onchain to offchain:', error)
    throw error
  }
}

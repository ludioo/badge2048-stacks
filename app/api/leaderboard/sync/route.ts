/**
 * POST /api/leaderboard/sync
 * 
 * Sync endpoint for syncing onchain high scores to offchain store.
 * This can be called periodically by a cron job or after onchain updates.
 * 
 * Body: { addresses?: string[] } - optional list of addresses to sync.
 * If not provided, syncs all addresses currently in the store.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllOnchainHighScores } from '@/lib/leaderboard/onchainSync'
import { submitScore, getTop } from '@/lib/leaderboard/store'
import { parseAddress } from '@/lib/leaderboard/validate'

export const dynamic = 'force-dynamic'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('INVALID_INPUT', 'Invalid JSON body', 400)
  }

  const obj = body != null && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const addresses = obj?.addresses

  try {
    // If addresses provided, validate them
    let addressesToSync: string[] = []
    if (addresses) {
      if (!Array.isArray(addresses)) {
        return err('INVALID_INPUT', 'addresses must be an array', 400)
      }
      for (const addr of addresses) {
        const pa = parseAddress(addr)
        if (!pa.ok) {
          return err('INVALID_INPUT', `Invalid address: ${pa.message}`, 400)
        }
        addressesToSync.push(pa.value)
      }
    } else {
      // If no addresses provided, get all addresses from current leaderboard
      const { entries } = getTop(1000, 0) // Get up to 1000 entries
      addressesToSync = entries.map((e) => e.address)
    }

    if (addressesToSync.length === 0) {
      return NextResponse.json({
        data: { synced: 0, errors: 0, message: 'No addresses to sync' },
      })
    }

    // Fetch onchain scores
    const onchainScores = await fetchAllOnchainHighScores(addressesToSync)

    // Sync each score to store
    let synced = 0
    let errors = 0
    const errorsList: Array<{ address: string; error: string }> = []

    for (const { address, score } of onchainScores) {
      try {
        const { updated } = submitScore(address, score)
        if (updated) {
          synced++
        }
      } catch (error) {
        errors++
        errorsList.push({
          address,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      data: {
        synced,
        errors,
        total: onchainScores.length,
        errorsList: errors > 0 ? errorsList : undefined,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to sync leaderboard'
    return err('INTERNAL_ERROR', msg, 500)
  }
}

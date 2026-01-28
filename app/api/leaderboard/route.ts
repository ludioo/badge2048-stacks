import { NextRequest, NextResponse } from 'next/server'
import { parseAddress, parseScore, parseLimitOffset } from '@/lib/leaderboard/validate'
import { submitScore, getTop } from '@/lib/leaderboard/store'

export const dynamic = 'force-dynamic'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

/** GET /api/leaderboard?limit=50&offset=0 — top entries (public) */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const { limit, offset } = parseLimitOffset(
    searchParams.get('limit'),
    searchParams.get('offset')
  )
  try {
    const { entries, total } = getTop(limit, offset)
    return NextResponse.json({ data: { entries, total } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch leaderboard'
    return err('INTERNAL_ERROR', msg, 500)
  }
}

/** POST /api/leaderboard — submit score. Body: { address, score }. Requires wallet (address). */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('INVALID_INPUT', 'Invalid JSON body', 400)
  }
  const obj = body != null && typeof body === 'object' ? (body as Record<string, unknown>) : null
  if (!obj) return err('INVALID_INPUT', 'Body must be an object with address and score', 400)

  const pa = parseAddress(obj.address)
  if (!pa.ok) return err('INVALID_INPUT', pa.message, 400)
  const ps = parseScore(obj.score)
  if (!ps.ok) return err('INVALID_INPUT', ps.message, 400)

  try {
    const { updated, bestScore } = submitScore(pa.value, ps.value)
    return NextResponse.json({ data: { updated, bestScore } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to submit score'
    return err('INTERNAL_ERROR', msg, 500)
  }
}

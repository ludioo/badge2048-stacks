import { NextRequest, NextResponse } from 'next/server'
import { parseAddress } from '@/lib/leaderboard/validate'
import { getRank } from '@/lib/leaderboard/store'

export const dynamic = 'force-dynamic'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

/** GET /api/leaderboard/rank?address=SP... — rank for one address (public) */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  const pa = parseAddress(address)
  if (!pa.ok) return err('INVALID_INPUT', pa.message, 400)

  try {
    const row = getRank(pa.value)
    if (!row) return err('NOT_FOUND', 'Address not on leaderboard', 404)
    return NextResponse.json({ data: row })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch rank'
    return err('INTERNAL_ERROR', msg, 500)
  }
}

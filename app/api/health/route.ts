/**
 * GET /api/health — Health check for monitoring (Uptime Robot, cron, etc.)
 *
 * Verifies:
 * - App is running
 * - Stacks contract is reachable (read-only get-last-token-id via Hiro API)
 *
 * Returns 200 when contract is reachable (or not configured); 503 when contract unreachable.
 * No secrets; uses NEXT_PUBLIC_* and server config only.
 */

import { NextResponse } from 'next/server';
import { contractConfig, apiUrl, isTestnet } from '@/lib/stacks/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const network = isTestnet ? 'testnet' : 'mainnet';
  const address = contractConfig.address;
  const [deployer, contractName] = (address || '').split('.');
  if (!address || !deployer || !contractName) {
    return NextResponse.json(
      { status: 'ok', contract: 'not_configured', network },
      { status: 200 }
    );
  }

  try {
    const url = `${apiUrl}/v2/contracts/call-read/${deployer}/${contractName}/get-last-token-id`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: deployer, arguments: [] }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          status: 'degraded',
          contract: 'unreachable',
          network,
          error: `${res.status} ${res.statusText}`,
          details: text.slice(0, 200),
        },
        { status: 503 }
      );
    }

    const data = (await res.json()) as { okay?: boolean; result?: string };
    if (data.okay === false) {
      return NextResponse.json(
        {
          status: 'degraded',
          contract: 'error',
          network,
          error: 'Contract read returned not okay',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        contract: 'reachable',
        network,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        status: 'degraded',
        contract: 'unreachable',
        network,
        error: message.slice(0, 200),
      },
      { status: 503 }
    );
  }
}

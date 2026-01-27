/**
 * Server-side badge ownership lookup
 *
 * Dipakai oleh /api/badge-ownership. Semua read ownership ke Hiro
 * dilakukan dari backend untuk menghindari CORS dan 429 di browser.
 */

import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { principalCV, stringAsciiCV } from '@stacks/transactions';
import { contractConfig, isTestnet } from '@/lib/stacks/config';
import { CONTRACT_FUNCTIONS, BADGE_TIERS } from '@/lib/stacks/constants';
import type { BadgeTier } from '@/lib/stacks/constants';

const TIERS: BadgeTier[] = [
  BADGE_TIERS.BRONZE,
  BADGE_TIERS.SILVER,
  BADGE_TIERS.GOLD,
  BADGE_TIERS.ELITE,
];

function extractNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  }
  if (typeof v === 'object' && v !== null && 'value' in v) {
    return extractNumber((v as { value: unknown }).value);
  }
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

async function getTokenIdForTier(
  playerAddress: string,
  tier: BadgeTier
): Promise<number | null> {
  const result = await fetchCallReadOnlyFunction({
    network: isTestnet ? 'testnet' : 'mainnet',
    contractAddress: contractConfig.address.split('.')[0],
    contractName: contractConfig.name,
    functionName: CONTRACT_FUNCTIONS.GET_BADGE_OWNERSHIP,
    functionArgs: [principalCV(playerAddress), stringAsciiCV(tier)],
    senderAddress: playerAddress,
  });

  const json = cvToJSON(result);
  if (json.value == null) return null;
  return extractNumber(json.value);
}

/**
 * Mengambil ownership badge untuk semua tier dari chain (server-only).
 * Dipanggil dari API route; satu alamat → satu batch request ke Hiro dari backend.
 */
export async function getBadgeOwnershipAllTiers(
  playerAddress: string
): Promise<Record<string, number | null>> {
  const out: Record<string, number | null> = {};
  for (const tier of TIERS) {
    try {
      out[tier] = await getTokenIdForTier(playerAddress, tier);
    } catch {
      out[tier] = null;
    }
    // Throttle antar tier untuk mengurangi tekanan ke Hiro (server-side)
    if (tier !== TIERS[TIERS.length - 1]) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  return out;
}

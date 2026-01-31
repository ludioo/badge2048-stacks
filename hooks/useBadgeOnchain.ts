'use client'

/**
 * Badge Onchain Query Hook
 *
 * Hook untuk query data dari Badge2048 smart contract (read-only).
 *
 * ⚠️ For badge ownership reads: prefer GET /api/badge-ownership via
 *    fetchBadgeOwnership() from @/lib/stacks/badgeOwnershipClient.
 *    BadgesGrid & ClaimGrid use the backend API to avoid CORS/429.
 *    This hook remains for read-only contract calls (e.g. high score, metadata)
 *    that don't yet have a backend proxy.
 */

import { useState } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { network, contractConfig, isTestnet } from '@/lib/stacks/config';
import { CONTRACT_FUNCTIONS } from '@/lib/stacks/constants';
import { stringAsciiCV, uintCV, principalCV } from '@stacks/transactions';
import type { ContractQueryResult, BadgeOwnership, BadgeMetadata, HighScoreData, BadgeTier } from '@/lib/stacks/types';

export function useBadgeOnchain(address?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get player's high score
   */
  const getHighScore = async (playerAddress: string): Promise<ContractQueryResult<HighScoreData>> => {
    if (!playerAddress) {
      return { data: null, error: 'Player address required', loading: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCallReadOnlyFunction({
        network: isTestnet ? 'testnet' : 'mainnet',
        contractAddress: contractConfig.address.split('.')[0],
        contractName: contractConfig.name,
        functionName: CONTRACT_FUNCTIONS.GET_HIGH_SCORE,
        functionArgs: [principalCV(playerAddress)],
        senderAddress: playerAddress,
      });

      const json = cvToJSON(result);
      const score = json.value?.value || 0;

      setLoading(false);
      return {
        data: {
          score: Number(score),
          player: playerAddress,
        },
        error: null,
        loading: false,
      };
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch high score';
      setError(errorMessage);
      setLoading(false);
      return {
        data: null,
        error: errorMessage,
        loading: false,
      };
    }
  };

  /**
   * Get badge ownership
   */
  const getBadgeOwnership = async (
    playerAddress: string,
    tier: BadgeTier
  ): Promise<ContractQueryResult<BadgeOwnership>> => {
    if (!playerAddress) {
      return { data: null, error: 'Player address required', loading: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCallReadOnlyFunction({
        network: isTestnet ? 'testnet' : 'mainnet',
        contractAddress: contractConfig.address.split('.')[0],
        contractName: contractConfig.name,
        functionName: CONTRACT_FUNCTIONS.GET_BADGE_OWNERSHIP,
        functionArgs: [principalCV(playerAddress), stringAsciiCV(tier)],
        senderAddress: playerAddress,
      });

      const json = cvToJSON(result);
      console.log('[useBadgeOnchain] Contract response for get-badge-ownership:', JSON.stringify(json, null, 2));
      
      // Handle different response formats from Clarity / Stacks API
      // Contract returns: (ok (some u1)) or (ok none)
      // cvToJSON can produce:
      // - { value: null } for (ok none)
      // - { value: { value: 1 } } or { value: { value: "1" } } (one level)
      // - { value: { type: "(optional uint)", value: { type: "uint", value: "1" } } } (nested, from Stacks API)
      let tokenId: number | null = null;

      const extractNumber = (v: unknown): number | null => {
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
      };

      if (json.value != null) {
        tokenId = extractNumber(json.value);
      }

      console.log('[useBadgeOnchain] Extracted tokenId:', tokenId);

      setLoading(false);
      return {
        data: {
          tokenId,
          tier,
          owner: playerAddress,
        },
        error: null,
        loading: false,
      };
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch badge ownership';
      setError(errorMessage);
      setLoading(false);
      return {
        data: null,
        error: errorMessage,
        loading: false,
      };
    }
  };

  /**
   * Get badge metadata
   */
  const getBadgeMetadata = async (tokenId: number): Promise<ContractQueryResult<BadgeMetadata>> => {
    setLoading(true);
    setError(null);

    try {
      const senderAddress = address || contractConfig.deployer;
      const result = await fetchCallReadOnlyFunction({
        network: isTestnet ? 'testnet' : 'mainnet',
        contractAddress: contractConfig.address.split('.')[0],
        contractName: contractConfig.name,
        functionName: CONTRACT_FUNCTIONS.GET_BADGE_METADATA,
        functionArgs: [uintCV(tokenId)],
        senderAddress,
      });

      const json = cvToJSON(result);
      const metadata = json.value?.value;

      if (!metadata) {
        setLoading(false);
        return {
          data: null,
          error: 'Badge metadata not found',
          loading: false,
        };
      }

      setLoading(false);
      return {
        data: {
          tier: metadata.tier?.value || '',
          threshold: Number(metadata.threshold?.value || 0),
          mintedAt: Number(metadata['minted-at']?.value || 0),
        },
        error: null,
        loading: false,
      };
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch badge metadata';
      setError(errorMessage);
      setLoading(false);
      return {
        data: null,
        error: errorMessage,
        loading: false,
      };
    }
  };

  return {
    getHighScore,
    getBadgeOwnership,
    getBadgeMetadata,
    loading,
    error,
  };
}

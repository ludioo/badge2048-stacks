'use client'

/**
 * Badge Onchain Query Hook
 * 
 * Hook untuk query data dari Badge2048 smart contract (read-only)
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
      
      // Handle different response formats from Clarity contract
      // Contract returns: (ok (some u1)) or (ok none)
      // cvToJSON format might be: { value: { value: 1 } } or { value: null } or { value: { value: "1" } }
      let tokenId: number | null = null;
      
      if (json.value) {
        if (typeof json.value === 'object' && json.value !== null) {
          // Format: { value: { value: 1 } } or { value: { value: "1" } }
          if ('value' in json.value) {
            const rawValue = json.value.value;
            if (rawValue !== null && rawValue !== undefined) {
              if (typeof rawValue === 'number') {
                tokenId = rawValue;
              } else if (typeof rawValue === 'string') {
                const parsed = parseInt(rawValue, 10);
                tokenId = isNaN(parsed) ? null : parsed;
              } else {
                // Try to convert to number
                tokenId = Number(rawValue);
                if (isNaN(tokenId)) tokenId = null;
              }
            }
          } else if (typeof json.value === 'number') {
            // Format: { value: 1 }
            tokenId = json.value;
          }
        } else if (typeof json.value === 'number') {
          // Format: { value: 1 }
          tokenId = json.value;
        } else if (typeof json.value === 'string') {
          // Format: { value: "1" }
          const parsed = parseInt(json.value, 10);
          tokenId = isNaN(parsed) ? null : parsed;
        }
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

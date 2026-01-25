'use client'

/**
 * Badge Contract Interaction Hook
 * 
 * Hook untuk berinteraksi dengan Badge2048 smart contract
 */

import { useConnect } from '@stacks/connect-react';
import { useState } from 'react';
import { stringAsciiCV, uintCV } from '@stacks/transactions';
import { network, contractConfig, getExplorerUrl } from '@/lib/stacks/config';
import { CONTRACT_FUNCTIONS, ERROR_MESSAGES } from '@/lib/stacks/constants';
import type { TransactionResult, MintBadgeOptions, UpdateHighScoreOptions, BadgeTier } from '@/lib/stacks/types';

export function useBadgeContract() {
  const { doContractCall } = useConnect();
  const [transactionResult, setTransactionResult] = useState<TransactionResult>({
    status: 'idle',
  });

  /**
   * Mint badge NFT
   */
  const mintBadge = async (options: MintBadgeOptions): Promise<TransactionResult> => {
    const { tier, score, onFinish, onCancel } = options;

    setTransactionResult({ status: 'pending' });

    try {
      await doContractCall({
        network,
        contractAddress: contractConfig.address.split('.')[0],
        contractName: contractConfig.name,
        functionName: CONTRACT_FUNCTIONS.MINT_BADGE,
        functionArgs: [
          stringAsciiCV(tier),
          uintCV(score),
        ],
        onFinish: (data) => {
          const txId = data.txId;
          setTransactionResult({
            status: 'success',
            txId,
          });
          onFinish?.(data);
        },
        onCancel: () => {
          setTransactionResult({
            status: 'error',
            error: 'Transaction cancelled by user',
          });
          onCancel?.();
        },
      });

      return transactionResult;
    } catch (error: any) {
      const errorMessage = error?.message || 'Transaction failed';
      const errorCode = extractErrorCode(errorMessage);
      
      setTransactionResult({
        status: 'error',
        error: errorCode ? ERROR_MESSAGES[errorCode] || errorMessage : errorMessage,
        errorCode,
      });

      return {
        status: 'error',
        error: errorCode ? ERROR_MESSAGES[errorCode] || errorMessage : errorMessage,
        errorCode,
      };
    }
  };

  /**
   * Update high score
   */
  const updateHighScore = async (options: UpdateHighScoreOptions): Promise<TransactionResult> => {
    const { score, onFinish, onCancel } = options;

    setTransactionResult({ status: 'pending' });

    try {
      await doContractCall({
        network,
        contractAddress: contractConfig.address.split('.')[0],
        contractName: contractConfig.name,
        functionName: CONTRACT_FUNCTIONS.UPDATE_HIGH_SCORE,
        functionArgs: [uintCV(score)],
        onFinish: (data) => {
          const txId = data.txId;
          setTransactionResult({
            status: 'success',
            txId,
          });
          onFinish?.(data);
        },
        onCancel: () => {
          setTransactionResult({
            status: 'error',
            error: 'Transaction cancelled by user',
          });
          onCancel?.();
        },
      });

      return transactionResult;
    } catch (error: any) {
      const errorMessage = error?.message || 'Transaction failed';
      const errorCode = extractErrorCode(errorMessage);
      
      setTransactionResult({
        status: 'error',
        error: errorCode ? ERROR_MESSAGES[errorCode] || errorMessage : errorMessage,
        errorCode,
      });

      return {
        status: 'error',
        error: errorCode ? ERROR_MESSAGES[errorCode] || errorMessage : errorMessage,
        errorCode,
      };
    }
  };

  /**
   * Extract error code from error message
   */
  const extractErrorCode = (message: string): number | undefined => {
    const match = message.match(/\(err\s+u(\d+)\)/i);
    return match ? parseInt(match[1], 10) : undefined;
  };

  /**
   * Get explorer URL for transaction
   */
  const getTransactionUrl = (txId?: string) => {
    return txId ? getExplorerUrl(txId) : null;
  };

  return {
    mintBadge,
    updateHighScore,
    transactionResult,
    getTransactionUrl,
  };
}

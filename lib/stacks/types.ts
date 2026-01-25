/**
 * Stacks Type Definitions
 * 
 * TypeScript types for Stacks contract interactions
 */

import type { BadgeTier } from './constants';

// Re-export BadgeTier for convenience
export type { BadgeTier };

// Transaction status
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

// Transaction result
export interface TransactionResult {
  txId?: string;
  status: TransactionStatus;
  error?: string;
  errorCode?: number;
}

// Badge ownership data from contract
export interface BadgeOwnership {
  tokenId: number | null;
  tier: BadgeTier;
  owner: string;
}

// Badge metadata from contract
export interface BadgeMetadata {
  tier: string;
  threshold: number;
  mintedAt: number;
}

// High score data from contract
export interface HighScoreData {
  score: number;
  player: string;
}

// Contract call options
export interface MintBadgeOptions {
  tier: BadgeTier;
  score: number;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface UpdateHighScoreOptions {
  score: number;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

// Wallet connection state
export interface WalletState {
  isAuthenticated: boolean;
  address: string | undefined;
  network: 'testnet' | 'mainnet';
}

// Contract query result
export interface ContractQueryResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

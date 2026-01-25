/**
 * Stacks Network Configuration
 * 
 * Configuration for Stacks network (testnet/mainnet) and contract addresses
 */

import { STACKS_MAINNET, STACKS_TESTNET, networkFromName } from '@stacks/network';
import { CONTRACT_NAME } from './constants';

// Get network from environment variable
const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
export const isTestnet = networkEnv === 'testnet';

// Contract address from environment
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const deployerAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || 'ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5';

// Network configuration
export const network = isTestnet ? STACKS_TESTNET : STACKS_MAINNET;

// Contract configuration
export const contractConfig = {
  address: contractAddress || `${deployerAddress}.${CONTRACT_NAME}`,
  name: CONTRACT_NAME,
  deployer: deployerAddress,
} as const;

// Explorer URLs
export const explorerUrls = {
  testnet: 'https://explorer.stacks.co/?chain=testnet',
  mainnet: 'https://explorer.stacks.co',
} as const;

export const getExplorerUrl = (txId?: string) => {
  const baseUrl = isTestnet ? explorerUrls.testnet : explorerUrls.mainnet;
  return txId ? `${baseUrl}&txid=${txId}` : baseUrl;
};

export const getContractExplorerUrl = () => {
  const baseUrl = isTestnet ? explorerUrls.testnet : explorerUrls.mainnet;
  return `${baseUrl}&contract=${contractConfig.address}`;
};

// API URLs
export const apiUrls = {
  testnet: 'https://api.testnet.hiro.so',
  mainnet: 'https://api.hiro.so',
} as const;

export const apiUrl = isTestnet ? apiUrls.testnet : apiUrls.mainnet;

// App details for wallet connection
export const appDetails = {
  name: 'Badge2048',
  icon: '/favicon.ico',
} as const;

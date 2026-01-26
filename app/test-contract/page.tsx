'use client'

/**
 * Contract Testing Page
 * 
 * Page untuk testing contract functions pada Phase 2.2
 * - Test mint-badge function
 * - Test update-high-score function
 * - Test read-only functions
 * - Verify NFT in wallet
 */

import { useState, useEffect, useMemo } from 'react';
import { useStacksWallet } from '@/hooks/useStacksWallet';
import { useBadgeContract } from '@/hooks/useBadgeContract';
import { useBadgeOnchain } from '@/hooks/useBadgeOnchain';
import { useBadges } from '@/hooks/useBadges';
import { Button } from '@/components/ui/button';
import { BADGE_TIERS, BADGE_THRESHOLDS, CONTRACT_FUNCTIONS } from '@/lib/stacks/constants';
import { contractConfig, getContractExplorerUrl, getExplorerUrl } from '@/lib/stacks/config';
import type { BadgeTier } from '@/lib/stacks/types';

export default function TestContractPage() {
  const { isAuthenticated, address } = useStacksWallet();
  
  // Use the same simple logic as navbar component for consistency
  // Trust the hook state - if address exists, wallet is connected
  // This ensures consistency between navbar and page
  const walletConnected = useMemo(() => {
    // Simple check: if address exists OR isAuthenticated is true, wallet is connected
    // This matches the logic in wallet-connect.tsx component
    return isAuthenticated || !!address;
  }, [isAuthenticated, address]);
  
  // Use address directly from hook - no need for complex fallback logic
  // The hook already handles localStorage fallback internally
  const effectiveAddress = address;

  const { mintBadge, updateHighScore, transferBadge, transactionResult, getTransactionUrl } = useBadgeContract();
  const { getHighScore, getBadgeOwnership, getBadgeMetadata, loading: queryLoading } = useBadgeOnchain(effectiveAddress);

  // State untuk testing
  const [selectedTier, setSelectedTier] = useState<BadgeTier>(BADGE_TIERS.BRONZE);
  const [testScore, setTestScore] = useState<number>(BADGE_THRESHOLDS[BADGE_TIERS.BRONZE]);
  const [highScoreData, setHighScoreData] = useState<any>(null);
  const [badgeOwnershipData, setBadgeOwnershipData] = useState<any>(null);
  const [badgeMetadataData, setBadgeMetadataData] = useState<any>(null);
  const [tokenId, setTokenId] = useState<number>(1);

  // Debug: Log wallet state changes
  useEffect(() => {
    console.log('[TestContractPage] Wallet state:', { 
      isAuthenticated, 
      address,
      effectiveAddress,
      walletConnected,
      hasAddress: !!effectiveAddress 
    });
  }, [isAuthenticated, address, effectiveAddress, walletConnected]);

  // Handle mint badge
  const handleMintBadge = async () => {
    if (!walletConnected || !effectiveAddress) {
      alert('Please connect your wallet first');
      return;
    }

    const result = await mintBadge({
      tier: selectedTier,
      score: testScore,
      onFinish: (data) => {
        console.log('Mint badge success:', data);
      },
      onCancel: () => {
        console.log('Mint badge cancelled');
      },
    });
  };

  // Handle update high score
  const handleUpdateHighScore = async () => {
    if (!walletConnected || !effectiveAddress) {
      alert('Please connect your wallet first');
      return;
    }

    const result = await updateHighScore({
      score: testScore,
      onFinish: (data) => {
        console.log('Update high score success:', data);
      },
      onCancel: () => {
        console.log('Update high score cancelled');
      },
    });
  };

  // Handle get high score
  const handleGetHighScore = async () => {
    if (!effectiveAddress) {
      alert('Please connect your wallet first');
      return;
    }

    const result = await getHighScore(effectiveAddress);
    setHighScoreData(result);
  };

  // Handle get badge ownership
  const handleGetBadgeOwnership = async () => {
    if (!effectiveAddress) {
      alert('Please connect your wallet first');
      return;
    }

    const result = await getBadgeOwnership(effectiveAddress, selectedTier);
    setBadgeOwnershipData(result);
  };

  // Handle get badge metadata
  const handleGetBadgeMetadata = async () => {
    if (!tokenId || tokenId < 1) {
      alert('Please enter a valid token ID');
      return;
    }

    const result = await getBadgeMetadata(tokenId);
    setBadgeMetadataData(result);
  };

  // Update test score when tier changes
  const handleTierChange = (tier: BadgeTier) => {
    setSelectedTier(tier);
    setTestScore(BADGE_THRESHOLDS[tier]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Contract Testing (Phase 2.2)
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Test Badge2048 smart contract functions on testnet
        </p>
      </div>

      {/* Wallet Status */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-300 shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          Wallet Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm sm:text-base font-medium text-gray-700">Status:</span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${walletConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-sm sm:text-base font-semibold ${walletConnected ? 'text-green-700' : 'text-red-700'}`}>
                {walletConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
          {!walletConnected && (
            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-md">
              <p className="text-xs sm:text-sm text-yellow-800 font-medium">
                <span className="font-bold">ℹ️ Info:</span> Please connect your wallet using the <span className="font-semibold">"Connect Wallet"</span> button in the navigation bar above to test contract functions.
              </p>
            </div>
          )}
          {effectiveAddress && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <span className="text-sm sm:text-base font-medium text-gray-700">Address:</span>
              <span className="text-xs sm:text-sm font-mono text-green-800 font-semibold break-all">
                {effectiveAddress}
              </span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm sm:text-base font-medium text-gray-700">Contract:</span>
            <a
              href={getContractExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-mono text-blue-700 hover:text-blue-900 hover:underline break-all font-semibold"
            >
              {contractConfig.address}
            </a>
          </div>
        </div>
      </div>

      {/* Transaction Status */}
      {transactionResult.status !== 'idle' && (
        <div className={`rounded-lg border-2 shadow-md p-4 sm:p-6 ${
          transactionResult.status === 'success' 
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400' 
            : transactionResult.status === 'error' 
            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400'
            : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-3 h-3 rounded-full ${
              transactionResult.status === 'success' ? 'bg-green-500 animate-pulse' :
              transactionResult.status === 'error' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`}></div>
            <h3 className={`font-bold text-sm sm:text-base ${
              transactionResult.status === 'success' ? 'text-green-800' :
              transactionResult.status === 'error' ? 'text-red-800' :
              'text-yellow-800'
            }`}>
              Transaction Status: {transactionResult.status.toUpperCase()}
            </h3>
          </div>
          {transactionResult.txId && (
            <div className="mt-3 p-2 bg-white rounded-md border border-gray-300">
              <a
                href={getTransactionUrl(transactionResult.txId) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-blue-700 hover:text-blue-900 font-semibold hover:underline break-all inline-flex items-center gap-1"
              >
                <span>🔗</span>
                <span>View on Explorer: {transactionResult.txId.slice(0, 16)}...</span>
              </a>
            </div>
          )}
          {transactionResult.error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-xs sm:text-sm text-red-800 font-medium">
                <span className="font-bold">Error:</span> {transactionResult.error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Test Mint Badge */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-300 shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">🎖️</span>
          Test {CONTRACT_FUNCTIONS.MINT_BADGE}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Badge Tier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(BADGE_TIERS).map((tier) => (
                <Button
                  key={tier}
                  variant={selectedTier === tier ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTierChange(tier)}
                  className={`text-xs sm:text-sm capitalize font-semibold transition-all ${
                    selectedTier === tier 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  {tier}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Score (Threshold: <span className="text-purple-600 font-bold">{BADGE_THRESHOLDS[selectedTier]}</span>)
            </label>
            <input
              type="number"
              value={testScore}
              onChange={(e) => setTestScore(Number(e.target.value))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm sm:text-base text-gray-900 font-medium bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-gray-400"
              min={0}
            />
          </div>
          <Button
            onClick={handleMintBadge}
            disabled={!walletConnected || transactionResult.status === 'pending'}
            className={`w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transition-all ${
              !walletConnected 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
            }`}
          >
            {transactionResult.status === 'pending' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Minting...
              </span>
            ) : (
              'Mint Badge'
            )}
          </Button>
        </div>
      </div>

      {/* Test Update High Score */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-300 shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600">📊</span>
          Test {CONTRACT_FUNCTIONS.UPDATE_HIGH_SCORE}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Score
            </label>
            <input
              type="number"
              value={testScore}
              onChange={(e) => setTestScore(Number(e.target.value))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm sm:text-base text-gray-900 font-medium bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-gray-400"
              min={0}
            />
          </div>
          <Button
            onClick={handleUpdateHighScore}
            disabled={!walletConnected || transactionResult.status === 'pending'}
            className={`w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transition-all ${
              !walletConnected 
                ? 'bg-gray-400 cursor-not-allowed border-gray-400' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0'
            }`}
          >
            {transactionResult.status === 'pending' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Updating...
              </span>
            ) : (
              'Update High Score'
            )}
          </Button>
        </div>
      </div>

      {/* Test Read-Only Functions */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-300 shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-green-600">🔍</span>
          Test Read-Only Functions
        </h2>
        <div className="space-y-6">
          {/* Get High Score */}
          <div className="border-b-2 border-gray-300 pb-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-blue-500">📈</span>
              {CONTRACT_FUNCTIONS.GET_HIGH_SCORE}
            </h3>
            <Button
              onClick={handleGetHighScore}
              disabled={!effectiveAddress || queryLoading}
              className={`mb-3 font-semibold shadow-md hover:shadow-lg transition-all ${
                !effectiveAddress || queryLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              }`}
              size="sm"
            >
              {queryLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Loading...
                </span>
              ) : (
                'Get High Score'
              )}
            </Button>
            {highScoreData && (
              <div className="mt-3 p-4 bg-green-50 border-2 border-green-200 rounded-md shadow-sm">
                <pre className="text-xs sm:text-sm overflow-auto text-green-900 font-mono">
                  {JSON.stringify(highScoreData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Get Badge Ownership */}
          <div className="border-b-2 border-gray-300 pb-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-purple-500">🎖️</span>
              {CONTRACT_FUNCTIONS.GET_BADGE_OWNERSHIP}
            </h3>
            <div className="mb-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Select Badge Tier:
              </label>
              <select
                value={selectedTier}
                onChange={(e) => handleTierChange(e.target.value as BadgeTier)}
                className="w-full sm:w-auto px-3 py-2 border-2 border-gray-300 rounded-md text-sm sm:text-base text-gray-900 font-medium bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all capitalize"
              >
                {Object.values(BADGE_TIERS).map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleGetBadgeOwnership}
              disabled={!effectiveAddress || queryLoading}
              className={`mb-3 font-semibold shadow-md hover:shadow-lg transition-all ${
                !effectiveAddress || queryLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
              }`}
              size="sm"
            >
              {queryLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Loading...
                </span>
              ) : (
                'Get Badge Ownership'
              )}
            </Button>
            {badgeOwnershipData && (
              <div className="mt-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-md shadow-sm">
                <pre className="text-xs sm:text-sm overflow-auto text-purple-900 font-mono">
                  {JSON.stringify(badgeOwnershipData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Get Badge Metadata */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-indigo-500">📋</span>
              {CONTRACT_FUNCTIONS.GET_BADGE_METADATA}
            </h3>
            <div className="mb-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Token ID:
              </label>
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(Number(e.target.value))}
                placeholder="Enter Token ID"
                className="w-full sm:w-auto px-3 py-2 border-2 border-gray-300 rounded-md text-sm sm:text-base text-gray-900 font-medium bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-gray-400"
                min={1}
              />
            </div>
            <Button
              onClick={handleGetBadgeMetadata}
              disabled={queryLoading}
              className={`mb-3 font-semibold shadow-md hover:shadow-lg transition-all ${
                queryLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white'
              }`}
              size="sm"
            >
              {queryLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Loading...
                </span>
              ) : (
                'Get Badge Metadata'
              )}
            </Button>
            {badgeMetadataData && (
              <div className="mt-3 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-md shadow-sm">
                <pre className="text-xs sm:text-sm overflow-auto text-indigo-900 font-mono">
                  {JSON.stringify(badgeMetadataData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badge State Reset Utility (for Testing) */}
      <BadgeResetUtility />

      {/* Instructions */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-blue-600">📖</span>
          Testing Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-blue-900 font-medium">
          <li className="pl-2">Connect your wallet using the button in the navigation or the "Connect Wallet" button above</li>
          <li className="pl-2">Test mint-badge: Select a tier, set score ≥ threshold, click Mint Badge</li>
          <li className="pl-2">Test update-high-score: Set a score, click Update High Score</li>
          <li className="pl-2">Test read-only functions: Click buttons to query contract state</li>
          <li className="pl-2">Verify NFT in wallet: Check your Leather/Hiro wallet for minted badges</li>
          <li className="pl-2">Check transaction on Stacks Explorer using the transaction links</li>
          <li className="pl-2">Reset badge state: Use the utility below to unclaim badges for testing claim flow again</li>
        </ol>
      </div>
    </div>
  );
}

/**
 * Badge Reset Utility Component
 * Allows resetting badge claimed state and onchain badges for testing purposes
 */
function BadgeResetUtility() {
  const { badges, unclaimBadge, replaceBadges } = useBadges();
  const { isAuthenticated, address } = useStacksWallet();
  const { transferBadge, getTransactionUrl } = useBadgeContract();
  const { getBadgeOwnership } = useBadgeOnchain(address);
  const [selectedTier, setSelectedTier] = useState<BadgeTier>(BADGE_TIERS.BRONZE);
  const [resetStatus, setResetStatus] = useState<{ success: boolean; message: string; txId?: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Burn address untuk testnet (address yang tidak digunakan)
  // Note: Transfer ke address ini akan "menghapus" badge dari wallet user
  const BURN_ADDRESS = 'ST00000000000000000000000000000000000000000';

  const claimedBadges = useMemo(() => {
    return badges.filter(badge => badge.claimed && badge.unlocked);
  }, [badges]);
  
  const onchainMintedBadges = useMemo(() => {
    return badges.filter(badge => badge.onchainMinted === true);
  }, [badges]);

  const handleUnclaim = (tier: BadgeTier) => {
    try {
      const result = unclaimBadge(tier);
      if (result.unclaimedBadge) {
        setResetStatus({
          success: true,
          message: `Badge ${tier} has been unclaimed. You can now test the claim flow again.`
        });
        setTimeout(() => setResetStatus(null), 5000);
      } else {
        setResetStatus({
          success: false,
          message: `Badge ${tier} is not claimed or not unlocked.`
        });
        setTimeout(() => setResetStatus(null), 5000);
      }
    } catch (error) {
      setResetStatus({
        success: false,
        message: `Error resetting badge: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setTimeout(() => setResetStatus(null), 5000);
    }
  };

  /**
   * Reset badge onchain by transferring to burn address
   * Note: This transfers the NFT but doesn't remove the ownership map entry
   * The badge will be removed from wallet but contract will still show it as minted
   * This is a limitation of the current contract design
   */
  const handleResetOnchain = async (tier: BadgeTier) => {
    if (!isAuthenticated || !address) {
      setResetStatus({
        success: false,
        message: 'Please connect your wallet first'
      });
      setTimeout(() => setResetStatus(null), 5000);
      return;
    }

    setIsResetting(true);
    setResetStatus(null);

    try {
      // Get token ID from badge ownership
      const ownershipResult = await getBadgeOwnership(address, tier);
      
      if (!ownershipResult.data?.tokenId) {
        setResetStatus({
          success: false,
          message: `Badge ${tier} is not minted onchain. Use "Unclaim" to reset offchain state.`
        });
        setIsResetting(false);
        setTimeout(() => setResetStatus(null), 5000);
        return;
      }

      const tokenId = ownershipResult.data.tokenId;
      console.log(`[BadgeResetUtility] Transferring badge ${tier} (tokenId: ${tokenId}) to burn address`);

      // Transfer badge to burn address
      await transferBadge({
        tokenId,
        sender: address, // Current wallet address
        recipient: BURN_ADDRESS,
        onFinish: (data) => {
          console.log('[BadgeResetUtility] Transfer successful:', data);
          
          // Update badge state to remove onchain data
          const updatedBadges = badges.map((badge) =>
            badge.tier === tier
              ? {
                  ...badge,
                  onchainMinted: false,
                  tokenId: undefined,
                  txId: undefined,
                  mintedAt: undefined,
                }
              : badge
          );
          replaceBadges(updatedBadges);

          setResetStatus({
            success: true,
            message: `Badge ${tier} (Token ID: ${tokenId}) has been transferred to burn address. You can now mint it again.`,
            txId: data.txId,
          });
          setIsResetting(false);
          setTimeout(() => setResetStatus(null), 8000);
        },
        onCancel: () => {
          setResetStatus({
            success: false,
            message: 'Transfer cancelled by user'
          });
          setIsResetting(false);
          setTimeout(() => setResetStatus(null), 5000);
        },
      });
    } catch (error: any) {
      console.error('[BadgeResetUtility] Error resetting onchain badge:', error);
      setResetStatus({
        success: false,
        message: `Error resetting badge: ${error?.message || 'Unknown error'}`
      });
      setIsResetting(false);
      setTimeout(() => setResetStatus(null), 5000);
    }
  };

  if (claimedBadges.length === 0 && onchainMintedBadges.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span className="text-gray-600">🔄</span>
          Badge Reset Utility (Testing)
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          No claimed or minted badges found. Claim or mint a badge first to use this utility.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400 rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
        <span className="text-orange-600">🔄</span>
        Badge Reset Utility (Testing Only)
      </h2>
      <div className="text-xs sm:text-sm text-orange-800 mb-4 space-y-2">
        <p className="font-bold">⚠️ Warning: This utility resets badges for testing purposes.</p>
        <div className="space-y-1 pl-2">
          <p>
            <span className="font-semibold">Offchain Reset:</span> Resets claimed state (badge will appear as unclaimed).
          </p>
          <p>
            <span className="font-semibold">Onchain Reset:</span> Transfers badge NFT to burn address (removes from wallet).
          </p>
          <p className="text-red-700 font-bold">
            ⚠️ Important Limitation: After onchain reset, the badge NFT is transferred but the contract's ownership map still shows you as the owner. 
            This means you cannot mint the same tier again unless the contract is modified to support reset functionality.
            For testing purposes, you can use a different wallet address or wait for contract upgrade.
          </p>
        </div>
      </div>
      
      {resetStatus && (
        <div className={`mb-4 p-3 rounded-md border-2 ${
          resetStatus.success 
            ? 'bg-green-50 border-green-300 text-green-800' 
            : 'bg-red-50 border-red-300 text-red-800'
        }`}>
          <p className="text-xs sm:text-sm font-medium">{resetStatus.message}</p>
          {resetStatus.success && resetStatus.txId && (
            <a
              href={getTransactionUrl(resetStatus.txId) || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-green-700 hover:text-green-900 underline font-semibold"
            >
              View transaction on Explorer
            </a>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Offchain Reset Section */}
        {claimedBadges.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-2">
              Reset Offchain State (Unclaim):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {claimedBadges.map((badge) => (
                <Button
                  key={badge.tier}
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnclaim(badge.tier)}
                  disabled={isResetting}
                  className={`text-xs sm:text-sm capitalize font-semibold transition-all border-2 ${
                    selectedTier === badge.tier
                      ? 'bg-orange-100 border-orange-500 text-orange-900'
                      : 'border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-800'
                  } disabled:opacity-50`}
                >
                  {badge.tier}
                  {badge.onchainMinted && (
                    <span className="ml-1 text-xs">(onchain)</span>
                  )}
                </Button>
              ))}
            </div>
            <p className="text-xs text-orange-700 mt-2">
              Click to unclaim badge (resets offchain state only)
            </p>
          </div>
        )}

        {/* Onchain Reset Section */}
        {onchainMintedBadges.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-2">
              Reset Onchain State (Transfer to Burn Address):
            </label>
            {!isAuthenticated ? (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-md">
                <p className="text-xs text-yellow-800 font-medium">
                  Please connect your wallet to reset onchain badges
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {onchainMintedBadges.map((badge) => (
                    <Button
                      key={badge.tier}
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetOnchain(badge.tier)}
                      disabled={isResetting}
                      className={`text-xs sm:text-sm capitalize font-semibold transition-all border-2 ${
                        isResetting
                          ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                          : 'border-red-300 hover:border-red-500 hover:bg-red-50 text-red-800'
                      }`}
                    >
                      {isResetting ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                          Resetting...
                        </span>
                      ) : (
                        <>
                          {badge.tier}
                          {badge.tokenId && (
                            <span className="ml-1 text-xs">(#{badge.tokenId})</span>
                          )}
                        </>
                      )}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  Click to transfer badge NFT to burn address (removes from wallet).
                  <br />
                  <span className="text-red-700 font-semibold">Note:</span> Contract ownership map will still show you as owner (contract limitation).
                </p>
              </>
            )}
          </div>
        )}

        <div className="text-xs sm:text-sm text-orange-700 font-medium pt-2 border-t border-orange-300">
          <p>Claimed badges (offchain): {claimedBadges.length}</p>
          <p>Minted badges (onchain): {onchainMintedBadges.length}</p>
        </div>
      </div>
    </div>
  );
}

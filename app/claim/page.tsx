'use client'

import { ClaimGrid } from '@/components/badge/ClaimGrid'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useEffect, useState } from 'react'

export default function ClaimPage() {
  const { isAuthenticated, address } = useStacksWallet()
  // Force re-render when wallet status changes via events
  const [, forceUpdate] = useState({})

  // Listen to wallet connect/disconnect events for real-time updates
  useEffect(() => {
    const handleWalletChange = () => {
      console.log('[ClaimPage] Wallet status changed, forcing re-render');
      forceUpdate({});
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('wallet-connected', handleWalletChange);
      window.addEventListener('wallet-disconnected', handleWalletChange);
      console.log('[ClaimPage] Listening for wallet status changes');
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('wallet-connected', handleWalletChange);
        window.removeEventListener('wallet-disconnected', handleWalletChange);
      }
    };
  }, []);

  // Debug logs to track state changes
  console.log('[ClaimPage] Render with wallet state:', { isAuthenticated, address })

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Claim Badges
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Claim unlocked badges to showcase your achievements.
        </p>
      </div>

      {/* Wallet Connection Status - Informational Only */}
      {!isAuthenticated && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
          </svg>
          <AlertTitle className="text-sm sm:text-base font-semibold text-amber-900">
            Connect your wallet to mint badges onchain
          </AlertTitle>
          <AlertDescription className="mt-2 text-sm text-amber-800">
            <p>
              To mint badges as NFTs on the Stacks blockchain, please connect
              your wallet first using the button in the navigation bar. You can still view and claim badges offline,
              but onchain minting requires a connected wallet.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Connected Status */}
      {isAuthenticated && address && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-medium text-green-900">
                Wallet connected
              </p>
              <span className="hidden sm:inline text-xs font-mono text-green-700">
                ({address.slice(0, 6)}...{address.slice(-6)})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-green-700">
              Badges will be minted as NFTs onchain when you claim them.
            </p>
          </div>
        </div>
      )}

      <ClaimGrid />
    </div>
  )
}

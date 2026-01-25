'use client'

/**
 * Wallet Connect Component
 * 
 * Component untuk connect/disconnect Stacks wallet dengan responsive design
 */

import { useStacksWallet } from '@/hooks/useStacksWallet';

export function WalletConnect() {
  const { isAuthenticated, address, connectWallet, disconnectWallet, isAuthenticating } = useStacksWallet();

  const handleConnect = () => {
    try {
      connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    console.log('[WalletConnect] Disconnect button clicked');
    disconnectWallet();
    console.log('[WalletConnect] Disconnect function called');
  };

  // Format address untuk display (truncate di tengah)
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  if (isAuthenticated && address) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Desktop: Show address badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 rounded-md shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm font-mono text-green-800 font-semibold">
            {formatAddress(address)}
          </span>
        </div>
        {/* Mobile: Show truncated address in compact badge */}
        <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-300 rounded-md shadow-sm">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-green-800 font-semibold">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="w-full sm:w-auto text-xs sm:text-sm bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 text-white font-semibold shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 border-0 px-4 sm:px-3 py-2 sm:py-1.5 rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isAuthenticating}
      className="w-full sm:w-auto text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-semibold shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed border-0 px-4 sm:px-3 py-2 sm:py-1.5 rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {isAuthenticating ? (
        <>
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="hidden sm:inline">Connecting...</span>
          <span className="sm:hidden">Connecting</span>
        </>
      ) : (
        <span>Connect Wallet</span>
      )}
    </button>
  );
}

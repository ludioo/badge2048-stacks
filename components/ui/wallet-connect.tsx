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
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#FD9E7F]/20 border border-[#FB6331] rounded-md shadow-sm">
          <div className="w-2 h-2 bg-[#F4622F] rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm font-mono text-[#F4622F] font-semibold">
            {formatAddress(address)}
          </span>
        </div>
        {/* Mobile: Show truncated address in compact badge */}
        <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FD9E7F]/20 border border-[#FB6331] rounded-md shadow-sm">
          <div className="w-1.5 h-1.5 bg-[#F4622F] rounded-full animate-pulse" />
          <span className="text-xs font-mono text-[#F4622F] font-semibold">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm bg-gradient-to-r from-[#E8552A] to-[#DC4824] hover:from-[#DC4824] hover:to-[#C42E18] active:from-[#C42E18] active:to-[#B82112] text-white font-semibold shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 border-0 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8552A] focus-visible:ring-offset-2"
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
      className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm bg-gradient-to-r from-[#F4622F] to-[#FB6331] hover:from-[#FB6331] hover:to-[#F4622F] active:from-[#F4622F] active:to-[#E8552A] text-white font-semibold shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed border-0 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4622F] focus-visible:ring-offset-2"
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

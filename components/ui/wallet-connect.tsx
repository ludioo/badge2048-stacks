'use client'

/**
 * Wallet Connect Component
 *
 * - Default: inline in navbar (desktop).
 * - variant="menu": full-width stacked layout for mobile dropdown.
 */

import { useStacksWallet } from '@/hooks/useStacksWallet';
import { cn } from '@/lib/utils';

type WalletConnectProps = {
  /** Use in mobile menu for full-width stacked layout */
  variant?: 'inline' | 'menu'
}

export function WalletConnect({ variant = 'inline' }: WalletConnectProps) {
  const { isAuthenticated, address, connectWallet, disconnectWallet, isAuthenticating } = useStacksWallet();
  const isMenu = variant === 'menu';

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
      <div className={isMenu ? 'flex flex-col gap-3 w-full' : 'flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0'}>
        <div className={cn(
          'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-[#FD9E7F]/15 border border-[#FD9E7F]/50 rounded-md shadow-sm',
          isMenu ? 'w-full min-h-[44px]' : 'min-w-0 shrink'
        )}>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#F4622F] rounded-full animate-pulse shrink-0" aria-hidden />
          <span className="text-xs sm:text-sm font-mono text-[#171717] font-semibold truncate">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className={cn(
            'min-h-[44px] text-xs sm:text-sm bg-gradient-to-r from-[#E8552A] to-[#DC4824] hover:from-[#DC4824] hover:to-[#C42E18] active:from-[#C42E18] active:to-[#B82112] text-white font-semibold shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 border-0 px-3 sm:px-4 py-2.5 rounded-md inline-flex items-center justify-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8552A] focus-visible:ring-offset-2',
            isMenu ? 'w-full' : 'shrink-0'
          )}
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
      className={cn(
        'min-h-[44px] text-xs sm:text-sm bg-gradient-to-r from-[#F4622F] to-[#FB6331] hover:from-[#FB6331] hover:to-[#F4622F] active:from-[#F4622F] active:to-[#E8552A] text-white font-semibold shadow-md hover:shadow-lg active:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed border-0 px-3 sm:px-4 py-2.5 rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4622F] focus-visible:ring-offset-2',
        isMenu ? 'w-full' : 'w-full sm:w-auto shrink-0'
      )}
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

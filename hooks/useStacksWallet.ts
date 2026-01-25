'use client'

/**
 * Stacks Wallet Hook
 * 
 * Hook untuk mengelola koneksi wallet Stacks (Leather/Hiro)
 */

import { useConnect } from '@stacks/connect-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { appDetails, isTestnet } from '@/lib/stacks/config';
import type { WalletState } from '@/lib/stacks/types';

export function useStacksWallet() {
  const { doOpenAuth, authenticate, authData, userSession, isAuthenticating } = useConnect();
  const [walletState, setWalletState] = useState<WalletState>({
    isAuthenticated: false,
    address: undefined,
    network: isTestnet ? 'testnet' : 'mainnet',
  });
  const [isConnecting, setIsConnecting] = useState(false);
  // Ref to track if disconnect was explicitly called
  // This prevents re-detection after disconnect
  const isDisconnectedRef = useRef(false);

  // Function to extract address from userSession or localStorage
  // Added error handling to prevent JSON parse errors from spamming
  const extractAddress = useCallback(() => {
    // Try from userSession first
    if (userSession) {
      try {
        // Check if user is signed in
        const isSignedIn = userSession.isUserSignedIn && userSession.isUserSignedIn();
        
        if (isSignedIn) {
          const userData = userSession.loadUserData();
          
          if (userData?.profile?.stxAddress) {
            const address = isTestnet
              ? userData.profile.stxAddress.testnet
              : userData.profile.stxAddress.mainnet;
            if (address) {
              return address;
            }
          }
        }
      } catch (e) {
        // Silently fail to prevent error spamming
        // Only log if it's not a common/expected error
        if (e instanceof Error && !e.message.includes('No session data')) {
          console.error('[useStacksWallet] Error loading user data from userSession:', e);
        }
      }
    }
    
    // Fallback: Try to get from localStorage (Stacks Connect stores address there)
    try {
      if (typeof window !== 'undefined') {
        // Check for Stacks Connect stored data
        const stacksData = localStorage.getItem('blockstack-session');
        if (stacksData) {
          // Validate JSON before parsing to prevent errors
          try {
            const parsed = JSON.parse(stacksData);
            if (parsed?.userData?.profile?.stxAddress) {
              const address = isTestnet
                ? parsed.userData.profile.stxAddress.testnet
                : parsed.userData.profile.stxAddress.mainnet;
              if (address) {
                return address;
              }
            }
          } catch (parseError) {
            // Invalid JSON in localStorage, skip it
            // Don't log to prevent spamming
            return undefined;
          }
        }
      }
    } catch (e) {
      // Silently fail to prevent error spamming
      return undefined;
    }
    
    return undefined;
  }, [userSession, isTestnet]);

  // Immediate check on mount to detect existing connection
  // This ensures state is synced even if authData/userSession haven't updated yet
  useEffect(() => {
    // Don't check if disconnect was explicitly called
    if (isDisconnectedRef.current) {
      return;
    }

    // Try to get address immediately on mount
    try {
      const address = extractAddress();
      if (address) {
        console.log('[useStacksWallet] Address found on mount:', address);
        setWalletState(prev => {
          // Don't update if disconnect was explicitly called
          if (isDisconnectedRef.current) {
            return prev;
          }
          // Update if address found and different from current
          if (prev.address !== address) {
            return {
              isAuthenticated: true,
              address,
              network: isTestnet ? 'testnet' : 'mainnet',
            };
          }
          // Also update isAuthenticated if address exists but isAuthenticated is false
          if (prev.address === address && !prev.isAuthenticated) {
            return {
              ...prev,
              isAuthenticated: true,
            };
          }
          return prev;
        });
      }
    } catch (error) {
      // Silently fail
    }
  }, [extractAddress, isTestnet]); // Run on mount and when extractAddress changes

  // Update wallet state when authentication changes
  // This effect syncs state with authData/userSession from useConnect
  useEffect(() => {
    const isAuthenticated = !!authData && !!userSession;
    
    // If authData/userSession become available, reset disconnect flag
    // This handles natural connection (not through connectWallet button)
    if (isAuthenticated && isDisconnectedRef.current) {
      console.log('[useStacksWallet] authData/userSession available, resetting disconnect flag');
      isDisconnectedRef.current = false;
    }
    
    // Don't update if disconnect was explicitly called and no authData/userSession
    if (isDisconnectedRef.current && !isAuthenticated) {
      return;
    }
    let address: string | undefined;

    if (isAuthenticated && userSession) {
      try {
        address = extractAddress();
        
        // If address found, update state immediately
        if (address) {
          setWalletState(prev => {
            // Don't update if disconnect was explicitly called
            if (isDisconnectedRef.current) {
              return prev;
            }
            // Only update if address changed to prevent unnecessary re-renders
            if (prev.address !== address || !prev.isAuthenticated) {
              return {
                isAuthenticated: true,
                address,
                network: isTestnet ? 'testnet' : 'mainnet',
              };
            }
            return prev;
          });
          setIsConnecting(false);
        } else {
          // If address not found immediately, try again after a delay
          // This handles cases where userSession needs time to load
          const timeoutId = setTimeout(() => {
            try {
              const retryAddress = extractAddress();
              if (retryAddress && !isDisconnectedRef.current) {
                setWalletState(prev => ({
                  ...prev,
                  isAuthenticated: true,
                  address: retryAddress,
                }));
                setIsConnecting(false);
              }
            } catch (error) {
              // Silently handle errors to prevent spamming
            }
          }, 1000);
          
          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        // Silently handle errors to prevent spamming
        setIsConnecting(false);
      }
    } else {
      // Even if authData/userSession not available yet, try to get address
      // This handles cases where localStorage has address but authData not ready
      try {
        const address = extractAddress();
        if (address && !isDisconnectedRef.current) {
          setWalletState(prev => {
            // Don't update if disconnect was explicitly called
            if (isDisconnectedRef.current) {
              return prev;
            }
            // Update if we have address but state doesn't
            if (!prev.address) {
              return {
                isAuthenticated: true,
                address,
                network: isTestnet ? 'testnet' : 'mainnet',
              };
            }
            // Keep existing state if address matches
            if (prev.address === address) {
              return prev;
            }
            // Update if address changed
            return {
              isAuthenticated: true,
              address,
              network: isTestnet ? 'testnet' : 'mainnet',
            };
          });
        } else if (!isAuthenticated && !isConnecting && !walletState.address) {
          // Only clear if truly not connected and no address exists
          setWalletState(prev => ({
            isAuthenticated: false,
            address: undefined,
            network: isTestnet ? 'testnet' : 'mainnet',
          }));
        }
      } catch (error) {
        // Silently handle errors
      }
    }
  }, [authData, userSession, extractAddress, isTestnet, isConnecting, walletState.address]);

  // Handle pending sign in
  useEffect(() => {
    if (!userSession) return;

    const handlePending = async () => {
      try {
        if (userSession.isSignInPending && userSession.isSignInPending()) {
          console.log('[useStacksWallet] Handling pending sign in...');
          await userSession.handlePendingSignIn();
          console.log('[useStacksWallet] Pending sign in handled');
          
          // Extract address after handling pending sign in
          setTimeout(() => {
            const address = extractAddress();
            if (address) {
              setWalletState(prev => ({
                ...prev,
                isAuthenticated: true,
                address,
              }));
            }
          }, 500);
        }
      } catch (e) {
        console.log('[useStacksWallet] No pending sign in or error:', e);
      }
    };

    handlePending();
  }, [userSession, extractAddress]);

  // Listen for window focus to check if user returned from wallet extension
  // Debounced to prevent spamming
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout;
    
    const handleFocus = () => {
      // Debounce focus events to prevent spamming
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        if (authData && userSession && !walletState.address) {
          console.log('[useStacksWallet] Window focused, checking for address...');
          try {
            const address = extractAddress();
            if (address) {
              setWalletState(prev => ({
                ...prev,
                isAuthenticated: true,
                address,
              }));
            }
          } catch (error) {
            console.error('[useStacksWallet] Error checking address on focus:', error);
          }
        }
      }, 1000); // Debounce 1 second
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(focusTimeout);
    };
  }, [authData, userSession, walletState.address, extractAddress]);

  // Continuous polling to detect address changes and ensure state sync
  // This helps sync state across all components using the hook
  useEffect(() => {
    // Don't poll if disconnect was explicitly called
    if (isDisconnectedRef.current) {
      return;
    }

    // Only poll if we don't have address yet, or if authData/userSession changed
    if (walletState.address && authData && userSession) {
      // Already have address and authData, no need to poll
      return;
    }

    let pollCount = 0;
    const maxPolls = 20; // Max 20 polls (20 seconds total)
    
    const intervalId = setInterval(() => {
      pollCount++;
      
      // Check if disconnect was explicitly called - if so, stop polling
      if (isDisconnectedRef.current) {
        clearInterval(intervalId);
        return;
      }
      
      // Always try to get address (from localStorage or userSession)
      try {
        const address = extractAddress();
        if (address && !isDisconnectedRef.current) {
          // Update state if address found and different from current
          setWalletState(prev => {
            // Don't update if disconnect was explicitly called
            if (isDisconnectedRef.current) {
              return prev;
            }
            if (prev.address !== address) {
              console.log('[useStacksWallet] Address found via continuous polling:', address);
              return {
                isAuthenticated: true,
                address,
                network: isTestnet ? 'testnet' : 'mainnet',
              };
            }
            // Also update isAuthenticated if address exists but isAuthenticated is false
            if (prev.address === address && !prev.isAuthenticated) {
              return {
                ...prev,
                isAuthenticated: true,
              };
            }
            return prev;
          });
          setIsConnecting(false);
          // Continue polling to ensure state stays synced
        }
      } catch (error) {
        // Silently handle errors
      }
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        clearInterval(intervalId);
      }
    }, 1000); // Check every 1 second

    // Clear interval after max time
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 20000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [authData, userSession, walletState.address, extractAddress, isTestnet, isConnecting]);

  /**
   * Connect wallet
   * Using authenticate method (async) as primary method, with doOpenAuth as fallback
   */
  const connectWallet = useCallback(async () => {
    console.log('[useStacksWallet] connectWallet called');
    // Reset disconnect flag when connecting
    isDisconnectedRef.current = false;
    setIsConnecting(true);
    
    // Set timeout to reset connecting state if no response
    const timeoutId = setTimeout(() => {
      console.warn('[useStacksWallet] Connection timeout after 30 seconds');
      setIsConnecting(false);
    }, 30000);
    
    try {
      // Try using authenticate method (async) first
      console.log('[useStacksWallet] Attempting authentication with authenticate method...');
      await authenticate({
        appDetails,
        redirectTo: typeof window !== 'undefined' ? window.location.href : '/',
      });
      
      console.log('[useStacksWallet] Authentication completed, checking for address...');
      clearTimeout(timeoutId);
      
      // Wait a bit for authData/userSession to update
      // Check multiple times to ensure state syncs properly
      let checkCount = 0;
      const maxChecks = 5;
      
      const checkAddress = () => {
        checkCount++;
        try {
          const address = extractAddress();
          if (address) {
            console.log('[useStacksWallet] Address found after authenticate:', address);
            setWalletState(prev => ({
              ...prev,
              isAuthenticated: true,
              address,
            }));
            setIsConnecting(false);
            return; // Stop checking once address is found
          } else if (checkCount < maxChecks) {
            // Continue checking if address not found yet
            setTimeout(checkAddress, 500);
          } else {
            console.log('[useStacksWallet] Address not found after multiple checks, will be detected by polling effect');
            setIsConnecting(false);
          }
        } catch (error) {
          console.error('[useStacksWallet] Error checking address after authenticate:', error);
          if (checkCount < maxChecks) {
            setTimeout(checkAddress, 500);
          } else {
            setIsConnecting(false);
          }
        }
      };
      
      // Start checking after initial delay
      setTimeout(checkAddress, 500);
      
    } catch (error) {
      console.error('[useStacksWallet] Authenticate method failed, trying doOpenAuth fallback:', error);
      clearTimeout(timeoutId);
      
      // Fallback to doOpenAuth with callback
      doOpenAuth(true, {
        appDetails,
        redirectTo: typeof window !== 'undefined' ? window.location.href : '/',
        onFinish: (payload) => {
          console.log('[useStacksWallet] Wallet connected - onFinish callback:', payload);
          setIsConnecting(false);
          
          // Single check instead of recursive polling
          setTimeout(() => {
            try {
              const address = extractAddress();
              if (address) {
                console.log('[useStacksWallet] Address found in onFinish:', address);
                setWalletState(prev => ({
                  ...prev,
                  isAuthenticated: true,
                  address,
                }));
              } else {
                console.log('[useStacksWallet] Address not immediately available, will be detected by polling effect');
                // Let the polling effect handle it instead of recursive calls
              }
            } catch (error) {
              console.error('[useStacksWallet] Error checking address in onFinish:', error);
            }
          }, 2000); // Single delayed check instead of recursive polling
        },
        onCancel: () => {
          console.log('[useStacksWallet] Wallet connection cancelled');
          setIsConnecting(false);
        },
      });
    }
  }, [authenticate, doOpenAuth, extractAddress]);

  /**
   * Disconnect wallet
   * Clears local state and attempts to sign out from userSession
   * IMPORTANT: This function explicitly clears state to prevent re-detection
   */
  const disconnectWallet = useCallback(() => {
    console.log('[useStacksWallet] disconnectWallet called');
    console.log('[useStacksWallet] Current state before disconnect:', {
      isAuthenticated: walletState.isAuthenticated,
      address: walletState.address,
      hasUserSession: !!userSession,
    });
    
    // Set disconnect flag FIRST to prevent re-detection by effects
    isDisconnectedRef.current = true;
    
    // Clear localStorage FIRST to prevent re-detection
    try {
      if (typeof window !== 'undefined') {
        // Clear blockstack-session from localStorage
        const sessionKey = 'blockstack-session';
        if (localStorage.getItem(sessionKey)) {
          localStorage.removeItem(sessionKey);
          console.log('[useStacksWallet] Cleared blockstack-session from localStorage');
        }
        
        // Clear any other Stacks-related localStorage items
        const stacksKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('blockstack') || key.startsWith('stacks')
        );
        stacksKeys.forEach(key => {
          localStorage.removeItem(key);
          console.log(`[useStacksWallet] Cleared ${key} from localStorage`);
        });
      }
    } catch (e) {
      console.error('[useStacksWallet] Error clearing localStorage:', e);
    }
    
    // Clear local state - this must be done AFTER clearing localStorage
    // to ensure state is explicitly set to disconnected
    // Always return new object to ensure React detects the change
    setWalletState({
      isAuthenticated: false,
      address: undefined,
      network: isTestnet ? 'testnet' : 'mainnet',
    });
    setIsConnecting(false);
    
    // Try to sign out from userSession if available
    if (userSession) {
      try {
        // Check if user is signed in before attempting sign out
        if (userSession.isUserSignedIn && userSession.isUserSignedIn()) {
          console.log('[useStacksWallet] User is signed in, attempting sign out...');
          userSession.signUserOut();
          console.log('[useStacksWallet] signUserOut called successfully');
        } else {
          console.log('[useStacksWallet] User not signed in, skipping signUserOut');
        }
      } catch (e) {
        console.error('[useStacksWallet] Error signing out from userSession:', e);
      }
    } else {
      console.log('[useStacksWallet] No userSession available, only cleared local state');
    }
    
    console.log('[useStacksWallet] Disconnect completed - state cleared, localStorage cleared, and disconnect flag set');
  }, [userSession, isTestnet, walletState.isAuthenticated, walletState.address]);

  // Reset connecting state when authentication completes or fails
  useEffect(() => {
    if (isAuthenticating === false && isConnecting) {
      setIsConnecting(false);
    }
  }, [isAuthenticating, isConnecting]);

  // Return state values directly (not spread) to ensure React detects changes
  // This ensures components re-render when state changes
  return {
    isAuthenticated: walletState.isAuthenticated,
    address: walletState.address,
    network: walletState.network,
    connectWallet,
    disconnectWallet,
    userSession,
    isAuthenticating: isAuthenticating || isConnecting,
  };
}

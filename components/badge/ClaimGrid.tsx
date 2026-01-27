'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Badge, BadgeTier } from '@/lib/game/types'
import { useBadges } from '@/hooks/useBadges'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { useBadgeContract } from '@/hooks/useBadgeContract'
import { badgeTierMeta } from '@/components/badge/badgeMeta'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WalletConnect } from '@/components/ui/wallet-connect'
import { cn } from '@/lib/utils'
import { updateBadgeWithOnchainData } from '@/lib/badges'
import { loadHighScore } from '@/lib/highScore'
import { fetchBadgeOwnership, getOwnershipForTier } from '@/lib/stacks/badgeOwnershipClient'
import { getExplorerUrl } from '@/lib/stacks/config'
import { ERROR_MESSAGES } from '@/lib/stacks/constants'

type TransactionStatus = 'idle' | 'pending' | 'polling' | 'success' | 'error'

export function ClaimGrid() {
  const { badges, claimBadge, replaceBadges } = useBadges()
  const { isAuthenticated, connectWallet, address } = useStacksWallet()
  const { mintBadge, getTransactionUrl } = useBadgeContract()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [walletConnectDialogOpen, setWalletConnectDialogOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [lastClaimedTier, setLastClaimedTier] = useState<BadgeTier | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const claimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Transaction status states
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle')
  const [transactionTxId, setTransactionTxId] = useState<string | null>(null)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)
  const isPollingActiveRef = useRef<boolean>(false)
  
  // Onchain sync state
  const [isSyncingOnchain, setIsSyncingOnchain] = useState(false)
  const [onchainSyncError, setOnchainSyncError] = useState<string | null>(null)
  // Pre-check pending: avoid double-click when user clicks "Claim badge" (fetch ownership before opening dialog)
  const [isPreCheckPending, setIsPreCheckPending] = useState(false)
  // Gate claimable list until sync has completed once when wallet connected.
  // Prevents "already minted" badges from localStorage appearing as claimable
  // before we've checked the blockchain (avoids useless tx + 1003).
  const [onchainSyncCompletedOnce, setOnchainSyncCompletedOnce] = useState(false)

  // When wallet is disconnected: show 0 claimable badges. Stale offchain state in
  // localStorage (e.g. from previous play) must not appear as "claimable", since
  // we can't mint without a wallet. Avoids confusion where hard refresh keeps
  // old data (localStorage survives Ctrl+Shift+R) but incognito shows clean state.
  // When wallet connected: don't show claimable until onchain sync has completed
  // at least once, so we never show "claimable" for tiers already minted onchain.
  const claimableBadges = useMemo(
    () => {
      if (!isAuthenticated || !address) return []
      if (!onchainSyncCompletedOnce) return []
      return badges
        .filter((badge) => badge.unlocked && !badge.claimed && !badge.onchainMinted)
        .sort((left, right) => left.threshold - right.threshold)
    },
    [badges, isAuthenticated, address, onchainSyncCompletedOnce]
  )
  
  // Badges that are already minted onchain
  const mintedBadges = useMemo(
    () =>
      badges
        .filter((badge) => badge.onchainMinted === true)
        .sort((left, right) => left.threshold - right.threshold),
    [badges]
  )

  const selectedMeta = selectedBadge ? badgeTierMeta[selectedBadge.tier] : null
  const lastClaimedMeta = lastClaimedTier ? badgeTierMeta[lastClaimedTier] : null

  useEffect(() => {
    // Cleanup timers on unmount
    return () => {
      if (claimTimerRef.current) {
        clearTimeout(claimTimerRef.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Close wallet connect dialog when wallet connects
  useEffect(() => {
    if (isAuthenticated && walletConnectDialogOpen) {
      // Wallet connected, close wallet connect dialog and open claim dialog
      setWalletConnectDialogOpen(false)
      if (selectedBadge) {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          setDialogOpen(true)
        }, 300)
      }
    }
  }, [isAuthenticated, walletConnectDialogOpen, selectedBadge])

  /**
   * Sync badge state with onchain data
   * Fetch ownership untuk semua tier via backend API (satu call), lalu update state
   */
  const syncBadgeStateWithOnchain = async () => {
    if (!address || !isAuthenticated) {
      console.log('[ClaimGrid] Cannot sync: wallet not connected')
      return
    }

    setIsSyncingOnchain(true)
    setOnchainSyncError(null)

    try {
      console.log('[ClaimGrid] Starting onchain badge sync for address:', address)
      const ownershipByTier = await fetchBadgeOwnership(address)

      // Onchain is source of truth: set each tier from API. When tokenId is null,
      // clear onchainMinted/claimed so badge can appear claimable if unlocked by score.
      const updatedBadges = badges.map((badge) => {
        const tokenId = getOwnershipForTier(ownershipByTier, badge.tier)
        if (tokenId != null) {
          return {
            ...badge,
            unlocked: badge.unlocked,
            onchainMinted: true,
            claimed: true,
            tokenId,
          }
        }
        // Not minted onchain: clear onchain/claimed state so tier is claimable when unlocked
        return {
          ...badge,
          unlocked: badge.unlocked,
          onchainMinted: false,
          claimed: false,
          claimedAt: undefined,
          tokenId: undefined,
          txId: undefined,
          mintedAt: undefined,
        }
      })

      replaceBadges(updatedBadges)
      setOnchainSyncCompletedOnce(true)
      console.log('[ClaimGrid] Badge state synced with onchain data')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync badge state with onchain data'
      setOnchainSyncError(message)
      console.error('[ClaimGrid] Sync error:', err)
    } finally {
      setIsSyncingOnchain(false)
    }
  }

  // Sync badge state when wallet connects or address changes
  useEffect(() => {
    if (isAuthenticated && address) {
      setOnchainSyncCompletedOnce(false)
      // Small delay to ensure wallet is fully connected
      const syncTimer = setTimeout(() => {
        syncBadgeStateWithOnchain()
      }, 500)
      
      return () => clearTimeout(syncTimer)
    } else {
      setOnchainSyncCompletedOnce(false)
    }
  }, [isAuthenticated, address])

  const handleDialogChange = (open: boolean) => {
    // Don't allow closing during polling or pending
    if (!open && (isClaiming || transactionStatus === 'polling' || transactionStatus === 'pending')) {
      return
    }
    setDialogOpen(open)
    if (!open) {
      setSelectedBadge(null)
      // Reset transaction state when dialog closes
      setTransactionStatus('idle')
      setTransactionTxId(null)
      setTransactionError(null)
      isPollingActiveRef.current = false
      setIsPolling(false)
      setPollCount(0)
      // Clear polling interval if still running
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }

  const handleOpenDialog = async (badge: Badge) => {
    // Pre-check: If badge already minted onchain, don't open dialog
    if (badge.onchainMinted) {
      console.log(`[ClaimGrid] Badge ${badge.tier} already minted, skipping dialog`)
      return
    }

    setIsPreCheckPending(true)
    try {
      // If wallet connected, do a quick ownership check via backend API before opening dialog
      if (isAuthenticated && address) {
        try {
          const ownershipByTier = await fetchBadgeOwnership(address)
          const tokenId = getOwnershipForTier(ownershipByTier, badge.tier)

          if (tokenId != null) {
            // Badge already minted, refresh badge state for all tiers (onchain = source of truth) and don't open dialog
            console.log(`[ClaimGrid] Badge ${badge.tier} already minted onchain, tokenId: ${tokenId}`)
            const updatedBadges = badges.map((b) => {
              const tid = getOwnershipForTier(ownershipByTier, b.tier)
              if (tid != null) {
                return { ...b, unlocked: b.unlocked, onchainMinted: true, claimed: true, tokenId: tid }
              }
              return {
                ...b,
                unlocked: b.unlocked,
                onchainMinted: false,
                claimed: false,
                claimedAt: undefined,
                tokenId: undefined,
                txId: undefined,
                mintedAt: undefined,
              }
            })
            replaceBadges(updatedBadges)
            return
          }
        } catch (err) {
          console.warn('[ClaimGrid] Pre-check error:', err)
          // Continue to dialog (user can retry)
        }
      }
      // Check wallet connection first
      if (!isAuthenticated) {
        setSelectedBadge(badge)
        setWalletConnectDialogOpen(true)
        return
      }
      setSelectedBadge(badge)
      setDialogOpen(true)
    } finally {
      setIsPreCheckPending(false)
    }
  }

  const handleWalletConnect = () => {
    connectWallet()
    // Dialog will close when wallet connects (via effect)
  }

  const handleWalletConnectDialogChange = (open: boolean) => {
    setWalletConnectDialogOpen(open)
    if (!open) {
      setSelectedBadge(null)
    }
  }

  /**
   * Normalize transaction ID format for Stacks API
   * Note: Stacks API might accept both formats (with or without 0x prefix)
   * We'll try both formats if 404 occurs
   */
  const normalizeTxId = (txId: string, withPrefix: boolean = true): string => {
    if (!txId) return txId
    const cleaned = txId.trim().replace(/^0x/i, '')
    return withPrefix ? `0x${cleaned}` : cleaned
  }

  /**
   * Poll transaction status until confirmed or timeout
   */
  const startPolling = (txId: string) => {
    if (!txId || txId.trim() === '') {
      console.error('[ClaimGrid] Invalid txId for polling:', txId)
      setTransactionStatus('error')
      setTransactionError('Invalid transaction ID')
      setIsClaiming(false)
      return
    }

    // Normalize transaction ID format (add 0x prefix if needed)
    const normalizedTxId = normalizeTxId(txId)
    // Store original txId for badge state update (without 0x prefix)
    const originalTxId = txId.trim().replace(/^0x/i, '')
    console.log('[ClaimGrid] Starting polling for txId:', normalizedTxId, '(original:', originalTxId, ')')
    
    setIsPolling(true)
    setTransactionStatus('polling')
    isPollingActiveRef.current = true
    pollCountRef.current = 0
    setPollCount(0)
    const maxPolls = 60 // 5 minutes (60 * 5 seconds)
    
    // Wrap polling logic in try-catch to isolate from wallet extension errors
    const pollTransaction = async () => {
      console.log('[ClaimGrid] pollTransaction called, pollCount:', pollCountRef.current)
      try {
        pollCountRef.current++
        setPollCount(pollCountRef.current)
        console.log(`[ClaimGrid] Polling attempt ${pollCountRef.current}/${maxPolls} for txId:`, normalizedTxId)
        
        const apiUrl = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'testnet'
          ? 'https://api.testnet.hiro.so'
          : 'https://api.hiro.so'
        
        // Use AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        let response: Response
        try {
          // Use correct endpoint: /extended/v1/tx/{tx_id} instead of /v2/transactions/{txId}
          // Remove 0x prefix for extended API (it doesn't need it)
          const txIdForApi = normalizedTxId.replace(/^0x/i, '')
          const fetchUrl = `${apiUrl}/extended/v1/tx/${txIdForApi}`
          console.log(`[ClaimGrid] Fetching transaction from: ${fetchUrl}`)
          response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          console.log(`[ClaimGrid] Fetch response status: ${response.status} ${response.statusText}`)
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            console.warn('[ClaimGrid] Fetch timeout, continuing polling...')
            return // Continue polling on timeout
          }
          console.error('[ClaimGrid] Fetch error:', fetchError)
          throw fetchError
        }
        
        // Handle 404 - transaction might not be in mempool yet (normal for first few polls)
        // OR transaction ID format might be wrong (try alternative format)
        if (response.status === 404) {
          console.log(`[ClaimGrid] Transaction not found (404) - attempt ${pollCountRef.current}`)
          console.log(`[ClaimGrid] Using endpoint: /extended/v1/tx/{tx_id} (correct endpoint)`)
          
          // For first 10 polls, 404 is expected (transaction still propagating)
          if (pollCountRef.current <= 10) {
            console.log(`[ClaimGrid] 404 is normal for attempt ${pollCountRef.current} (transaction propagating), continuing polling...`)
            return // Continue polling, transaction might not be in API yet
          }
          
          // After 10 polls (50 seconds), if still 404, might be an issue
          if (pollCountRef.current >= maxPolls) {
            console.warn('[ClaimGrid] Max polls reached with 404, stopping...')
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            isPollingActiveRef.current = false
            setIsPolling(false)
            setPollCount(0)
            setTransactionStatus('error')
            setTransactionError('Transaction not found after multiple attempts. It may still be processing. Please check Stacks Explorer manually.')
            setIsClaiming(false)
          }
          return
        }
        
        if (!response.ok) {
          console.warn(`[ClaimGrid] API response not OK: ${response.status} ${response.statusText}`)
          // For non-404 errors, continue polling unless max attempts reached
          if (pollCountRef.current >= maxPolls) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            isPollingActiveRef.current = false
            setIsPolling(false)
            setPollCount(0)
            setTransactionStatus('error')
            setTransactionError(`API error (${response.status}). Please check Stacks Explorer.`)
            setIsClaiming(false)
          }
          return
        }

        // Parse JSON with error handling
        let data: any
        try {
          const text = await response.text()
          if (!text || text.trim() === '') {
            console.warn('[ClaimGrid] Empty response from API')
            if (pollCountRef.current >= maxPolls) {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
              isPollingActiveRef.current = false
              setIsPolling(false)
              setTransactionStatus('error')
              setTransactionError('Invalid response from API. Please check Stacks Explorer.')
              setIsClaiming(false)
            }
            return
          }
          data = JSON.parse(text)
        } catch (parseError: any) {
          console.error('[ClaimGrid] JSON parse error:', parseError)
          if (pollCountRef.current >= maxPolls) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            isPollingActiveRef.current = false
            setIsPolling(false)
            setTransactionStatus('error')
            setTransactionError('Failed to parse transaction data. Please check Stacks Explorer.')
            setIsClaiming(false)
          }
          return
        }

        // Check multiple possible status fields (API might use different field names)
        const txStatus = data?.tx_status || data?.status || data?.txStatus
        console.log(`[ClaimGrid] Transaction status: ${txStatus} (attempt ${pollCountRef.current})`)
        console.log('[ClaimGrid] Transaction data keys:', Object.keys(data || {}))
        if (txStatus) {
          console.log('[ClaimGrid] Transaction status found:', txStatus)
        } else {
          console.warn('[ClaimGrid] No transaction status found in response. Full data:', JSON.stringify(data, null, 2))
        }

        // Handle different transaction statuses
        if (txStatus === 'success') {
          console.log('[ClaimGrid] Transaction confirmed! Getting token ID...')
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          isPollingActiveRef.current = false
          setIsPolling(false)
          setPollCount(0)
          
          // Get token ID from contract
          try {
            if (!address || !selectedBadge) {
              console.error('[ClaimGrid] Missing address or selectedBadge')
              // Still update badge without token ID
              // IMPORTANT: Preserve unlocked status
              if (selectedBadge) {
                const updatedBadge: Badge = {
                  ...selectedBadge,
                  unlocked: true, // Explicitly preserve unlocked status
                  claimed: true,
                  claimedAt: new Date().toISOString(),
                  onchainMinted: true,
                  txId: originalTxId, // Use original txId (without 0x) for storage
                  mintedAt: new Date().toISOString(),
                }
                const updatedBadges = badges.map((badge) =>
                  badge.tier === selectedBadge.tier ? updatedBadge : badge
                )
                replaceBadges(updatedBadges)
                setLastClaimedTier(selectedBadge.tier)
                setTransactionStatus('success')
                setIsClaiming(false)
                
                // Re-sync onchain state after successful mint
                if (address && isAuthenticated) {
                  setTimeout(() => {
                    syncBadgeStateWithOnchain()
                  }, 1000)
                }
                
                setTimeout(() => {
                  setDialogOpen(false)
                  setSelectedBadge(null)
                  setTransactionStatus('idle')
                  setTransactionTxId(null)
                }, 3000)
              }
              return
            }
            
            // Add delay before querying token ID (contract state needs time to update)
            console.log('[ClaimGrid] Waiting 2 seconds before querying token ID...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Retry logic for token ID query via backend API (max 3 attempts)
            let ownershipByTier = await fetchBadgeOwnership(address)
            let tokenId: number | null = getOwnershipForTier(ownershipByTier, selectedBadge.tier)
            let retryCount = 0
            const maxRetries = 3

            while (!tokenId && retryCount < maxRetries) {
              console.log(`[ClaimGrid] Token ID not found, retrying... (attempt ${retryCount + 1}/${maxRetries})`)
              await new Promise(resolve => setTimeout(resolve, 2000))
              ownershipByTier = await fetchBadgeOwnership(address)
              tokenId = getOwnershipForTier(ownershipByTier, selectedBadge.tier)
              retryCount++
            }
            
            if (tokenId && !isNaN(tokenId) && tokenId > 0) {
              console.log(`[ClaimGrid] Token ID found: ${tokenId}`)
              
              // Update badge state with onchain data AND claimed state
              // IMPORTANT: Preserve unlocked status
              const updatedBadge = updateBadgeWithOnchainData(selectedBadge, {
                tokenId,
                txId: originalTxId, // Use original txId (without 0x) for storage
                mintedAt: new Date().toISOString(),
              })
              
              // Also set claimed state - PRESERVE unlocked status
              const badgeWithClaimed: Badge = {
                ...updatedBadge,
                unlocked: true, // Explicitly preserve unlocked status
                claimed: true,
                claimedAt: new Date().toISOString(),
              }
              
              // Update badge in state
              const updatedBadges = badges.map((badge) =>
                badge.tier === selectedBadge.tier ? badgeWithClaimed : badge
              )
              
              replaceBadges(updatedBadges)
              
              setLastClaimedTier(selectedBadge.tier)
              
              setTransactionStatus('success')
              setIsClaiming(false)
              
              // Auto-close dialog after 3 seconds
              setTimeout(() => {
                setDialogOpen(false)
                setSelectedBadge(null)
                setTransactionStatus('idle')
                setTransactionTxId(null)
              }, 3000)
            } else {
              // Token ID not found after retries, but transaction succeeded
              // Update badge with onchain data (without tokenId) and claimed state
              // IMPORTANT: Preserve unlocked status
              if (!selectedBadge) return
              
              console.warn(`[ClaimGrid] Token ID not found after ${maxRetries} attempts, updating badge without tokenId`)
              
              const updatedBadge: Badge = {
                ...selectedBadge,
                unlocked: true, // Explicitly preserve unlocked status
                claimed: true,
                claimedAt: new Date().toISOString(),
                onchainMinted: true,
                txId: originalTxId, // Use original txId (without 0x) for storage
                mintedAt: new Date().toISOString(),
              }
              
              const updatedBadges = badges.map((badge) =>
                badge.tier === selectedBadge.tier ? updatedBadge : badge
              )
              
              replaceBadges(updatedBadges)
              setLastClaimedTier(selectedBadge.tier)
              
              setTransactionStatus('success')
              setIsClaiming(false)
              
              setTimeout(() => {
                setDialogOpen(false)
                setSelectedBadge(null)
                setTransactionStatus('idle')
                setTransactionTxId(null)
              }, 3000)
            }
          } catch (error: any) {
            console.error('Error getting token ID:', error)
            // Transaction succeeded but couldn't get token ID
            // Update badge with onchain data (without tokenId) and claimed state
            // IMPORTANT: Preserve unlocked status to avoid badge appearing locked
            if (!selectedBadge) return
            
            const updatedBadge: Badge = {
              ...selectedBadge,
              unlocked: true, // Explicitly preserve unlocked status
              claimed: true,
              claimedAt: new Date().toISOString(),
              onchainMinted: true,
              txId: originalTxId, // Use original txId (without 0x) for storage
              mintedAt: new Date().toISOString(),
            }
            
            const updatedBadges = badges.map((badge) =>
              badge.tier === selectedBadge.tier ? updatedBadge : badge
            )
            
            replaceBadges(updatedBadges)
            setLastClaimedTier(selectedBadge.tier)
            
            setTransactionStatus('success')
            setIsClaiming(false)
            
            setTimeout(() => {
              setDialogOpen(false)
              setSelectedBadge(null)
              setTransactionStatus('idle')
              setTransactionTxId(null)
            }, 3000)
          }
        } else if (txStatus === 'abort_by_response' || txStatus === 'abort_by_post_condition') {
          console.log('[ClaimGrid] Transaction aborted:', txStatus)
          
          // Extract error code from tx_result.repr (format: "(err u1003)")
          let errorCode: number | null = null
          let errorMessage = 'Transaction was rejected by the smart contract.'
          
          if (data?.tx_result?.repr) {
            const repr = data.tx_result.repr
            // Parse error code from format: "(err u1003)" or "(err 1003)"
            const errorMatch = repr.match(/\(err\s+u?(\d+)\)/i)
            if (errorMatch) {
              errorCode = parseInt(errorMatch[1], 10)
              console.log('[ClaimGrid] Extracted error code:', errorCode)
            }
          }
          
          // Map error code to user-friendly message
          if (errorCode) {
            const mappedMessage = ERROR_MESSAGES[errorCode]
            if (mappedMessage) {
              errorMessage = mappedMessage
            } else {
              errorMessage = `Transaction failed with error code ${errorCode}. Please check the transaction details.`
            }
          } else {
            // Fallback to generic message or vm_error if available
            const vmError = data?.vm_error || data?.tx_result?.error || null
            if (vmError) {
              errorMessage = `Transaction failed: ${vmError}`
            } else if (txStatus === 'abort_by_post_condition') {
              errorMessage = 'Transaction failed due to post-condition failure.'
            }
          }
          
          console.error('[ClaimGrid] Transaction error details:', {
            status: txStatus,
            error_code: errorCode,
            tx_result: data?.tx_result,
            error_message: errorMessage,
            full_data: data
          })
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          isPollingActiveRef.current = false
          setIsPolling(false)
          setPollCount(0)
          setTransactionStatus('error')
          setTransactionError(errorMessage)
          setIsClaiming(false)
          // When contract says "already minted" (1003), refresh onchain state so
          // this tier no longer appears as claimable and user sees correct list.
          if (errorCode === 1003) {
            syncBadgeStateWithOnchain()
          }
        } else if (txStatus === 'pending') {
          console.log(`[ClaimGrid] Transaction still pending (attempt ${pollCountRef.current})`)
          // Continue polling
          if (pollCountRef.current >= maxPolls) {
            console.log('[ClaimGrid] Max polls reached, stopping...')
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            isPollingActiveRef.current = false
            setIsPolling(false)
            setPollCount(0)
            setTransactionStatus('error')
            setTransactionError('Transaction timeout. Please check Stacks Explorer.')
            setIsClaiming(false)
          }
        } else {
          // Unknown status, log and continue polling
          console.warn(`[ClaimGrid] Unknown transaction status: ${txStatus}`)
          if (pollCountRef.current >= maxPolls) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            isPollingActiveRef.current = false
            setIsPolling(false)
            setPollCount(0)
            setTransactionStatus('error')
            setTransactionError('Transaction timeout. Please check Stacks Explorer.')
            setIsClaiming(false)
          }
        }
      } catch (error: any) {
        // Ignore wallet extension errors - they don't affect our polling
        const errorMessage = error?.message?.toString() || error?.toString() || ''
        if (
          errorMessage.includes('setImmedia') ||
          errorMessage.includes('inpage.js') ||
          errorMessage.includes('chrome-extension://')
        ) {
          // Wallet extension error, ignore and continue polling
          console.warn('[ClaimGrid] Wallet extension error detected, ignoring...')
          return
        }
        
        console.error('[ClaimGrid] Polling error:', error)
        // Continue polling unless max attempts reached
        if (pollCountRef.current >= maxPolls) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          isPollingActiveRef.current = false
          setIsPolling(false)
          setPollCount(0)
          setTransactionStatus('error')
          setTransactionError(`Network error after ${maxPolls} attempts. Transaction may still be processing. Please check Stacks Explorer.`)
          setIsClaiming(false)
        }
        // Otherwise, continue polling (error might be transient)
      }
    }
    
    // Store timeout ref for cleanup
    const delayTimeoutRef = setTimeout(() => {
      console.log('[ClaimGrid] Delay completed, starting polling...')
      console.log('[ClaimGrid] isPollingActiveRef:', isPollingActiveRef.current)
      console.log('[ClaimGrid] Current polling interval ref:', pollingIntervalRef.current)
      
      // Check if polling is still active (use ref to avoid stale closure)
      if (!isPollingActiveRef.current) {
        console.warn('[ClaimGrid] Polling was cancelled, stopping setup')
        return
      }
      
      // Check if interval already started
      if (pollingIntervalRef.current) {
        console.warn('[ClaimGrid] Polling interval already started, skipping')
        return
      }
      
      // Do first poll immediately after delay
      console.log('[ClaimGrid] Executing first poll...')
      pollTransaction().catch((error) => {
        console.error('[ClaimGrid] Error in first poll:', error)
        // Continue with interval even if first poll fails
      })
      
      // Then start interval polling
      console.log('[ClaimGrid] Starting polling interval...')
      const intervalId = setInterval(() => {
        console.log('[ClaimGrid] Interval poll triggered')
        pollTransaction().catch((error) => {
          console.error('[ClaimGrid] Error in interval poll:', error)
        })
      }, 5000) // Poll every 5 seconds
      
      pollingIntervalRef.current = intervalId
      console.log('[ClaimGrid] Polling interval started with ID:', intervalId)
    }, 3000) // Wait 3 seconds before starting (allows transaction to enter mempool)
    
    // Also do an immediate check after 1 second (don't wait full 3 seconds)
    // This helps catch transactions that are already in mempool
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        // Already started, skip
        return
      }
      console.log('[ClaimGrid] Early check (1 second) - executing poll...')
      pollTransaction().catch((error) => {
        console.error('[ClaimGrid] Error in early poll:', error)
      })
    }, 1000)
  }

  /**
   * Handle claim confirmation with onchain minting
   */
  const handleConfirmClaim = async () => {
    if (!selectedBadge || isClaiming) return
    
    setIsClaiming(true)
    setTransactionStatus('pending')
    setTransactionError(null)
    setTransactionTxId(null)
    
    // Clear any existing timers
    if (claimTimerRef.current) {
      clearTimeout(claimTimerRef.current)
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    try {
      // Get current high score from localStorage
      const currentScore = loadHighScore()
      
      // Ensure score meets threshold (should always be true for unlocked badges)
      if (currentScore < selectedBadge.threshold) {
        setTransactionStatus('error')
        setTransactionError(`Score (${currentScore}) does not meet badge threshold (${selectedBadge.threshold})`)
        setIsClaiming(false)
        return
      }

      // Call mintBadge contract function
      // Note: doContractCall is fire-and-forget, onFinish/onCancel callbacks handle the flow
      console.log('[ClaimGrid] Calling mintBadge with tier:', selectedBadge.tier, 'score:', currentScore)
      
      let txIdReceived = false
      
      await mintBadge({
        tier: selectedBadge.tier,
        score: currentScore,
        onFinish: (data) => {
          console.log('[ClaimGrid] onFinish callback called with data:', data)
          const txId = data?.txId
          
          if (!txId || txId.trim() === '') {
            console.error('[ClaimGrid] Invalid txId in onFinish:', txId)
            setTransactionStatus('error')
            setTransactionError('Transaction submitted but no transaction ID received')
            setIsClaiming(false)
            return
          }
          
          txIdReceived = true
          setTransactionTxId(txId)
          console.log('[ClaimGrid] Transaction ID received:', txId)
          
          // Start polling for transaction confirmation
          startPolling(txId)
        },
        onCancel: () => {
          console.log('[ClaimGrid] Transaction cancelled by user')
          setTransactionStatus('idle')
          setIsClaiming(false)
          setTransactionTxId(null)
        }
      })

      // Note: mintBadge returns immediately, actual result comes via callbacks
      // We don't check result.status here because doContractCall is async
      // The onFinish/onCancel callbacks handle the flow
      
      // If after a short delay we haven't received txId, there might be an issue
      setTimeout(() => {
        if (!txIdReceived && transactionStatus === 'pending') {
          console.warn('[ClaimGrid] No txId received after 10 seconds, transaction might be pending in wallet')
          // Keep pending state, user might still be approving in wallet
        }
      }, 10000)
    } catch (error: any) {
      console.error('Claim error:', error)
      setTransactionStatus('error')
      setTransactionError(error?.message || 'Transaction failed. Please try again.')
      setIsClaiming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {lastClaimedMeta
          ? `Badge claimed. The ${lastClaimedMeta.label} badge is now in your collection.`
          : ''}
      </div>
      {lastClaimedMeta && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <p className="text-sm font-semibold">Badge claimed!</p>
          <p className="text-sm text-emerald-700">
            The {lastClaimedMeta.label} badge is now in your collection.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all border-0"
            >
              <Link href="/badges">View badges</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLastClaimedTier(null)}
              className="rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {isAuthenticated && address && !onchainSyncCompletedOnce ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Checking badge status
          </h2>
          <p className="mt-2 text-sm font-medium text-gray-700">
            Syncing with the blockchain to see which badges you can claim…
          </p>
          <div className="mt-4 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-hidden />
          </div>
        </div>
      ) : claimableBadges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            No badges ready to claim
          </h2>
          <p className="mt-2 text-sm font-medium text-gray-700">
            Play more games to unlock new tiers, or review your current badge
            collection.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button 
              asChild 
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all border-0"
            >
              <Link href="/play">Play now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-2 border-gray-300 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <Link href="/badges">View badges</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Onchain sync status */}
          {isAuthenticated && isSyncingOnchain && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-medium">Syncing badge status with blockchain...</p>
            </div>
          )}
          
          {isAuthenticated && onchainSyncError && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <p className="font-medium">Sync warning: {onchainSyncError}</p>
              <button
                onClick={syncBadgeStateWithOnchain}
                className="mt-2 text-xs underline hover:no-underline"
              >
                Retry sync
              </button>
            </div>
          )}

          {/* Minted badges section */}
          {isAuthenticated && mintedBadges.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Minted Badges ({mintedBadges.length})
                </h3>
                <button
                  onClick={syncBadgeStateWithOnchain}
                  disabled={isSyncingOnchain}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  {isSyncingOnchain ? 'Syncing...' : 'Refresh'}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {mintedBadges.map((badge) => {
                  const meta = badgeTierMeta[badge.tier]
                  return (
                    <div
                      key={badge.tier}
                      className={cn(
                        'rounded-2xl border p-5 shadow-sm opacity-90',
                        meta.softBackground,
                        meta.border
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ring-1 ring-white/60',
                            meta.icon
                          )}>
                            {meta.iconSvg}
                          </div>
                          <div>
                            <p className={cn('text-lg font-semibold', meta.accent)}>
                              {meta.label}
                            </p>
                            <p className="text-sm font-medium text-gray-700">{meta.description}</p>
                          </div>
                        </div>
                        <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                          Minted
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {badge.tokenId !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-600">Token ID</span>
                            <span className={cn('font-semibold', meta.accent)}>
                              #{badge.tokenId}
                            </span>
                          </div>
                        )}
                        {badge.txId && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-600">Transaction</span>
                            <a
                              href={getTransactionUrl(badge.txId) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn('font-semibold underline hover:no-underline', meta.accent)}
                            >
                              View on Explorer
                            </a>
                          </div>
                        )}
                        {badge.mintedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-600">Minted</span>
                            <span className="text-gray-700">
                              {new Date(badge.mintedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Claimable badges section */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-700">
              {claimableBadges.length} badge
              {claimableBadges.length > 1 ? 's' : ''} ready to claim.
            </p>
            {isAuthenticated && (
              <button
                onClick={syncBadgeStateWithOnchain}
                disabled={isSyncingOnchain}
                className="text-xs font-semibold uppercase tracking-wide text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                {isSyncingOnchain ? 'Syncing...' : 'Refresh Status'}
              </button>
            )}
            <Link
              href="/badges"
              className="text-xs font-semibold uppercase tracking-wide text-gray-700 hover:text-gray-900 transition-colors"
            >
              View all badges
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {claimableBadges.map((badge) => {
              const meta = badgeTierMeta[badge.tier]
              const iconClassName = cn(
                'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ring-1 ring-white/60',
                meta.icon
              )

              return (
                <div
                  key={badge.tier}
                  className={cn(
                    'rounded-2xl border p-5 shadow-sm',
                    meta.softBackground,
                    meta.border
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={iconClassName} aria-hidden="true">
                        {meta.iconSvg}
                      </div>
                      <div>
                        <p className={cn('text-lg font-semibold', meta.accent)}>
                          {meta.label}
                        </p>
                        <p className="text-sm font-medium text-gray-700">{meta.description}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Unlocked
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">Score target</span>
                    <span className={cn('font-semibold', meta.accent)}>
                      {badge.threshold.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-medium text-gray-700">
                      Claim now to add it to your collection.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleOpenDialog(badge)}
                      className={cn('rounded-full', meta.button)}
                      disabled={isSyncingOnchain || isPreCheckPending}
                      aria-busy={isPreCheckPending}
                    >
                      {isSyncingOnchain || isPreCheckPending ? 'Checking...' : 'Claim badge'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Wallet Connect Dialog */}
      <Dialog open={walletConnectDialogOpen} onOpenChange={handleWalletConnectDialogChange}>
        {selectedBadge && selectedMeta && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect wallet to mint badge</DialogTitle>
              <DialogDescription>
                To mint this badge as an NFT on the Stacks blockchain, please
                connect your wallet first.
              </DialogDescription>
            </DialogHeader>
            <div
              className={cn(
                'rounded-xl border p-4',
                selectedMeta.softBackground,
                selectedMeta.border
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/60',
                    selectedMeta.icon
                  )}
                  aria-hidden="true"
                >
                  {selectedMeta.iconSvg}
                </div>
                <div>
                  <p className={cn('font-semibold', selectedMeta.accent)}>
                    {selectedMeta.label} badge
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedMeta.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Score target</span>
                <span className={cn('font-semibold', selectedMeta.accent)}>
                  {selectedBadge.threshold.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900 mb-3">
                Why connect your wallet?
              </p>
              <ul className="text-xs sm:text-sm text-amber-800 space-y-1.5 list-disc list-inside">
                <li>Mint badge as NFT on Stacks blockchain</li>
                <li>Verify your achievement onchain</li>
                <li>Showcase your badge in your wallet</li>
                <li>Make your achievement permanent and verifiable</li>
              </ul>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setWalletConnectDialogOpen(false)}
                className="w-full sm:w-auto rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <div className="w-full sm:w-auto">
                <WalletConnect />
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Claim Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        {selectedBadge && selectedMeta && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm badge claim</DialogTitle>
              <DialogDescription>
                This action adds the badge to your collection and marks it as
                claimed. {isAuthenticated && 'Your wallet is connected, so the badge will be minted as an NFT onchain.'}
              </DialogDescription>
            </DialogHeader>
            <div
              className={cn(
                'rounded-xl border p-4',
                selectedMeta.softBackground,
                selectedMeta.border
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/60',
                    selectedMeta.icon
                  )}
                  aria-hidden="true"
                >
                  {selectedMeta.iconSvg}
                </div>
                <div>
                  <p className={cn('font-semibold', selectedMeta.accent)}>
                    {selectedMeta.label} badge
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedMeta.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Score target</span>
                <span className={cn('font-semibold', selectedMeta.accent)}>
                  {selectedBadge.threshold.toLocaleString()}
                </span>
              </div>
            </div>
            {isAuthenticated && transactionStatus === 'idle' && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs sm:text-sm text-green-800">
                  <span className="font-semibold">Wallet connected:</span> This badge will be minted as an NFT on the Stacks blockchain.
                </p>
              </div>
            )}

            {/* Transaction Status: Pending */}
            {transactionStatus === 'pending' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-900">
                      Waiting for wallet approval...
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Please approve the transaction in your wallet extension.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Status: Polling */}
            {transactionStatus === 'polling' && transactionTxId && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-900">
                      Minting badge onchain...
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Transaction submitted. Waiting for confirmation... (Attempt {pollCount}/60)
                    </p>
                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <a
                        href={getTransactionUrl(transactionTxId) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        View on Stacks Explorer
                      </a>
                      <button
                        onClick={() => {
                          // Manual check - trigger polling immediately
                          if (transactionTxId) {
                            console.log('[ClaimGrid] Manual check triggered for txId:', transactionTxId)
                            // Clear current interval and restart with immediate check
                            if (pollingIntervalRef.current) {
                              clearInterval(pollingIntervalRef.current)
                            }
                            startPolling(transactionTxId)
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline text-left sm:text-left"
                      >
                        Check status now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Status: Success */}
            {transactionStatus === 'success' && transactionTxId && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-green-900">
                      Badge minted successfully!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Your badge has been minted as an NFT on the Stacks blockchain.
                    </p>
                    <a
                      href={getTransactionUrl(transactionTxId) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-800 underline mt-2 inline-block break-all"
                    >
                      View transaction on Stacks Explorer
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Status: Error */}
            {transactionStatus === 'error' && transactionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-red-900">
                      Transaction failed
                    </p>
                    <p className="text-xs text-red-700 mt-1 break-words">
                      {transactionError}
                    </p>
                    {transactionTxId && (
                      <a
                        href={getTransactionUrl(transactionTxId) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-600 hover:text-red-800 underline mt-2 inline-block break-all"
                      >
                        View transaction on Stacks Explorer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (transactionStatus === 'polling') {
                    // Don't allow closing during polling
                    return
                  }
                  setDialogOpen(false)
                  setTransactionStatus('idle')
                  setTransactionTxId(null)
                  setTransactionError(null)
                }}
                className="w-full sm:w-auto rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                disabled={isClaiming || transactionStatus === 'polling'}
              >
                {transactionStatus === 'polling' ? 'Transaction in progress...' : 'Cancel'}
              </Button>
              {transactionStatus === 'error' ? (
                <Button
                  onClick={handleConfirmClaim}
                  disabled={isClaiming}
                  className={cn('w-full sm:w-auto rounded-full', selectedMeta.button)}
                >
                  {isClaiming ? 'Retrying...' : 'Try again'}
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmClaim}
                  disabled={isClaiming || transactionStatus === 'polling' || transactionStatus === 'success'}
                  className={cn('w-full sm:w-auto rounded-full', selectedMeta.button)}
                >
                  {transactionStatus === 'pending' && 'Waiting for approval...'}
                  {transactionStatus === 'polling' && 'Minting...'}
                  {transactionStatus === 'success' && 'Success!'}
                  {transactionStatus === 'idle' && (isClaiming ? 'Claiming...' : 'Confirm claim')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

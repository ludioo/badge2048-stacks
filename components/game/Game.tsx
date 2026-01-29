'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useGame } from '@/hooks/useGame'
import { useBadges } from '@/hooks/useBadges'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { useSubmitScore } from '@/hooks/useSubmitScore'
import { useLeaderboardRank } from '@/hooks/useLeaderboardRank'
import type { BadgeState, BadgeTier } from '@/lib/game/types'
import { updateHighScore } from '@/lib/highScore'
import { GameBoard } from './GameBoard'
import { ScoreDisplay } from './ScoreDisplay'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function Game() {
  const { state, tiles, move, restart, lastMoveEffects, invalidMoveTick } = useGame()
  const { unlockBadges } = useBadges()
  const { address } = useStacksWallet()
  const { submitScore, status: submitStatus, error: submitError } = useSubmitScore()
  const { data: rankData, refetch: refetchRank } = useLeaderboardRank(address)
  const prefersReducedMotion = useReducedMotion()
  const gameOverSubmitRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null)
  const gestureHandledRef = useRef(false)
  const swipeThreshold = 30
  const [pulseBoard, setPulseBoard] = useState(false)
  const [shakeBoard, setShakeBoard] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hapticsEnabled, setHapticsEnabled] = useState(false)
  const [canVibrate, setCanVibrate] = useState(false)
  const [badgeToast, setBadgeToast] = useState<{ tiers: BadgeTier[]; score: number } | null>(null)
  const [gameOverUnlocks, setGameOverUnlocks] = useState<BadgeTier[]>([])
  const [gameOverBadges, setGameOverBadges] = useState<BadgeState>([])
  const [gameOverBestTile, setGameOverBestTile] = useState(0)
  const audioRef = useRef<AudioContext | null>(null)
  const lastGameOverScoreRef = useRef<number | null>(null)

  const badgeTierLabels = useMemo(() => ({
    bronze: { label: 'Bronze', className: 'bg-[#FD9E7F] text-[#F4622F] border-[#FB6331]' },
    silver: { label: 'Silver', className: 'bg-[#FB6331] text-white border-[#F4622F]' },
    gold: { label: 'Gold', className: 'bg-[#F4622F] text-white border-[#E8552A]' },
    elite: { label: 'Elite', className: 'bg-[#E8552A] text-white border-[#DC4824]' },
  }), [])

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (showHint) {
      setShowHint(false)
    }
    move(direction)
  }, [move, showHint])


  useEffect(() => {
    const hasVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator
    setCanVibrate(hasVibrate)
    if (hasVibrate) {
      setHapticsEnabled(true)
    }
  }, [])

  useEffect(() => {
    updateHighScore(state.score)
  }, [state.score])

  useEffect(() => {
    if (state.status !== 'gameover') {
      lastGameOverScoreRef.current = null
      setGameOverUnlocks([])
      setGameOverBadges([])
      setGameOverBestTile(0)
      return
    }

    if (lastGameOverScoreRef.current === state.score) return
    const bestTile = state.board.reduce<number>((maxRow, row) => {
      const rowMax = row.reduce<number>((maxCell, cell) => Math.max(maxCell, cell ?? 0), 0)
      return Math.max(maxRow, rowMax)
    }, 0)
    const unlockMetric = Math.max(state.score, bestTile)
    const { newlyUnlocked, badges } = unlockBadges(unlockMetric)

    setGameOverBestTile(bestTile)
    setGameOverBadges(badges)
    setGameOverUnlocks(newlyUnlocked)

    if (newlyUnlocked.length > 0) {
      setBadgeToast({ tiers: newlyUnlocked, score: unlockMetric })
    }
    lastGameOverScoreRef.current = state.score
  }, [state.status, state.score, state.board, unlockBadges])

  useEffect(() => {
    if (!badgeToast) return
    const timeout = setTimeout(() => setBadgeToast(null), 4200)
    return () => clearTimeout(timeout)
  }, [badgeToast])

  // Auto-submit score to leaderboard on game over when wallet connected (once per game over)
  useEffect(() => {
    if (state.status !== 'gameover') {
      gameOverSubmitRef.current = false
      return
    }
    if (!address || gameOverSubmitRef.current) return
    gameOverSubmitRef.current = true
    submitScore(address, state.score).then(() => refetchRank()).catch(() => {})
  }, [state.status, state.score, address, submitScore, refetchRank])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const directionMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      } as const

      const direction = directionMap[event.key as keyof typeof directionMap]
      if (!direction) return

      event.preventDefault()
      handleMove(direction)
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleMove])

  useEffect(() => {
    setPulseBoard(true)
    const timeout = setTimeout(() => setPulseBoard(false), 180)
    return () => clearTimeout(timeout)
  }, [state.score])

  useEffect(() => {
    if (!invalidMoveTick) return
    setShakeBoard(true)
    const timeout = setTimeout(() => setShakeBoard(false), 240)
    return () => clearTimeout(timeout)
  }, [invalidMoveTick])

  useEffect(() => {
    const timeout = setTimeout(() => setShowHint(false), 2400)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    return () => {
      if (!audioRef.current) return
      audioRef.current.close().catch(() => undefined)
      audioRef.current = null
    }
  }, [])

  const playTone = useCallback((frequency: number, durationMs: number, type: OscillatorType, gainValue: number) => {
    if (!soundEnabled) return
    const AudioContextConstructor =
      window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) return

    if (!audioRef.current) {
      audioRef.current = new AudioContextConstructor()
    }

    const ctx = audioRef.current
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => undefined)
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    gainNode.gain.value = gainValue
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000)
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + durationMs / 1000)
  }, [soundEnabled])

  useEffect(() => {
    if (!lastMoveEffects.spawned && lastMoveEffects.mergeCount === 0) return

    const timeouts: number[] = []

    if (soundEnabled) {
      if (lastMoveEffects.spawned) {
        playTone(320, 90, 'sine', 0.08)
      }
      if (lastMoveEffects.mergeCount > 0) {
        timeouts.push(
          window.setTimeout(() => playTone(520, 120, 'triangle', 0.1), 80)
        )
      }
    }

    if (hapticsEnabled && canVibrate) {
      if (lastMoveEffects.mergeCount > 0) {
        navigator.vibrate([15, 30])
      } else if (lastMoveEffects.spawned) {
        navigator.vibrate(10)
      }
    }

    return () => {
      timeouts.forEach((id) => clearTimeout(id))
    }
  }, [lastMoveEffects, soundEnabled, hapticsEnabled, canVibrate, playTone])

  const getSwipeDirection = (deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) < swipeThreshold && Math.abs(deltaY) < swipeThreshold) {
      return null
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    }

    return deltaY > 0 ? 'down' : 'up'
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    gestureHandledRef.current = false
  }

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!touchStartRef.current || gestureHandledRef.current) return
    const touch = event.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const direction = getSwipeDirection(deltaX, deltaY)
    if (!direction) return

    event.preventDefault()
    gestureHandledRef.current = true
    handleMove(direction)
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
    gestureHandledRef.current = false
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return
    mouseStartRef.current = { x: event.clientX, y: event.clientY }
    gestureHandledRef.current = false
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!mouseStartRef.current || gestureHandledRef.current) return
    const deltaX = event.clientX - mouseStartRef.current.x
    const deltaY = event.clientY - mouseStartRef.current.y
    const direction = getSwipeDirection(deltaX, deltaY)
    if (!direction) return

    gestureHandledRef.current = true
    handleMove(direction)
  }

  const handleMouseUp = () => {
    mouseStartRef.current = null
    gestureHandledRef.current = false
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
      <AnimatePresence>
        {badgeToast && (
          <motion.div
            key={`${badgeToast.score}-${badgeToast.tiers.join('-')}`}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none fixed left-1/2 top-4 z-[60] w-[92vw] max-w-sm -translate-x-1/2 rounded-2xl border border-[#FB6331] bg-white/95 px-4 py-3 text-center shadow-lg backdrop-blur"
            role="status"
            aria-live="polite"
          >
            <div className="text-sm font-semibold text-[#F4622F]">Badge unlocked</div>
            <div className="text-xs text-[#4B5563]">
              You reached {badgeToast.score.toLocaleString()} points.
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {badgeToast.tiers.map((tier) => {
                const badge = badgeTierLabels[tier]
                return (
                  <span
                    key={tier}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ScoreDisplay score={state.score} />

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <Button
          size="sm"
          variant={soundEnabled ? 'default' : 'outline'}
          aria-pressed={soundEnabled}
          onClick={() => setSoundEnabled((value) => !value)}
            className={cn(
            'min-w-[96px] min-h-[44px] rounded-full',
            soundEnabled
              ? 'bg-[#F4622F] text-white hover:bg-[#FB6331]'
              : 'bg-white text-[#4B5563] border-[#FD9E7F] hover:bg-[#FD9E7F]/10'
          )}
        >
          Sound {soundEnabled ? 'On' : 'Off'}
        </Button>
        <Button
          size="sm"
          variant={hapticsEnabled ? 'default' : 'outline'}
          aria-pressed={hapticsEnabled}
          disabled={!canVibrate}
          onClick={() => setHapticsEnabled((value) => !value)}
            className={cn(
            'min-w-[96px] min-h-[44px] rounded-full',
            !canVibrate && 'opacity-60',
            hapticsEnabled
              ? 'bg-[#E8552A] text-white hover:bg-[#F4622F]'
              : 'bg-white text-[#4B5563] border-[#FD9E7F] hover:bg-[#FD9E7F]/10'
          )}
        >
          Haptic {canVibrate ? (hapticsEnabled ? 'On' : 'Off') : 'Unavailable'}
        </Button>
      </div>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            className="rounded-full bg-[#F4622F] px-3 py-1 text-[11px] text-white shadow-sm"
          >
            Swipe, drag, or use arrow keys to move tiles
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.div
          animate={{
            scale: prefersReducedMotion ? 1 : pulseBoard ? 1.01 : 1,
            x: prefersReducedMotion ? 0 : shakeBoard ? [0, -6, 6, -4, 4, 0] : 0,
          }}
          transition={{
            scale: prefersReducedMotion ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' },
            x: prefersReducedMotion ? { duration: 0 } : { duration: 0.24, ease: 'easeInOut' },
          }}
        >
          <GameBoard tiles={tiles} />
        </motion.div>
      </div>

      <Dialog open={state.status === 'gameover'}>
        <DialogContent
          className={cn(
            'w-[92vw] max-w-sm sm:max-w-md',
            'rounded-2xl border border-[#FD9E7F]/40',
            'bg-gradient-to-br from-white via-[#FD9E7F]/10 to-[#FD9E7F]/20',
            'shadow-[0_24px_60px_rgba(244,98,47,0.18)]',
            '[&>button]:!hidden'
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-2xl sm:text-3xl text-[#F4622F]">
              Game Over
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base text-white font-medium">
              Final Score
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col items-center gap-4">
            <div className="rounded-xl border border-[#FD9E7F] bg-white px-6 py-3 text-3xl font-bold text-[#F4622F] shadow-sm">
              {state.score.toLocaleString()}
            </div>
            {gameOverBestTile > 0 && (
              <div className="text-xs font-medium uppercase tracking-wide text-white">
                Best Tile: <span className="text-[#F4622F]">{gameOverBestTile.toLocaleString()}</span>
              </div>
            )}
            {gameOverUnlocks.length > 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-[#FB6331] bg-[#FD9E7F]/20 px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#F4622F]">
                  Badges Unlocked
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {gameOverUnlocks.map((tier) => {
                    const badge = badgeTierLabels[tier]
                    return (
                      <span
                        key={tier}
                        className={cn(
                          'rounded-full border bg-white px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {gameOverBadges.length > 0 && (
              <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-[#FD9E7F] bg-white px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                  Badge Status
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {gameOverBadges.map((badge) => {
                    const tierMeta = badgeTierLabels[badge.tier]
                    const status = badge.claimed
                      ? { label: 'Claimed', className: 'bg-[#E8552A]/20 text-[#E8552A] border-[#E8552A]' }
                      : badge.unlocked
                      ? { label: 'Unlocked', className: 'bg-[#FB6331]/20 text-[#FB6331] border-[#FB6331]' }
                      : { label: 'Locked', className: 'bg-[#FD9E7F]/20 text-[#6B7280] border-[#FD9E7F]' }
                    return (
                      <div key={badge.tier} className="flex items-center gap-1.5 rounded-full border border-[#FD9E7F] bg-white px-2 py-1 text-[11px]">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide',
                            tierMeta.className
                          )}
                        >
                          {tierMeta.label}
                        </span>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide',
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="w-full rounded-xl border border-[#FD9E7F] bg-white px-4 py-3 text-center">
              {!address ? (
                <p className="text-sm text-[#4B5563]">
                  Connect your wallet to submit your score to the leaderboard.
                </p>
              ) : submitStatus === 'submitting' ? (
                <p className="text-sm text-[#4B5563]">Submitting score…</p>
              ) : submitStatus === 'error' ? (
                <p className="text-sm text-[#E8552A]">{submitError ?? 'Failed to submit score'}</p>
              ) : rankData ? (
                <p className="text-sm font-semibold text-[#F4622F]">
                  Your rank: <span className="text-[#E8552A]">#{rankData.rank}</span> of {rankData.total}
                </p>
              ) : (
                <p className="text-sm text-[#4B5563]">Score submitted.</p>
              )}
              <Link
                href="/leaderboard"
                className="mt-2 inline-block text-sm font-medium text-[#F4622F] underline hover:no-underline"
              >
                View Leaderboard
              </Link>
            </div>
            <Button
              onClick={restart}
              size="lg"
              className="w-full sm:w-auto bg-[#F4622F] text-white hover:bg-[#FB6331]"
            >
              Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-center text-xs sm:text-sm text-[#4B5563] max-w-md px-4">
        <p>Use arrow keys, swipe (mobile), or drag (desktop) to move tiles. Combine tiles with the same number to reach 2048!</p>
      </div>
    </div>
  )
}
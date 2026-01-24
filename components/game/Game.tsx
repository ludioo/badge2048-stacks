'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useGame } from '@/hooks/useGame'
import { useBadges } from '@/hooks/useBadges'
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
    bronze: { label: 'Bronze', className: 'bg-amber-100 text-amber-900 border-amber-200' },
    silver: { label: 'Silver', className: 'bg-slate-100 text-slate-800 border-slate-200' },
    gold: { label: 'Gold', className: 'bg-yellow-100 text-yellow-900 border-yellow-200' },
    elite: { label: 'Elite', className: 'bg-purple-100 text-purple-900 border-purple-200' },
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none fixed left-1/2 top-4 z-[60] w-[92vw] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-center shadow-lg backdrop-blur"
            role="status"
            aria-live="polite"
          >
            <div className="text-sm font-semibold text-slate-900">Badge unlocked</div>
            <div className="text-xs text-slate-600">
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
            'min-w-[96px] rounded-full',
            soundEnabled
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
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
            'min-w-[96px] rounded-full',
            !canVibrate && 'opacity-60',
            hapticsEnabled
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-white shadow-sm"
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.div
          animate={{
            scale: pulseBoard ? 1.01 : 1,
            x: shakeBoard ? [0, -6, 6, -4, 4, 0] : 0,
          }}
          transition={{
            scale: { duration: 0.16, ease: 'easeOut' },
            x: { duration: 0.24, ease: 'easeInOut' },
          }}
        >
          <GameBoard tiles={tiles} />
        </motion.div>
      </div>

      <Dialog open={state.status === 'gameover'}>
        <DialogContent
          className={cn(
            'w-[92vw] max-w-sm sm:max-w-md',
            'rounded-2xl border border-slate-200/80',
            'bg-gradient-to-br from-white via-slate-50 to-slate-100',
            'shadow-[0_24px_60px_rgba(15,23,42,0.18)]'
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-2xl sm:text-3xl text-slate-900">
              Game Over
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base text-slate-600">
              Final Score
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col items-center gap-4">
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-3xl font-bold text-slate-800 shadow-sm">
              {state.score.toLocaleString()}
            </div>
            {gameOverBestTile > 0 && (
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Best Tile: <span className="text-slate-800">{gameOverBestTile.toLocaleString()}</span>
              </div>
            )}
            {gameOverUnlocks.length > 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
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
              <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Badge Status
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {gameOverBadges.map((badge) => {
                    const tierMeta = badgeTierLabels[badge.tier]
                    const status = badge.claimed
                      ? { label: 'Claimed', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
                      : badge.unlocked
                      ? { label: 'Unlocked', className: 'bg-blue-100 text-blue-800 border-blue-200' }
                      : { label: 'Locked', className: 'bg-slate-100 text-slate-700 border-slate-200' }
                    return (
                      <div key={badge.tier} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px]">
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
            <Button
              onClick={restart}
              size="lg"
              className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800"
            >
              Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-center text-xs sm:text-sm text-gray-600 max-w-md px-4">
        <p>Use arrow keys, swipe (mobile), or drag (desktop) to move tiles. Combine tiles with the same number to reach 2048!</p>
      </div>
    </div>
  )
}
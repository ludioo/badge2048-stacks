'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScoreDisplayProps {
  score: number
  className?: string
}

export function ScoreDisplay({ score, className }: ScoreDisplayProps) {
  const [delta, setDelta] = useState<number | null>(null)
  const prevScoreRef = useRef(score)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const prev = prevScoreRef.current
    if (score > prev) {
      setDelta(score - prev)
    }
    prevScoreRef.current = score
  }, [score])

  useEffect(() => {
    if (delta === null) return
    const timeout = setTimeout(() => setDelta(null), 700)
    return () => clearTimeout(timeout)
  }, [delta])

  return (
    <div className={cn(
      'flex flex-col items-center gap-2',
      className
    )}>
      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        Score
      </div>
      <div className="relative">
        <div className={cn(
          'px-4 sm:px-5 py-2.5 bg-white rounded-xl border border-slate-200',
          'text-xl sm:text-2xl font-bold text-slate-800',
          'min-w-[120px] sm:min-w-[128px] text-center',
          'shadow-[0_10px_20px_rgba(15,23,42,0.08)]'
        )}>
          {score.toLocaleString()}
        </div>
        <AnimatePresence>
          {delta !== null && (
            <motion.span
              key={delta}
              initial={prefersReducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: prefersReducedMotion ? 0 : -12, scale: 1 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -24, scale: prefersReducedMotion ? 1 : 0.95 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
              className="absolute -right-2 -top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs font-semibold text-white shadow"
            >
              +{delta.toLocaleString()}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
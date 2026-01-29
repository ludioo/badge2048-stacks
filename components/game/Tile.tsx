'use client'

import React, { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TileProps {
  value: number | null
  row: number
  col: number
  isNew?: boolean
  isMerged?: boolean
  className?: string
}

const getTileColors = (value: number | null) => {
  if (!value) return 'bg-white/20 text-[#6B7280]'

  // Stacks color progression: white -> tangerine-dream -> tiger-flame-2 -> tiger-flame
  const colors = {
    2: 'bg-gradient-to-br from-white to-[#FD9E7F] text-[#F4622F] border-[#FD9E7F]',
    4: 'bg-gradient-to-br from-[#FD9E7F] to-[#FB6331] text-white border-[#FB6331]',
    8: 'bg-gradient-to-br from-[#FB6331] to-[#F4622F] text-white border-[#F4622F]',
    16: 'bg-gradient-to-br from-[#F4622F] to-[#E8552A] text-white border-[#E8552A]',
    32: 'bg-gradient-to-br from-[#E8552A] to-[#DC4824] text-white border-[#DC4824]',
    64: 'bg-gradient-to-br from-[#DC4824] to-[#D03B1E] text-white border-[#D03B1E]',
    128: 'bg-gradient-to-br from-[#D03B1E] to-[#C42E18] text-white border-[#C42E18]',
    256: 'bg-gradient-to-br from-[#C42E18] to-[#B82112] text-white border-[#B82112]',
    512: 'bg-gradient-to-br from-[#B82112] to-[#AC140C] text-white border-[#AC140C]',
    1024: 'bg-gradient-to-br from-[#AC140C] to-[#A00706] text-white border-[#A00706]',
    2048: 'bg-gradient-to-br from-[#A00706] to-[#940000] text-white border-[#940000] shadow-[0_0_20px_rgba(244,98,47,0.6)]',
  }

  return (
    colors[value as keyof typeof colors] ||
    'bg-gradient-to-br from-[#940000] to-[#880000] text-white border-[#880000] shadow-[0_0_25px_rgba(244,98,47,0.8)]'
  )
}

const getFontSize = (value: number | null) => {
  if (!value) return 'text-[clamp(0.9rem,2.8vw,1.4rem)]'
  if (value < 100) return 'text-[clamp(1rem,3.2vw,1.7rem)]'
  if (value < 1000) return 'text-[clamp(0.9rem,2.8vw,1.5rem)]'
  if (value < 10000) return 'text-[clamp(0.75rem,2.4vw,1.2rem)]'
  return 'text-[clamp(0.65rem,2vw,1rem)]'
}

const TileComponent = ({ value, row, col, isNew = false, isMerged = false, className }: TileProps) => {
  const prefersReducedMotion = useReducedMotion()
  const style = useMemo(
    () => ({
      gridRowStart: row + 1,
      gridColumnStart: col + 1,
    }),
    [row, col]
  )

  return (
    <motion.div
      className={cn(
        'w-full h-full rounded-md border-2',
        'flex items-center justify-center',
        'font-bold leading-none tracking-tight select-none',
        'shadow-[0_6px_14px_rgba(15,23,42,0.18)]',
        'ring-1 ring-white/40',
        'transition-shadow duration-200 ease-out',
        getTileColors(value),
        getFontSize(value),
        className
      )}
      style={style}
      layout={!prefersReducedMotion}
      transition={{
        layout: prefersReducedMotion ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' },
      }}
      initial={!prefersReducedMotion && isNew ? { scale: 0, opacity: 0 } : false}
      animate={
        prefersReducedMotion
          ? {}
          : isNew
          ? {
              scale: 1,
              opacity: 1,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20,
                duration: 0.2,
              },
            }
          : isMerged
          ? {
              scale: [1, 1.1, 1],
              transition: {
                duration: 0.2,
                times: [0, 0.5, 1],
              },
            }
          : {}
      }
      data-testid="tile"
      data-value={value ?? ''}
    >
      {value || ''}
    </motion.div>
  )
}

export const Tile = React.memo(TileComponent, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.row === next.row &&
    prev.col === next.col &&
    prev.isNew === next.isNew &&
    prev.isMerged === next.isMerged &&
    prev.className === next.className
  )
})

Tile.displayName = 'Tile'
'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
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
  if (!value) return 'bg-gray-50 text-gray-400'

  const colors = {
    2: 'bg-gradient-to-br from-amber-50 to-amber-200 text-amber-800 border-amber-200',
    4: 'bg-gradient-to-br from-amber-100 to-amber-300 text-amber-900 border-amber-300',
    8: 'bg-gradient-to-br from-orange-100 to-orange-300 text-orange-900 border-orange-300',
    16: 'bg-gradient-to-br from-orange-200 to-orange-400 text-white border-orange-400',
    32: 'bg-gradient-to-br from-rose-200 to-rose-400 text-white border-rose-400',
    64: 'bg-gradient-to-br from-red-300 to-red-500 text-white border-red-500',
    128: 'bg-gradient-to-br from-yellow-200 to-yellow-400 text-white border-yellow-400',
    256: 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white border-yellow-500',
    512: 'bg-gradient-to-br from-emerald-200 to-emerald-400 text-white border-emerald-400',
    1024: 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-white border-emerald-500',
    2048: 'bg-gradient-to-br from-sky-300 to-sky-500 text-white border-sky-500',
  }

  return (
    colors[value as keyof typeof colors] ||
    'bg-gradient-to-br from-purple-400 to-purple-600 text-white border-purple-500'
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
      layout
      transition={{ layout: { duration: 0.16, ease: 'easeOut' } }}
      initial={isNew ? { scale: 0, opacity: 0 } : false}
      animate={
        isNew
          ? {
              scale: 1,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.2
              }
            }
          : isMerged
          ? {
              scale: [1, 1.1, 1],
              transition: {
                duration: 0.2,
                times: [0, 0.5, 1]
              }
            }
          : {}
      }
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
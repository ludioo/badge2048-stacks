'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { BOARD_SIZE } from '@/lib/game/constants'
import { Tile } from './Tile'

interface GameBoardProps {
  tiles: Array<{
    id: string
    value: number
    row: number
    col: number
    isNew: boolean
    isMerged: boolean
  }>
  className?: string
}

export function GameBoard({ tiles, className }: GameBoardProps) {
  const gridStyle = {
    '--cell-size': 'clamp(56px, 17vw, 96px)',
    '--gap-size': 'clamp(8px, 2.2vw, 14px)',
    '--pad-size': 'clamp(12px, 2.6vw, 20px)',
  } as React.CSSProperties

  const gridTemplateStyle = {
    gridTemplateColumns: `repeat(${BOARD_SIZE}, var(--cell-size))`,
    gridTemplateRows: `repeat(${BOARD_SIZE}, var(--cell-size))`,
    gap: 'var(--gap-size)',
    padding: 'var(--pad-size)',
  } as React.CSSProperties

  return (
    <div
      className={cn('relative w-fit mx-auto', className)}
      style={gridStyle}
      data-testid="game-board"
      aria-label="2048 game board"
    >
      {/* Fixed 4x4 grid = 16 cells (background) */}
      <div
        className={cn(
          'inline-grid rounded-xl bg-gradient-to-br from-white via-[#FD9E7F]/20 to-[#FD9E7F]/30',
          'ring-1 ring-[#FD9E7F]/30 shadow-[0_16px_30px_rgba(244,98,47,0.12)]'
        )}
        style={gridTemplateStyle}
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => (
          <div
            key={`cell-${index}`}
            className={cn(
              'w-full h-full rounded-md border border-[#FD9E7F]/40',
              'bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
            )}
          />
        ))}
      </div>

      {/* Tiles overlay on top of the grid */}
      <div className="pointer-events-none absolute inset-0 inline-grid" style={gridTemplateStyle}>
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            value={tile.value}
            row={tile.row}
            col={tile.col}
            isNew={tile.isNew}
            isMerged={tile.isMerged}
            className="z-10"
          />
        ))}
      </div>
    </div>
  )
}
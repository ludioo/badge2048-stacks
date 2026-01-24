'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Badge, BadgeTier } from '@/lib/game/types'

type TierMeta = {
  label: string
  description: string
  accent: string
  background: string
  border: string
  softBackground: string
  icon: string
  iconSvg: ReactNode
}

const tierMeta: Record<BadgeTier, TierMeta> = {
  bronze: {
    label: 'Bronze',
    description: 'First milestone achievement',
    accent: 'text-amber-900',
    background: 'bg-gradient-to-br from-amber-100 to-amber-200',
    border: 'border-amber-200',
    softBackground: 'bg-amber-50',
    icon: 'bg-amber-200 text-amber-900',
    iconSvg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M8 12l-2 8 6-4 6 4-2-8" />
      </svg>
    ),
  },
  silver: {
    label: 'Silver',
    description: 'Intermediate achievement',
    accent: 'text-slate-800',
    background: 'bg-gradient-to-br from-slate-100 to-slate-200',
    border: 'border-slate-200',
    softBackground: 'bg-slate-50',
    icon: 'bg-slate-200 text-slate-800',
    iconSvg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v6c0 5-3 9-7 11-4-2-7-6-7-11V6l7-3z" />
      </svg>
    ),
  },
  gold: {
    label: 'Gold',
    description: 'Advanced achievement',
    accent: 'text-yellow-900',
    background: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
    border: 'border-yellow-200',
    softBackground: 'bg-yellow-50',
    icon: 'bg-yellow-200 text-yellow-900',
    iconSvg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8l4 3 5-6 5 6 4-3v9H3z" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
  elite: {
    label: 'Elite',
    description: 'Expert level achievement',
    accent: 'text-purple-900',
    background: 'bg-gradient-to-br from-purple-100 to-purple-200',
    border: 'border-purple-200',
    softBackground: 'bg-purple-50',
    icon: 'bg-purple-200 text-purple-900',
    iconSvg: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L6 13h5l-1 9 7-11h-5l1-9z" />
      </svg>
    ),
  },
}

type BadgeCardProps = {
  badge: Badge
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const meta = tierMeta[badge.tier]
  const isClaimed = badge.claimed
  const isUnlocked = badge.unlocked && !badge.claimed
  const isLocked = !badge.unlocked
  const claimedAt = badge.claimedAt

  const statusLabel = isClaimed ? 'Owned' : isUnlocked ? 'Claim' : 'Locked'
  const statusClassName = cn(
    'rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
    isClaimed
      ? 'border-white/70 bg-white/70 text-slate-900'
      : isUnlocked
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-slate-100 text-slate-500'
  )

  const cardClassName = cn(
    'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow',
    isLocked
      ? 'border-slate-200 bg-slate-50 text-slate-500'
      : isClaimed
      ? `${meta.background} ${meta.border} shadow-md`
      : `${meta.softBackground} ${meta.border}`
  )

  const iconClassName = cn(
    'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ring-1 ring-white/60',
    isLocked ? 'bg-slate-200 text-slate-500' : meta.icon
  )

  const formatClaimedAt = (value?: string) => {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <div className={cardClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={iconClassName} aria-hidden="true">
            {meta.iconSvg}
          </div>
          <div>
            <p className={cn('text-lg font-semibold', isLocked ? 'text-slate-500' : meta.accent)}>
              {meta.label}
            </p>
            <p className={cn('text-sm', isLocked ? 'text-slate-400' : 'text-slate-600')}>
              {meta.description}
            </p>
          </div>
        </div>
        <span className={statusClassName}>{statusLabel}</span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Score target</span>
          <span className={cn('font-semibold', isLocked ? 'text-slate-500' : meta.accent)}>
            {badge.threshold.toLocaleString()}
          </span>
        </div>

        {isLocked && (
          <p className="mt-3 text-xs text-slate-500">
            Reach {badge.threshold.toLocaleString()} score to unlock.
          </p>
        )}

        {isUnlocked && (
          <p className="mt-3 text-xs text-emerald-700">
            Claim available in the{' '}
            <Link href="/claim" className="font-semibold underline underline-offset-2">
              Claim page
            </Link>
            .
          </p>
        )}

        {isClaimed && (
          <div className="mt-3 space-y-1 text-xs text-slate-700">
            <p>Claimed and displayed in your collection.</p>
            <p className="text-slate-500">Last updated: {formatClaimedAt(claimedAt)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

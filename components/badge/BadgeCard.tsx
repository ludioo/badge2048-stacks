'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Badge } from '@/lib/game/types'
import { badgeTierMeta } from '@/components/badge/badgeMeta'

type BadgeCardProps = {
  badge: Badge
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const meta = badgeTierMeta[badge.tier]
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
    'relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-sm transition-shadow',
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

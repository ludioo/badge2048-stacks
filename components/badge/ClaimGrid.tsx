'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Badge, BadgeTier } from '@/lib/game/types'
import { useBadges } from '@/hooks/useBadges'
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
import { cn } from '@/lib/utils'

export function ClaimGrid() {
  const { badges, claimBadge } = useBadges()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [lastClaimedTier, setLastClaimedTier] = useState<BadgeTier | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const claimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const claimableBadges = useMemo(
    () =>
      badges
        .filter((badge) => badge.unlocked && !badge.claimed)
        .sort((left, right) => left.threshold - right.threshold),
    [badges]
  )

  const selectedMeta = selectedBadge ? badgeTierMeta[selectedBadge.tier] : null
  const lastClaimedMeta = lastClaimedTier ? badgeTierMeta[lastClaimedTier] : null

  useEffect(() => {
    return () => {
      if (claimTimerRef.current) {
        clearTimeout(claimTimerRef.current)
      }
    }
  }, [])

  const handleDialogChange = (open: boolean) => {
    if (!open && isClaiming) return
    setDialogOpen(open)
    if (!open) {
      setSelectedBadge(null)
    }
  }

  const handleOpenDialog = (badge: Badge) => {
    setSelectedBadge(badge)
    setDialogOpen(true)
  }

  const handleConfirmClaim = () => {
    if (!selectedBadge || isClaiming) return
    setIsClaiming(true)
    if (claimTimerRef.current) {
      clearTimeout(claimTimerRef.current)
    }
    claimTimerRef.current = setTimeout(() => {
      const { claimedBadge } = claimBadge(selectedBadge.tier)
      if (claimedBadge) {
        setLastClaimedTier(claimedBadge.tier)
      }
      setIsClaiming(false)
      setDialogOpen(false)
      setSelectedBadge(null)
    }, 300)
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

      {claimableBadges.length === 0 ? (
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-700">
              {claimableBadges.length} badge
              {claimableBadges.length > 1 ? 's' : ''} ready to claim.
            </p>
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
                    >
                      Claim badge
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        {selectedBadge && selectedMeta && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm badge claim</DialogTitle>
              <DialogDescription>
                This action adds the badge to your collection and marks it as
                claimed.
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
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                disabled={isClaiming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmClaim}
                disabled={isClaiming}
                className={cn('rounded-full', selectedMeta.button)}
              >
                {isClaiming ? 'Claiming...' : 'Confirm claim'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

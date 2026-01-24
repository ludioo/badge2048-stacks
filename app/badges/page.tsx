import type { Metadata } from 'next'
import { BadgesGrid } from '@/components/badge/BadgesGrid'

export const metadata: Metadata = {
  title: 'badge2048 - Badges',
  description: 'View all badge tiers and your unlock progress.',
}

export default function BadgesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Badges</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Track your unlocked badges and see what is ready to claim.
        </p>
      </div>

      <BadgesGrid />
    </div>
  )
}

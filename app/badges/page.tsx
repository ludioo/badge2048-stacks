import type { Metadata } from 'next'
import { BadgesGrid } from '@/components/badge/BadgesGrid'

export const metadata: Metadata = {
  title: 'badge2048-stacks - Badges',
  description: 'View all badge tiers and your unlock progress.',
}

export default function BadgesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F4622F]">Badges</h1>
        <p className="text-sm sm:text-base text-[#4B5563]">
          Track your unlocked badges and see what is ready to claim.
        </p>
      </div>

      <BadgesGrid />
    </div>
  )
}

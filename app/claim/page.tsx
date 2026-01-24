import type { Metadata } from 'next'
import { ClaimGrid } from '@/components/badge/ClaimGrid'

export const metadata: Metadata = {
  title: 'badge2048 - Claim',
  description: 'Claim unlocked badges and add them to your collection.',
}

export default function ClaimPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Claim Badges
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Claim unlocked badges to showcase your achievements.
        </p>
      </div>

      <ClaimGrid />
    </div>
  )
}

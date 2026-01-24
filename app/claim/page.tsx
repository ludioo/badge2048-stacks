import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'badge2048 - Claim',
  description: 'Claim unlocked badges and confirm your achievements.',
}

export default function ClaimPage() {
  return (
    <div className="flex w-full flex-1 items-center justify-center py-8 sm:py-12">
      <div className="text-center max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Claim Badges</h1>
        <p className="text-gray-600">
          Badge claiming will be available in Phase 7.
        </p>
      </div>
    </div>
  );
}

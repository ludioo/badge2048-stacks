import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'badge2048 - Badges',
  description: 'View all badge tiers and your unlock progress.',
}

export default function BadgesPage() {
  return (
    <div className="flex w-full flex-1 items-center justify-center py-8 sm:py-12">
      <div className="text-center max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Badges</h1>
        <p className="text-gray-600">
          Badge display will be available in Phase 6.
        </p>
      </div>
    </div>
  );
}

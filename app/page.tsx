import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'badge2048 - Home',
  description: 'Play 2048, earn badges, and showcase your achievements.',
}

export default function Home() {
  return (
    <div className="flex w-full flex-1 items-center justify-center py-8 sm:py-12">
      <div className="text-center max-w-2xl">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 px-2 sm:px-0">
          Welcome to badge2048
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-2 sm:px-0">
          Play the classic 2048 game and collect badges by achieving high scores!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/play"
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Playing
          </Link>
          <Link
            href="/badges"
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            View Badges
          </Link>
        </div>
      </div>
    </div>
  );
}

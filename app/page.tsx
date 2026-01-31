import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'badge2048-stacks - Home',
  description: 'Play 2048, earn badges, and showcase your achievements.',
}

export default function Home() {
  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#F4622F] mb-2">
          Welcome to badge2048-stacks
        </h1>
        <p className="text-base sm:text-lg text-[#4B5563] mb-6 sm:mb-8">
          Play the classic 2048 game and collect badges by achieving high scores!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/play"
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 bg-[#F4622F] text-white rounded-lg font-medium hover:bg-[#FB6331] transition-colors"
          >
            Start Playing
          </Link>
          <Link
            href="/badges"
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 bg-[#FD9E7F]/20 text-[#F4622F] rounded-lg font-medium hover:bg-[#FD9E7F]/30 transition-colors border border-[#FD9E7F]"
          >
            View Badges
          </Link>
        </div>
      </div>
    </div>
  );
}

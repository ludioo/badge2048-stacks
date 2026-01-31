import type { Metadata } from 'next'
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView'

export const metadata: Metadata = {
  title: 'badge2048-stacks - Leaderboard',
  description: 'Top scores by wallet. Connect your wallet and play to submit your score.',
}

export default function LeaderboardPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <LeaderboardView />
    </div>
  )
}

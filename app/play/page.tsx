import type { Metadata } from 'next'
import { Game } from '@/components/game/Game'

export const metadata: Metadata = {
  title: 'badge2048 - Play',
  description: 'Play the 2048 game and unlock badges with high scores.',
}

export default function PlayPage() {
  return (
    <div className="mx-auto w-full max-w-2xl py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">2048 Badge Game</h1>
        <p className="text-sm sm:text-base text-gray-600">Combine tiles to reach 2048 and earn badges!</p>
      </div>

      <Game />
    </div>
  )
}

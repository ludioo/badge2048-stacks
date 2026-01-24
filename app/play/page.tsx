import { Game } from '@/components/game/Game'

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">2048 Badge Game</h1>
          <p className="text-sm sm:text-base text-gray-600">Combine tiles to reach 2048 and earn badges!</p>
        </div>

        <Game />
      </div>
    </div>
  )
}

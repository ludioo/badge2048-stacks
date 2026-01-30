export type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export const HIGH_SCORE_KEY = 'highScore_v1'
export const LEGACY_HIGH_SCORE_KEY = 'highScore'

/** Network from env so mainnet and testnet have separate high scores (no cross-network reuse). */
function getNetwork(): string {
  if (typeof process === 'undefined' || !process.env?.NEXT_PUBLIC_STACKS_NETWORK) return 'testnet'
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
}

/** Storage key per network: mainnet and testnet scores are stored separately. */
function getHighScoreKey(storage?: StorageLike): string {
  const network = getNetwork()
  return `${HIGH_SCORE_KEY}_${network}`
}

const getStorage = (storage?: StorageLike): StorageLike | null => {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const parseScore = (value: string | null): number | null => {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

export const loadHighScore = (storage?: StorageLike): number => {
  const resolvedStorage = getStorage(storage)
  if (!resolvedStorage) return 0

  const key = getHighScoreKey(resolvedStorage)
  const current = parseScore(resolvedStorage.getItem(key))
  if (current !== null) return current

  // Migrate legacy key only for testnet (existing testnet users keep score; mainnet starts fresh)
  if (getNetwork() === 'testnet') {
    const legacy = parseScore(resolvedStorage.getItem(HIGH_SCORE_KEY))
    if (legacy !== null) {
      resolvedStorage.setItem(key, String(Math.floor(legacy)))
      return legacy
    }
    const legacyOld = parseScore(resolvedStorage.getItem(LEGACY_HIGH_SCORE_KEY))
    if (legacyOld !== null) {
      resolvedStorage.setItem(key, String(Math.floor(legacyOld)))
      return legacyOld
    }
  }

  return 0
}

export const saveHighScore = (score: number, storage?: StorageLike) => {
  const resolvedStorage = getStorage(storage)
  if (!resolvedStorage) return
  if (!Number.isFinite(score) || score < 0) return
  try {
    const key = getHighScoreKey(resolvedStorage)
    resolvedStorage.setItem(key, String(Math.floor(score)))
  } catch {
    // Ignore storage write errors
  }
}

export const updateHighScore = (
  score: number,
  storage?: StorageLike
): { highScore: number; didUpdate: boolean } => {
  const current = loadHighScore(storage)
  if (score > current) {
    saveHighScore(score, storage)
    return { highScore: score, didUpdate: true }
  }
  return { highScore: current, didUpdate: false }
}

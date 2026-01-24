export type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export const HIGH_SCORE_KEY = 'highScore_v1'
export const LEGACY_HIGH_SCORE_KEY = 'highScore'

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

  const current = parseScore(resolvedStorage.getItem(HIGH_SCORE_KEY))
  if (current !== null) return current

  const legacy = parseScore(resolvedStorage.getItem(LEGACY_HIGH_SCORE_KEY))
  if (legacy !== null) {
    saveHighScore(legacy, resolvedStorage)
    return legacy
  }

  return 0
}

export const saveHighScore = (score: number, storage?: StorageLike) => {
  const resolvedStorage = getStorage(storage)
  if (!resolvedStorage) return
  if (!Number.isFinite(score) || score < 0) return
  try {
    resolvedStorage.setItem(HIGH_SCORE_KEY, String(Math.floor(score)))
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

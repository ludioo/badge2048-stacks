/**
 * Hybrid leaderboard store: Onchain source of truth + Offchain cache.
 * 
 * Architecture:
 * - Onchain: High scores stored via `update-high-score` contract call (source of truth)
 * - Offchain: This file-based store caches leaderboard data for fast queries
 * 
 * Data flow:
 * 1. User submits score → Frontend calls `update-high-score` onchain
 * 2. After onchain success → Frontend also submits to backend (this store)
 * 3. Backend syncs periodically with onchain data to ensure consistency
 * 
 * Benefits:
 * - Trustless: Scores are verified onchain
 * - Fast queries: Leaderboard computed from cached offchain data
 * - Persistent: File-based cache survives server restarts
 * 
 * Note: This store acts as a cache. Onchain contract is the authoritative source.
 * Backend should periodically sync with onchain to ensure consistency.
 */

import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs'
import { join } from 'path'
import type { LeaderboardEntry } from './types'

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'leaderboard.json')

interface LeaderboardData {
  [address: string]: { score: number; updatedAt: string }
}

let data: Map<string, { score: number; updatedAt: string }> | null = null
let saveScheduled = false

/**
 * Load data from file. Creates file if it doesn't exist.
 */
function loadData(): Map<string, { score: number; updatedAt: string }> {
  if (data !== null) return data

  try {
    mkdirSync(DATA_DIR, { recursive: true })
  } catch {
    // Directory might already exist, ignore
  }

  try {
    const content = readFileSync(DATA_FILE, 'utf-8')
    const parsed: LeaderboardData = JSON.parse(content)
    data = new Map(Object.entries(parsed))
    return data
  } catch (error) {
    // File doesn't exist or is invalid, start with empty map
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      data = new Map()
      saveData()
      return data
    }
    // Invalid JSON or other error - log and start fresh
    console.warn('Failed to load leaderboard data, starting fresh:', error)
    data = new Map()
    saveData()
    return data
  }
}

/**
 * Save data to file. Uses atomic write pattern (write to temp, then rename).
 */
function saveData(): void {
  if (data === null) return

  try {
    mkdirSync(DATA_DIR, { recursive: true })
  } catch {
    // Directory might already exist, ignore
  }

  try {
    const obj: LeaderboardData = Object.fromEntries(data.entries())
    const content = JSON.stringify(obj, null, 2)
    const tmpFile = `${DATA_FILE}.tmp`
    writeFileSync(tmpFile, content, 'utf-8')
    // Atomic rename (works on most systems)
    try {
      renameSync(tmpFile, DATA_FILE)
    } catch {
      // Fallback: direct write if rename fails (Windows might have issues)
      writeFileSync(DATA_FILE, content, 'utf-8')
    }
  } catch (error) {
    console.error('Failed to save leaderboard data:', error)
  }
}

/**
 * Schedule a save (debounced). Multiple calls within the same tick will only save once.
 */
function scheduleSave(): void {
  if (saveScheduled) return
  saveScheduled = true
  // Use setImmediate to batch multiple updates in the same tick
  setImmediate(() => {
    saveScheduled = false
    saveData()
  })
}

export function submitScore(address: string, score: number): { updated: boolean; bestScore: number } {
  const store = loadData()
  const now = new Date().toISOString()
  const existing = store.get(address)
  if (!existing) {
    store.set(address, { score, updatedAt: now })
    scheduleSave()
    return { updated: true, bestScore: score }
  }
  if (score > existing.score) {
    store.set(address, { score, updatedAt: now })
    scheduleSave()
    return { updated: true, bestScore: score }
  }
  return { updated: false, bestScore: existing.score }
}

export function getTop(limit: number, offset: number): { entries: LeaderboardEntry[]; total: number } {
  const store = loadData()
  const all = Array.from(store.entries())
    .map(([address, { score, updatedAt }]) => ({ address, score, updatedAt }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    })
  const total = all.length
  const slice = all.slice(offset, offset + limit)
  const entries: LeaderboardEntry[] = slice.map((row, i) => ({
    rank: offset + i + 1,
    address: row.address,
    score: row.score,
    updatedAt: row.updatedAt,
  }))
  return { entries, total }
}

export function getRank(address: string): { rank: number; address: string; score: number; total: number } | null {
  const store = loadData()
  const entry = store.get(address)
  if (!entry) return null
  const all = Array.from(store.entries())
    .map(([addr, { score, updatedAt }]) => ({ address: addr, score, updatedAt }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    })
  const idx = all.findIndex((r) => r.address === address)
  if (idx === -1) return null
  return {
    rank: idx + 1,
    address,
    score: entry.score,
    total: all.length,
  }
}

/**
 * Clear the store. For testing only; do not use in production.
 */
export function _clearLeaderboardForTesting(): void {
  const store = loadData()
  store.clear()
  saveData()
}

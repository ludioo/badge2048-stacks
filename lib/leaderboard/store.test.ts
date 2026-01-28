import { describe, it, expect, beforeEach } from 'vitest'
import {
  submitScore,
  getTop,
  getRank,
  _clearLeaderboardForTesting,
} from './store'

const addr = (s: string) => `SP${s.padEnd(32, '1')}`

describe('leaderboard store', () => {
  beforeEach(() => {
    _clearLeaderboardForTesting()
  })

  describe('submitScore', () => {
    it('stores first score for address and returns updated true', () => {
      const r = submitScore(addr('A'), 1000)
      expect(r).toEqual({ updated: true, bestScore: 1000 })
      expect(getRank(addr('A'))).toMatchObject({ rank: 1, score: 1000, total: 1 })
    })

    it('updates when new score is higher', () => {
      submitScore(addr('A'), 500)
      const r = submitScore(addr('A'), 2000)
      expect(r).toEqual({ updated: true, bestScore: 2000 })
      expect(getRank(addr('A'))?.score).toBe(2000)
    })

    it('no-op when new score is lower, returns updated false', () => {
      submitScore(addr('A'), 2000)
      const r = submitScore(addr('A'), 500)
      expect(r).toEqual({ updated: false, bestScore: 2000 })
      expect(getRank(addr('A'))?.score).toBe(2000)
    })

    it('no-op when new score equals current, returns updated false', () => {
      submitScore(addr('A'), 1000)
      const r = submitScore(addr('A'), 1000)
      expect(r).toEqual({ updated: false, bestScore: 1000 })
    })
  })

  describe('getTop', () => {
    it('returns entries sorted by score desc with 1-based rank', () => {
      submitScore(addr('Lo'), 100)
      submitScore(addr('Hi'), 500)
      submitScore(addr('Mid'), 300)
      const { entries, total } = getTop(10, 0)
      expect(total).toBe(3)
      expect(entries[0]).toMatchObject({ rank: 1, address: addr('Hi'), score: 500 })
      expect(entries[1]).toMatchObject({ rank: 2, address: addr('Mid'), score: 300 })
      expect(entries[2]).toMatchObject({ rank: 3, address: addr('Lo'), score: 100 })
    })

    it('respects limit and offset', () => {
      submitScore(addr('1'), 100)
      submitScore(addr('2'), 200)
      submitScore(addr('3'), 300)
      const { entries, total } = getTop(2, 1)
      expect(total).toBe(3)
      expect(entries).toHaveLength(2)
      expect(entries[0].rank).toBe(2)
      expect(entries[1].rank).toBe(3)
    })

    it('returns empty entries and total 0 when store is empty', () => {
      const { entries, total } = getTop(50, 0)
      expect(entries).toEqual([])
      expect(total).toBe(0)
    })
  })

  describe('getRank', () => {
    it('returns rank, score, total for existing address', () => {
      submitScore(addr('A'), 100)
      submitScore(addr('B'), 200)
      submitScore(addr('C'), 300)
      const r = getRank(addr('B'))
      expect(r).toMatchObject({ rank: 2, address: addr('B'), score: 200, total: 3 })
    })

    it('returns null when address not on leaderboard', () => {
      submitScore(addr('A'), 100)
      expect(getRank(addr('X'))).toBeNull()
      expect(getRank(addr(''))).toBeNull()
    })
  })
})

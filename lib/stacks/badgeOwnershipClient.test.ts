import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchBadgeOwnership,
  getOwnershipForTier,
  type OwnershipByTier,
} from '@/lib/stacks/badgeOwnershipClient'

describe('badgeOwnershipClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchBadgeOwnership', () => {
    it('returns ownership by tier for valid address', async () => {
      const data: OwnershipByTier = {
        bronze: 1,
        silver: null,
        gold: 3,
        elite: null,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data }),
      })

      const result = await fetchBadgeOwnership('ST1PQHQKV0RJXZF1QWBG18YR7Q1E3YXB6A0')
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/badge-ownership?address=ST1PQHQKV0RJXZF1QWBG18YR7Q1E3YXB6A0'
      )
    })

    it('trims address and encodes in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { bronze: null, silver: null, gold: null, elite: null } }),
      })

      await fetchBadgeOwnership('  SP3ABC123  ')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/badge-ownership?address=SP3ABC123'
      )
    })

    it('throws "Address required" for empty string', async () => {
      await expect(fetchBadgeOwnership('')).rejects.toThrow('Address required')
      await expect(fetchBadgeOwnership('   ')).rejects.toThrow('Address required')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('throws "Address required" for undefined-like', async () => {
      await expect(fetchBadgeOwnership(null as unknown as string)).rejects.toThrow(
        'Address required'
      )
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('throws with message from API on 400', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid Stacks address format' }),
      })

      await expect(fetchBadgeOwnership('ST1PQHQKV0RJXZF1QWBG18YR7Q1E3YXB6A0')).rejects.toThrow(
        'Invalid Stacks address format'
      )
    })

    it('throws HTTP status when API returns non-string error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      await expect(fetchBadgeOwnership('ST1PQHQKV0RJXZF1QWBG18YR7Q1E3YXB6A0')).rejects.toThrow(
        'HTTP 500'
      )
    })

    it('throws on invalid response shape (no data)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await expect(fetchBadgeOwnership('ST1PQHQKV0RJXZF1QWBG18YR7Q1E3YXB6A0')).rejects.toThrow(
        'Invalid response from badge ownership API'
      )
    })

    it('throws on invalid response shape (data not object)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'invalid' }),
      })

      await expect(fetchBadgeOwnership('ST1PQHQKV0RJXZF1QWBG18YR7Q1E3YXB6A0')).rejects.toThrow(
        'Invalid response from badge ownership API'
      )
    })
  })

  describe('getOwnershipForTier', () => {
    const ownership: OwnershipByTier = {
      bronze: 1,
      silver: 2,
      gold: null,
      elite: 4,
    }

    it('returns tokenId for tier that has one', () => {
      expect(getOwnershipForTier(ownership, 'bronze')).toBe(1)
      expect(getOwnershipForTier(ownership, 'silver')).toBe(2)
      expect(getOwnershipForTier(ownership, 'elite')).toBe(4)
    })

    it('returns null for tier with null', () => {
      expect(getOwnershipForTier(ownership, 'gold')).toBe(null)
    })

    it('returns null for missing tier key', () => {
      const partial = { bronze: 1 } as OwnershipByTier
      expect(getOwnershipForTier(partial, 'silver')).toBe(null)
    })
  })
})

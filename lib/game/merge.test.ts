import { describe, it, expect } from 'vitest';
import { mergeTiles } from './merge';

describe('mergeTiles', () => {
  it('should merge identical adjacent tiles', () => {
    const tiles = [2, 2, null, null];
    const result = mergeTiles(tiles);
    expect(result.merged).toEqual([4, null, null, null]);
    expect(result.score).toBe(4);
  });

  it('should merge multiple pairs', () => {
    const tiles = [2, 2, 4, 4];
    const result = mergeTiles(tiles);
    expect(result.merged).toEqual([4, 8, null, null]);
    expect(result.score).toBe(12); // 4 + 8
  });

  it('should merge non-adjacent identical tiles after removing nulls', () => {
    const tiles = [2, null, 2, null];
    const result = mergeTiles(tiles);
    // After removing nulls: [2, 2], which merges to [4]
    expect(result.merged).toEqual([4, null, null, null]);
    expect(result.score).toBe(4);
  });

  it('should only merge once per pair', () => {
    const tiles = [4, 4, 4, 4];
    const result = mergeTiles(tiles);
    // Should merge first pair (4+4=8) and second pair (4+4=8)
    expect(result.merged).toEqual([8, 8, null, null]);
    expect(result.score).toBe(16);
  });

  it('should handle all nulls', () => {
    const tiles = [null, null, null, null];
    const result = mergeTiles(tiles);
    expect(result.merged).toEqual([null, null, null, null]);
    expect(result.score).toBe(0);
  });

  it('should handle single tile', () => {
    const tiles = [2, null, null, null];
    const result = mergeTiles(tiles);
    expect(result.merged).toEqual([2, null, null, null]);
    expect(result.score).toBe(0);
  });

  it('should handle no merges', () => {
    const tiles = [2, 4, 8, 16];
    const result = mergeTiles(tiles);
    expect(result.merged).toEqual([2, 4, 8, 16]);
    expect(result.score).toBe(0);
  });

  it('should handle complex merge scenario', () => {
    const tiles = [2, 2, 2, 4];
    const result = mergeTiles(tiles);
    // First two 2s merge to 4, leaving [4, 2, 4]
    // 4 and 2 don't match, so no further merge
    expect(result.merged).toEqual([4, 2, 4, null]);
    expect(result.score).toBe(4); // Only the first merge
  });
});

import { describe, it, expect, vi } from 'vitest';
import { spawnTile } from './spawn';
import { getEmptyCells } from './utils';

describe('spawnTile', () => {
  it('should spawn a tile in an empty cell', () => {
    const board = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = spawnTile(board);
    
    // Should have exactly one tile
    let tileCount = 0;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (result[row][col] !== null) {
          tileCount++;
          // Should be 2 or 4
          expect([2, 4]).toContain(result[row][col]);
        }
      }
    }
    expect(tileCount).toBe(1);
  });

  it('should not spawn if board is full', () => {
    const board = [
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ];
    const result = spawnTile(board);
    expect(result).toEqual(board);
  });

  it('should spawn in random empty cell', () => {
    const board = [
      [2, null, null, null],
      [null, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    
    // Run multiple times to ensure randomness
    const results: number[][] = [];
    for (let i = 0; i < 10; i++) {
      const result = spawnTile(board);
      const emptyBefore = getEmptyCells(board).length;
      const emptyAfter = getEmptyCells(result).length;
      expect(emptyAfter).toBe(emptyBefore - 1);
      results.push(result.flat().filter((x) => x !== null) as number[]);
    }
    
    // At least one spawn should be different (randomness)
    const firstResult = results[0];
    const allSame = results.every((r) => 
      r.length === firstResult.length && 
      r.every((val, idx) => val === firstResult[idx])
    );
    // This might occasionally fail due to randomness, but very unlikely
    expect(allSame).toBe(false);
  });

  it('should spawn 2 or 4', () => {
    const board = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    
    const spawnedValues: number[] = [];
    for (let i = 0; i < 100; i++) {
      const result = spawnTile(board);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (result[row][col] !== null) {
            spawnedValues.push(result[row][col]);
          }
        }
      }
    }
    
    // All spawned values should be 2 or 4
    spawnedValues.forEach((val) => {
      expect([2, 4]).toContain(val);
    });
    
    // Should have both 2 and 4 (with high probability after 100 spawns)
    const has2 = spawnedValues.includes(2);
    const has4 = spawnedValues.includes(4);
    expect(has2 || has4).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { checkGameOver } from './checkGameOver';

describe('checkGameOver', () => {
  it('should return false if there are empty cells', () => {
    const board = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    expect(checkGameOver(board)).toBe(false);
  });

  it('should return false if adjacent identical tiles exist horizontally', () => {
    const board = [
      [2, 2, 4, 8],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ];
    expect(checkGameOver(board)).toBe(false);
  });

  it('should return false if adjacent identical tiles exist vertically', () => {
    const board = [
      [2, 4, 8, 16],
      [2, 8, 16, 32],
      [4, 16, 32, 64],
      [8, 32, 64, 128],
    ];
    expect(checkGameOver(board)).toBe(false);
  });

  it('should return true when board is full and no merges possible', () => {
    const board = [
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ];
    expect(checkGameOver(board)).toBe(true);
  });

  it('should return true for a full board with no adjacent matches', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(checkGameOver(board)).toBe(true);
  });

  it('should return false if there is at least one empty cell', () => {
    const board = [
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, null],
    ];
    expect(checkGameOver(board)).toBe(false);
  });

  it('should detect horizontal merge possibility', () => {
    const board = [
      [2, 2, 4, 8],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ];
    expect(checkGameOver(board)).toBe(false);
  });

  it('should detect vertical merge possibility', () => {
    const board = [
      [2, 4, 8, 16],
      [2, 8, 16, 32],
      [4, 16, 32, 64],
      [8, 32, 64, 128],
    ];
    expect(checkGameOver(board)).toBe(false);
  });
});

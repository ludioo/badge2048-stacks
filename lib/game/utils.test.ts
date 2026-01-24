import { describe, it, expect } from 'vitest';
import { createEmptyBoard, boardsEqual, getEmptyCells } from './utils';

describe('createEmptyBoard', () => {
  it('should create a 4x4 board filled with null', () => {
    const board = createEmptyBoard();
    
    expect(board.length).toBe(4);
    board.forEach((row) => {
      expect(row.length).toBe(4);
      row.forEach((cell) => {
        expect(cell).toBe(null);
      });
    });
  });
});

describe('boardsEqual', () => {
  it('should return true for identical boards', () => {
    const board1 = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const board2 = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    
    expect(boardsEqual(board1, board2)).toBe(true);
  });

  it('should return false for different boards', () => {
    const board1 = [
      [2, 4, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const board2 = [
      [2, 8, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    
    expect(boardsEqual(board1, board2)).toBe(false);
  });

  it('should return false if boards have different values', () => {
    const board1 = [
      [2, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const board2 = [
      [4, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    
    expect(boardsEqual(board1, board2)).toBe(false);
  });
});

describe('getEmptyCells', () => {
  it('should return all empty cells', () => {
    const board = [
      [2, null, null, 4],
      [null, null, null, null],
      [null, 8, null, null],
      [null, null, null, null],
    ];
    
    const emptyCells = getEmptyCells(board);
    
    // Should have 13 empty cells (16 total - 3 filled: 2, 4, 8)
    expect(emptyCells.length).toBe(13);
    
    // Verify all returned cells are actually empty
    emptyCells.forEach(({ row, col }) => {
      expect(board[row][col]).toBe(null);
    });
  });

  it('should return empty array for full board', () => {
    const board = [
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ];
    
    const emptyCells = getEmptyCells(board);
    expect(emptyCells.length).toBe(0);
  });

  it('should return all cells for empty board', () => {
    const board = createEmptyBoard();
    const emptyCells = getEmptyCells(board);
    
    expect(emptyCells.length).toBe(16);
    
    // Verify all positions are included
    const positions = new Set(
      emptyCells.map(({ row, col }) => `${row},${col}`)
    );
    expect(positions.size).toBe(16);
  });
});

import { describe, it, expect } from 'vitest';
import { slideLeft, slideRight, slideUp, slideDown } from './slide';

describe('slideLeft', () => {
  it('should slide tiles to the left', () => {
    const board = [
      [null, 2, null, 4],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = slideLeft(board);
    expect(result.board[0]).toEqual([2, 4, null, null]);
    expect(result.changed).toBe(true);
  });

  it('should merge identical tiles when sliding left', () => {
    const board = [
      [2, 2, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = slideLeft(board);
    expect(result.board[0]).toEqual([4, null, null, null]);
    expect(result.score).toBe(4);
    expect(result.changed).toBe(true);
  });

  it('should not change board if no moves possible', () => {
    const board = [
      [2, 4, 8, 16],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = slideLeft(board);
    expect(result.changed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('should handle multiple merges in one row', () => {
    const board = [
      [2, 2, 4, 4],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = slideLeft(board);
    expect(result.board[0]).toEqual([4, 8, null, null]);
    expect(result.score).toBe(12);
  });
});

describe('slideRight', () => {
  it('should slide tiles to the right', () => {
    const board = [
      [2, null, null, 4],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = slideRight(board);
    expect(result.board[0]).toEqual([null, null, 2, 4]);
    expect(result.changed).toBe(true);
  });

  it('should merge identical tiles when sliding right', () => {
    const board = [
      [null, null, 2, 2],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = slideRight(board);
    expect(result.board[0]).toEqual([null, null, null, 4]);
    expect(result.score).toBe(4);
  });
});

describe('slideUp', () => {
  it('should slide tiles up', () => {
    const board = [
      [null, null, null, null],
      [2, null, null, null],
      [null, null, null, null],
      [4, null, null, null],
    ];
    const result = slideUp(board);
    expect(result.board[0][0]).toBe(2);
    expect(result.board[1][0]).toBe(4);
    expect(result.changed).toBe(true);
  });

  it('should merge identical tiles when sliding up', () => {
    const board = [
      [2, null, null, null],
      [2, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const result = slideUp(board);
    expect(result.board[0][0]).toBe(4);
    expect(result.board[1][0]).toBe(null);
    expect(result.score).toBe(4);
  });
});

describe('slideDown', () => {
  it('should slide tiles down', () => {
    const board = [
      [2, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [4, null, null, null],
    ];
    const result = slideDown(board);
    expect(result.board[2][0]).toBe(2);
    expect(result.board[3][0]).toBe(4);
    expect(result.changed).toBe(true);
  });

  it('should merge identical tiles when sliding down', () => {
    const board = [
      [null, null, null, null],
      [null, null, null, null],
      [2, null, null, null],
      [2, null, null, null],
    ];
    const result = slideDown(board);
    expect(result.board[2][0]).toBe(null);
    expect(result.board[3][0]).toBe(4);
    expect(result.score).toBe(4);
  });
});

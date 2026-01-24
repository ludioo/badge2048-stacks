import type { Tile } from './types';
import { BOARD_SIZE } from './constants';

/**
 * Create an empty 4x4 board
 */
export function createEmptyBoard(): Tile[][] {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
}

/**
 * Check if two boards are equal
 */
export function boardsEqual(board1: Tile[][], board2: Tile[][]): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board1[i][j] !== board2[i][j]) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Get all empty cells in the board
 */
export function getEmptyCells(board: Tile[][]): Array<{ row: number; col: number }> {
  const emptyCells: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === null) {
        emptyCells.push({ row: i, col: j });
      }
    }
  }
  return emptyCells;
}

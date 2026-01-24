import type { Tile } from './types';
import { BOARD_SIZE } from './constants';
import { getEmptyCells } from './utils';

/**
 * Check if game is over
 * Game over when:
 * - No empty cells AND
 * - No adjacent identical tiles (no possible merges)
 */
export function checkGameOver(board: Tile[][]): boolean {
  // Check if there are empty cells
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length > 0) {
    return false; // Game not over, there are empty cells
  }

  // Check for adjacent identical tiles (horizontal)
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE - 1; col++) {
      if (board[row][col] !== null && board[row][col] === board[row][col + 1]) {
        return false; // Game not over, merge possible horizontally
      }
    }
  }

  // Check for adjacent identical tiles (vertical)
  for (let row = 0; row < BOARD_SIZE - 1; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== null && board[row][col] === board[row + 1][col]) {
        return false; // Game not over, merge possible vertically
      }
    }
  }

  // No empty cells and no possible merges
  return true;
}

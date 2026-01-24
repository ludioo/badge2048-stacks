import type { Tile } from './types';
import { BOARD_SIZE } from './constants';
import { mergeTiles } from './merge';

/**
 * Slide board to the left
 * Returns new board and score increment
 */
export function slideLeft(board: Tile[][]): {
  board: Tile[][];
  score: number;
  changed: boolean;
} {
  const newBoard: Tile[][] = [];
  let totalScore = 0;
  let changed = false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowTiles = board[row];
    const { merged, score } = mergeTiles(rowTiles);
    newBoard.push(merged);
    totalScore += score;

    // Check if this row changed
    if (!changed) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (rowTiles[col] !== merged[col]) {
          changed = true;
          break;
        }
      }
    }
  }

  return { board: newBoard, score: totalScore, changed };
}

/**
 * Slide board to the right
 */
export function slideRight(board: Tile[][]): {
  board: Tile[][];
  score: number;
  changed: boolean;
} {
  const newBoard: Tile[][] = [];
  let totalScore = 0;
  let changed = false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    // Reverse row, merge, then reverse back
    const rowTiles = [...board[row]].reverse();
    const { merged, score } = mergeTiles(rowTiles);
    newBoard.push(merged.reverse());
    totalScore += score;

    // Check if this row changed
    if (!changed) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== merged[BOARD_SIZE - 1 - col]) {
          changed = true;
          break;
        }
      }
    }
  }

  return { board: newBoard, score: totalScore, changed };
}

/**
 * Slide board up
 */
export function slideUp(board: Tile[][]): {
  board: Tile[][];
  score: number;
  changed: boolean;
} {
  const newBoard: Tile[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
  let totalScore = 0;
  let changed = false;

  for (let col = 0; col < BOARD_SIZE; col++) {
    // Extract column
    const colTiles: Tile[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      colTiles.push(board[row][col]);
    }

    // Merge column
    const { merged, score } = mergeTiles(colTiles);
    totalScore += score;

    // Put merged column back
    for (let row = 0; row < BOARD_SIZE; row++) {
      newBoard[row][col] = merged[row];
      
      // Check if changed
      if (!changed && board[row][col] !== merged[row]) {
        changed = true;
      }
    }
  }

  return { board: newBoard, score: totalScore, changed };
}

/**
 * Slide board down
 */
export function slideDown(board: Tile[][]): {
  board: Tile[][];
  score: number;
  changed: boolean;
} {
  const newBoard: Tile[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
  let totalScore = 0;
  let changed = false;

  for (let col = 0; col < BOARD_SIZE; col++) {
    // Extract column (reverse order)
    const colTiles: Tile[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      colTiles.push(board[row][col]);
    }

    // Merge column
    const { merged, score } = mergeTiles(colTiles);
    totalScore += score;

    // Put merged column back (reverse order)
    for (let row = 0; row < BOARD_SIZE; row++) {
      newBoard[row][col] = merged[BOARD_SIZE - 1 - row];
      
      // Check if changed
      if (!changed && board[row][col] !== merged[BOARD_SIZE - 1 - row]) {
        changed = true;
      }
    }
  }

  return { board: newBoard, score: totalScore, changed };
}

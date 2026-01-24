import type { Tile } from './types';
import { BOARD_SIZE, SPAWN_2_PROBABILITY } from './constants';
import { getEmptyCells } from './utils';

/**
 * Spawn a new tile (2 or 4) in a random empty cell
 * - 90% chance for 2
 * - 10% chance for 4
 * Returns new board with spawned tile, or original board if no empty cells
 */
export function spawnTile(board: Tile[][]): Tile[][] {
  const emptyCells = getEmptyCells(board);
  
  if (emptyCells.length === 0) {
    return board;
  }

  // Pick random empty cell
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const { row, col } = emptyCells[randomIndex];

  // Determine tile value (90% chance for 2, 10% for 4)
  const value = Math.random() < SPAWN_2_PROBABILITY ? 2 : 4;

  // Create new board with spawned tile
  const newBoard = board.map((rowArr, r) =>
    rowArr.map((cell, c) => (r === row && c === col ? value : cell))
  );

  return newBoard;
}

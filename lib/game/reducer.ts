import type { GameState, GameAction } from './types';
import { slideLeft, slideRight, slideUp, slideDown } from './slide';
import { spawnTile } from './spawn';
import { checkGameOver } from './checkGameOver';
import { createEmptyBoard } from './utils';
import { BOARD_SIZE } from './constants';

export function createInitialState(): GameState {
  const emptyBoard = createEmptyBoard();
  let newBoard = spawnTile(emptyBoard);
  newBoard = spawnTile(newBoard);

  return {
    board: newBoard,
    score: 0,
    status: 'playing',
  };
}

/**
 * Game reducer - handles all game state transitions
 * Pure function that returns new state based on action
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESTART': {
      return createInitialState();
    }

    case 'SLIDE_LEFT': {
      if (state.status === 'gameover') {
        return state; // No action if game over
      }

      const { board: newBoard, score: scoreIncrement, changed } = slideLeft(state.board);

      if (!changed) {
        // No change, return same state
        return state;
      }

      // Spawn new tile after valid move
      const boardWithSpawn = spawnTile(newBoard);
      const newScore = state.score + scoreIncrement;
      const isGameOver = checkGameOver(boardWithSpawn);

      return {
        board: boardWithSpawn,
        score: newScore,
        status: isGameOver ? 'gameover' : 'playing',
      };
    }

    case 'SLIDE_RIGHT': {
      if (state.status === 'gameover') {
        return state;
      }

      const { board: newBoard, score: scoreIncrement, changed } = slideRight(state.board);

      if (!changed) {
        return state;
      }

      const boardWithSpawn = spawnTile(newBoard);
      const newScore = state.score + scoreIncrement;
      const isGameOver = checkGameOver(boardWithSpawn);

      return {
        board: boardWithSpawn,
        score: newScore,
        status: isGameOver ? 'gameover' : 'playing',
      };
    }

    case 'SLIDE_UP': {
      if (state.status === 'gameover') {
        return state;
      }

      const { board: newBoard, score: scoreIncrement, changed } = slideUp(state.board);

      if (!changed) {
        return state;
      }

      const boardWithSpawn = spawnTile(newBoard);
      const newScore = state.score + scoreIncrement;
      const isGameOver = checkGameOver(boardWithSpawn);

      return {
        board: boardWithSpawn,
        score: newScore,
        status: isGameOver ? 'gameover' : 'playing',
      };
    }

    case 'SLIDE_DOWN': {
      if (state.status === 'gameover') {
        return state;
      }

      const { board: newBoard, score: scoreIncrement, changed } = slideDown(state.board);

      if (!changed) {
        return state;
      }

      const boardWithSpawn = spawnTile(newBoard);
      const newScore = state.score + scoreIncrement;
      const isGameOver = checkGameOver(boardWithSpawn);

      return {
        board: boardWithSpawn,
        score: newScore,
        status: isGameOver ? 'gameover' : 'playing',
      };
    }

    case 'SPAWN_TILE': {
      // Manual spawn (for testing or special cases)
      if (state.status === 'gameover') {
        return state;
      }

      const { row, col, value } = action;
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return state; // Invalid position
      }

      if (state.board[row][col] !== null) {
        return state; // Cell not empty
      }

      const newBoard = state.board.map((rowArr, r) =>
        rowArr.map((cell, c) => (r === row && c === col ? value : cell))
      );

      return {
        ...state,
        board: newBoard,
      };
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = action;
      return state;
    }
  }
}

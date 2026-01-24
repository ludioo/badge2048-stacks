import type { Badge } from './types';

// Default Badge Configuration
export const DEFAULT_BADGES: Badge[] = [
  { tier: 'bronze', threshold: 1024, unlocked: false, claimed: false },
  { tier: 'silver', threshold: 2048, unlocked: false, claimed: false },
  { tier: 'gold', threshold: 4096, unlocked: false, claimed: false },
  { tier: 'elite', threshold: 8192, unlocked: false, claimed: false },
];

// Board size
export const BOARD_SIZE = 4;

// Spawn probabilities
export const SPAWN_2_PROBABILITY = 0.9; // 90% chance for 2
export const SPAWN_4_PROBABILITY = 0.1; // 10% chance for 4

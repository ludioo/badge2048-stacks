// Game State Types
export type Tile = number | null;

export type GameStatus = 'playing' | 'gameover';

export interface GameState {
  board: Tile[][];        // 4x4 grid
  score: number;          // Current score
  status: GameStatus;     // Game status
  previousBoard?: Tile[][]; // For undo (optional)
}

// Badge Types
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'elite';

export interface Badge {
  tier: BadgeTier;
  threshold: number;
  unlocked: boolean;
  claimed: boolean;
  claimedAt?: string;
  /** Onchain mint status — true when NFT minted via contract */
  onchainMinted?: boolean;
  /** NFT token ID from contract (if minted) */
  tokenId?: number;
  /** Transaction ID of mint (if minted) */
  txId?: string;
  /** ISO timestamp when badge was minted onchain */
  mintedAt?: string;
}

export type BadgeState = Badge[];

// Game Action Types
export type GameAction =
  | { type: 'SLIDE_LEFT' }
  | { type: 'SLIDE_RIGHT' }
  | { type: 'SLIDE_UP' }
  | { type: 'SLIDE_DOWN' }
  | { type: 'RESTART' }
  | { type: 'SPAWN_TILE'; row: number; col: number; value: number };

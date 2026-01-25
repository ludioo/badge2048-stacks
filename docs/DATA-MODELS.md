# Data Models Specification

**Application Name:** badge2048  
**Last updated:** 2026-01-25 (Phase 6: Badge optional onchain fields; backward compatible.)

## Game State

### TypeScript Definition

```typescript
type Tile = number | null;

type GameStatus = 'playing' | 'gameover';

interface GameState {
  board: Tile[][];        // 4x4 grid
  score: number;          // Current score
  status: GameStatus;     // Game status
  previousBoard?: Tile[][]; // For undo (optional)
}
```

### Board Structure

* **Fixed 4×4 grid** (16 cells total) - dimensions never change
* Each cell: `number` (tile value) or `null` (empty)
* Example: `[[2, 4, null, null], [null, 2, 4, 8], ...]`
* **Important:** The board is always 4 rows × 4 columns. It does not expand or shrink.

### Score

* Starts at 0
* Increments when tiles merge
* Score += merged tile value
* Example: Merging two 4s → score += 4

### Game Status

* `'playing'`: Game in progress
* `'gameover'`: No moves available

## Badge State

### TypeScript Definition

```typescript
type BadgeTier = 'bronze' | 'silver' | 'gold' | 'elite';

interface Badge {
  tier: BadgeTier;
  threshold: number;
  unlocked: boolean;
  claimed: boolean;
  claimedAt?: string;
  /** Onchain mint status — true when NFT minted via contract (Phase 6+) */
  onchainMinted?: boolean;
  /** NFT token ID from contract (if minted) */
  tokenId?: number;
  /** Transaction ID of mint (if minted) */
  txId?: string;
  /** ISO timestamp when badge was minted onchain */
  mintedAt?: string;
}

type BadgeState = Badge[];
```

### Badge Properties

* `tier`: Badge tier identifier
* `threshold`: Minimum score required
* `unlocked`: Whether user has reached threshold
* `claimed`: Whether user has claimed the badge
* `claimedAt`: ISO timestamp when badge was claimed (optional)
* `onchainMinted`: True when badge NFT has been minted onchain (optional; Phase 6+)
* `tokenId`: NFT token ID from contract, if minted (optional)
* `txId`: Transaction ID of mint (optional)
* `mintedAt`: ISO timestamp when badge was minted onchain (optional)

**Backward compatibility:** All onchain fields are optional. Legacy stored badges (without these fields) remain valid; see `ONCHAIN_STACKS_BADGE2048.md` Phase 6 and `lib/badges.ts` (`normalizeBadgeState`, save/load).

### Default Badge Configuration

```typescript
const DEFAULT_BADGES: Badge[] = [
  { tier: 'bronze', threshold: 1024, unlocked: false, claimed: false },
  { tier: 'silver', threshold: 2048, unlocked: false, claimed: false },
  { tier: 'gold', threshold: 4096, unlocked: false, claimed: false },
  { tier: 'elite', threshold: 8192, unlocked: false, claimed: false },
];
```

## Local Storage Schema

### Keys

* `gameState` (optional): Save game in progress
* `badges_v1`: User's badge state (current)
* `highScore_v1` (optional): Best score achieved (current)
* Legacy keys (auto-migrated): `badges`, `highScore`

### Badge Storage Format

Legacy format (no onchain fields) and Phase 6+ format (with optional onchain fields) are both supported. Example with onchain fields:

```json
{
  "badges": [
    {
      "tier": "bronze",
      "threshold": 1024,
      "unlocked": true,
      "claimed": false
    },
    {
      "tier": "silver",
      "threshold": 2048,
      "unlocked": true,
      "claimed": true,
      "claimedAt": "2026-01-24T10:15:30.000Z",
      "onchainMinted": true,
      "tokenId": 3,
      "txId": "0xabc...",
      "mintedAt": "2026-01-25T12:00:00.000Z"
    }
  ]
}
```

Storage key: `badges_v1` (legacy `badges` auto-migrated). See `lib/badges.ts` for save/load and migration.

## Action Types

```typescript
type GameAction =
  | { type: 'SLIDE_LEFT' }
  | { type: 'SLIDE_RIGHT' }
  | { type: 'SLIDE_UP' }
  | { type: 'SLIDE_DOWN' }
  | { type: 'RESTART' }
  | { type: 'SPAWN_TILE'; row: number; col: number; value: number };
```

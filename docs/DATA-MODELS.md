# Data Models Specification

**Application Name:** badge2048

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
}

type BadgeState = Badge[];
```

### Badge Properties

* `tier`: Badge tier identifier
* `threshold`: Minimum score required
* `unlocked`: Whether user has reached threshold
* `claimed`: Whether user has claimed the badge
* `claimedAt`: ISO timestamp when badge was claimed (optional)

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
      "claimedAt": "2026-01-24T10:15:30.000Z"
    }
  ]
}
```

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

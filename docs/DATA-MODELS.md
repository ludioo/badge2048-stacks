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

* 4×4 grid (16 cells)
* Each cell: `number` (tile value) or `null` (empty)
* Example: `[[2, 4, null, null], [null, 2, 4, 8], ...]`

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
}

type BadgeState = Badge[];
```

### Badge Properties

* `tier`: Badge tier identifier
* `threshold`: Minimum score required
* `unlocked`: Whether user has reached threshold
* `claimed`: Whether user has claimed the badge

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
* `badges`: User's badge state
* `highScore` (optional): Best score achieved

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
      "claimed": true
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

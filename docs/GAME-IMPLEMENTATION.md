# Game Implementation Requirements

## Architecture Principles

* Pure reducer-style logic
* Deterministic transitions
* Rendering decoupled from logic
* Testable and debuggable

## Implementation Approach

### Pure Functions

All game logic should be implemented as pure functions:
- No side effects
- Same input always produces same output
- Easy to test
- Easy to debug

### Reducer Pattern

Game state transitions should follow reducer pattern:

```typescript
function gameReducer(state: GameState, action: GameAction): GameState {
  // Pure function that returns new state
}
```

### Separation of Concerns

* **Logic Layer** (`/lib/game/`): Pure game logic functions
* **State Management**: React state or state management library
* **UI Layer**: React components that render based on state

## File Structure

```
/lib/game/
  ├── types.ts          # Type definitions
  ├── reducer.ts        # Main game reducer
  ├── slide.ts          # Slide logic (left, right, up, down)
  ├── merge.ts          # Merge logic
  ├── spawn.ts          # Spawn new tile logic
  ├── checkGameOver.ts  # Check if game is over
  ├── utils.ts          # Helper functions
  └── constants.ts      # Game constants (grid size, spawn rates, etc.)
```

## Testing Requirements

* Unit tests for all pure functions
* Test edge cases (full board, no moves, etc.)
* Test deterministic behavior
* Test score calculation
* Test merge logic correctness

## Debugging Support

* State should be serializable
* Support state inspection
* Support replay/undo (optional for MVP)
* Clear error messages

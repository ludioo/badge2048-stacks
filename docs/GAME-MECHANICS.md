# Game Mechanics Specification

## Core Mechanics

* 4×4 grid puzzle
* Endless until no moves remain
* Merge identical tiles on slide
* Incremental scoring
* New tiles spawn after valid moves
* Failure = no moves + no empty cells

## Input

* Keyboard arrow keys (MVP)
* Optional click (future)
* Optional swipe (future)

## State Machine (Deterministic)

```
state → action → new_state
```

### Actions

* `SLIDE_LEFT`
* `SLIDE_RIGHT`
* `SLIDE_UP`
* `SLIDE_DOWN`
* `RESTART`

## Spawn Logic

* Spawn 2 (90%) or 4 (10%)
* Random empty cell
* Only spawn after valid move (board changed)

## Merge Logic

* Identical tiles merge
* Double value (2+2=4, 4+4=8, etc.)
* Score += merged value
* One merge per cell per action
* Tiles merge in direction of slide

## End Condition

* Game over when:
  * No empty tile AND
  * No adjacent merge possible (no identical tiles next to each other)

## Game Flow

1. Initialize: Spawn 2 tiles (2 or 4) on empty board
2. Player action: Slide in direction
3. Process slide: Move tiles, merge if possible
4. Check if board changed
5. If changed: Spawn new tile, update score
6. Check end condition
7. If game over: Show game over state
8. Repeat from step 2

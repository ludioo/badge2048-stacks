# Claim Flow Specification (Pre-Chain)

**Application Name:** badge2048

## Flow Overview

```
Play Game → Achieve Score → Unlock Badge → Eligible to Claim → Claim Badge → Update State
```

## Detailed Flow

### 1. Play Game

User plays game on `/play` page and achieves a score.

### 2. Score Check

After game ends, check if score meets any badge threshold:
- Compare final score against badge thresholds
- If score ≥ threshold and badge not yet unlocked, unlock badge
- Update badge state to "unlocked"

### 3. Notification

Show notification or indicator that new badge is available:
- Could be a badge icon in header/navbar
- Could be a toast notification
- Could be a banner on game over screen

### 4. Navigate to Claim

User navigates to `/claim` page (manually or via notification link).

### 5. Claim Page Display

Show list of eligible badges:
- Only show unlocked but not claimed badges
- Display badge tier, threshold, and description
- Show "Claim" button for each

### 6. Claim Action

User clicks "Claim" button:
- Update badge state from "unlocked" to "claimed"
- Save to local storage
- Show success message
- Optionally redirect to `/badges` page

### 7. State Update

After claim:
- Badge appears as "claimed" on `/badges` page
- Badge removed from `/claim` page (no longer eligible)
- State persists in local storage

## Implementation Notes

### Current (Pre-Chain MVP)

* All state management is frontend-only
* No wallet interaction
* No blockchain transaction
* Local storage persistence

### Future (On-Chain)

* Will require wallet connection
* Will mint badge as NFT on-chain
* Will require transaction confirmation
* Will sync with on-chain state

## User Experience

* Clear indication of available badges
* Simple claim process (one click)
* Visual feedback on claim success
* Easy navigation between pages

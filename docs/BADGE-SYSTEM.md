# Badge System Specification

**Application Name:** badge2048

## Purpose

* Represent achievements via score milestones
* Public visibility for builder reputation
* Gamification element to encourage replay

## Badge Tiers (MVP)

| Tier   | Score Threshold | Description |
| ------ | --------------- | ----------- |
| Bronze | ≥1024          | First milestone achievement |
| Silver | ≥2048          | Intermediate achievement |
| Gold   | ≥4096          | Advanced achievement |
| Elite  | ≥8192          | Expert level achievement |

## Badge Rules

### Unlock Conditions

* Unlock badge if score ≥ threshold
* Check after each game ends
* Cannot unlock same badge twice
* Multiple badges allowed across sessions
* Badges persist across sessions (local storage)

### Badge States

Each badge can be in one of these states:
1. **Locked**: Score threshold not reached
2. **Unlocked**: Score threshold reached, not yet claimed
3. **Claimed**: Badge has been claimed by user

## Display Rules

### `/badges` Page

* Shows all tiers in a grid/list
* Owned badges (claimed) highlighted with color
* Unlocked but unclaimed badges shown with "Claim" indicator
* Locked badges greyed out with threshold visible
* Summary chips for Owned/Claimable/Locked plus unlocked progress bar
* Claimed badges show "Last updated" timestamp

### Badge Visual Design

* Each tier has distinct color/icon
* Bronze: Brown/copper tones
* Silver: Silver/grey tones
* Gold: Gold/yellow tones
* Elite: Purple/platinum tones

## Data Structure

See [DATA-MODELS.md](./DATA-MODELS.md) for detailed badge data structure.

## Persistence

* Badges stored in browser local storage (MVP)
* Key: `badges_v1` (legacy `badges` auto-migrated)
* Persists across sessions
* Will migrate to on-chain storage in future

# PRD MASTER v1.0 — Mini dApp Puzzle Game + Badge System

## 1. Overview

This project is a simple, endless puzzle mini-game (2048-like) implemented as a browser-based dApp with a slightly modernized UI/UX. Users play the game, achieve score milestones, and become eligible to claim Badges. Badges are displayed publicly in a dedicated page and will later be minted on-chain (chain TBD).

## 2. Goals

* Deliver simple and replayable mini-game with 2048-like mechanics
* Provide modernized minimal UI/UX
* Support public visibility via Badges
* Enable multi-page dApp structure
* Decouple blockchain features until game is stable
* Support future on-chain minting without rework
* Align with builder ecosystem (Talent/Base/Stacks)

## 3. Non-Goals

* Competitive leaderboard
* Tokenomics or financial systems
* PvP or multiplayer
* Anti-cheat and cryptographic fairness
* Tokenization and DeFi mechanics
* Unity/WebGL implementation
* Heavy art design
* Full on-chain game logic

## 4. Target Users

* Primary: Builder ecosystem users (Base/Stacks/Talent)
* Secondary: Casual public players

## 5. Game Specification

### 5.1 Core Mechanics

* 4×4 grid puzzle
* Endless until no moves remain
* Merge identical tiles on slide
* Incremental scoring
* New tiles spawn after valid moves
* Failure = no moves + no empty cells

### 5.2 Input

* Keyboard arrow keys (MVP)
* Optional click (future)
* Optional swipe (future)

### 5.3 State Machine (Deterministic)

state → action → new_state

Actions:

* SLIDE_LEFT
* SLIDE_RIGHT
* SLIDE_UP
* SLIDE_DOWN
* RESTART

### 5.4 Spawn Logic

* Spawn 2 (90%) or 4 (10%)
* Random empty cell

### 5.5 Merge Logic

* Identical tiles merge
* Double value
* Score += merged value
* One merge per cell per action

### 5.6 End Condition

* No empty tile AND no adjacent merge

## 6. Game Implementation Requirements

* Pure reducer-style logic
* Deterministic transitions
* Rendering decoupled from logic
* Testable and debuggable

## 7. UI/UX Specification

### 7.1 Visual

* Modern minimalist
* Rounded tiles
* Soft shadows
* Pastel/gradient colors
* Responsive

### 7.2 Motion

* Slide animation
* Merge pop animation
* Spawn pop-in
* End fade/modal

## 8. DApp Specification (Non-Chain MVP)

Supports:

* Multi-page structure
* Badge eligibility
* Claim flow (frontend only)
* Public badge display
* Wallet integration (future)

## 9. Pages & Routing

Required:

* /play
* /claim
* /badges

Optional future:

* /profile
* /history
* /season
* /about

## 10. Badge System Specification

### 10.1 Purpose

* Represent achievements via score milestones
* Public visibility for builder reputation

### 10.2 Badge Tiers (MVP)

| Tier   | Score |
| ------ | ----- |
| Bronze | ≥1024 |
| Silver | ≥2048 |
| Gold   | ≥4096 |
| Elite  | ≥8192 |

### 10.3 Rules

* Unlock badge if score ≥ threshold
* Cannot unlock same badge twice
* Multiple badges allowed across sessions

### 10.4 Display

* /badges shows all tiers
* Owned badges highlighted
* Locked badges greyed

## 11. Claim Flow (Pre-Chain)

Play → Score → Unlock → Eligible to Claim

Claim updates frontend state only (no wallet interaction yet)

## 12. Tech Stack Specification

Frontend:

* Next.js + React
* TypeScript (preferred)
* TailwindCSS
* Framer Motion (optional)

Game Logic:

* /lib/game/
* Pure functions for reducer, merge, spawn, score, end-state

DApp:

* Chain TBD (Base or Stacks)
* Wallet integration later

## 13. Data Models

Game State:

* Board: Tile[][]
* Tile: number|null
* Score: number
* GameStatus: playing|gameover

Badge State:
Badge {
tier: bronze|silver|gold|elite
threshold: number
unlocked: boolean
claimed: boolean
}

## 14. MVP Scope

Includes:

* Full puzzle gameplay
* Score system
* Game over detection
* Slightly modernized UI
* Badge unlock + display
* Multi-page routing
* Claim frontend only
* Badge persistence (local)

## 15. Out of Scope

* On-chain minting
* Wallet connect
* Leaderboard
* On-chain score
* Anti-cheat
* Tokenomics
* Social share
* Multiplayer

## 16. Future Scope

* On-chain badge minting
* Wallet connect
* Leaderboard
* Seasonal badges
* Progressive achievements
* Profile page
* Identity integration
* Farcaster/Telegram mini-app
* Chain decision (Base/Stacks)
* PRD v2 for chain

## 17. Success Criteria

* Stable deterministic gameplay
* Public badge visibility
* On-chain minting can be added without major refactor
* Chain decision can happen post-MVP
* Suitable for Talent/Base builder showcase

## 18. Versioning

This document = PRD MASTER v1.0
Next: PRD v2 (On-chain spec)

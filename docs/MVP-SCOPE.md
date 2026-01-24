# MVP Scope

## Included Features

### Core Gameplay

* ✅ Full puzzle gameplay (2048 mechanics)
* ✅ 4×4 grid with tile merging
* ✅ Score system with incremental scoring
* ✅ Game over detection
* ✅ Keyboard controls (arrow keys)
* ✅ Restart functionality

### UI/UX

* ✅ Slightly modernized UI
* ✅ Responsive design
* ✅ Basic animations (slide, merge, spawn)
* ✅ Game over modal
* ✅ Score display

### Badge System

* ✅ Badge unlock logic (based on score thresholds)
* ✅ Badge display on `/badges` page
* ✅ Badge tiers: Bronze, Silver, Gold, Elite
* ✅ Visual distinction between owned/locked badges

### Multi-page Structure

* ✅ Multi-page routing (Next.js App Router)
* ✅ `/play` - Game page
* ✅ `/claim` - Claim page
* ✅ `/badges` - Badges display page
* ✅ Navigation between pages

### Claim Flow

* ✅ Frontend-only claim flow
* ✅ Claim button and confirmation
* ✅ State update after claim
* ✅ Badge persistence (local storage)

### Persistence

* ✅ Badge state saved to local storage
* ✅ Badges persist across sessions

## Out of Scope (MVP)

* ❌ On-chain minting
* ❌ Wallet connect
* ❌ Leaderboard
* ❌ On-chain score verification
* ❌ Anti-cheat mechanisms
* ❌ Tokenomics
* ❌ Social share
* ❌ Multiplayer
* ❌ Click/swipe controls (keyboard only)
* ❌ Profile page
* ❌ Game history
* ❌ Undo functionality

## MVP Success Criteria

* Game is playable and fun
* Badge system works end-to-end
* All pages are accessible and functional
* State persists correctly
* No critical bugs
* Ready for on-chain integration in next phase

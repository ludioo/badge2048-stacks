# Implementation Roadmap - Feature by Feature

**Application Name:** badge2048

This document provides the recommended implementation order to build badge2048 in phases.

## Prerequisites

Before starting, read:
- **[TECH-STACK.md](./TECH-STACK.md)** - Project structure setup
- **[DATA-MODELS.md](./DATA-MODELS.md)** - Understand the data structures

**IMPORTANT:** All pages and website content must be fully in English. See `UI-UX-SPEC.md` and `TECH-STACK.md` for language requirements.

---

## Phase 1: Setup and Foundation (Complete)

**Reference Files:** `TECH-STACK.md`, `DATA-MODELS.md`

### Tasks:
1. [x] Setup Next.js project with TypeScript
   - Next.js 16.1.4 with TypeScript 5
   - `tsconfig.json` configured correctly
2. [x] Setup TailwindCSS
   - TailwindCSS v4 with PostCSS plugin
   - `globals.css` imports TailwindCSS
3. [x] Create folder structure per `TECH-STACK.md`
   - `app/` with routing pages (home, play, claim, badges)
   - `components/` with subfolders (game, badge, ui)
   - `lib/game/` with game logic files
   - `hooks/` and `types/` folders
4. [x] Define TypeScript types from `DATA-MODELS.md`
   - `lib/game/types.ts` includes Tile, GameStatus, GameState, BadgeTier, Badge, BadgeState, GameAction
   - `lib/game/constants.ts` includes DEFAULT_BADGES and constants
   - `lib/game/utils.ts` includes utility functions
5. [x] Setup basic routing (minimum home page)
   - Home page (`app/page.tsx`) with navigation
   - `/play`, `/badges`, `/claim` pages created
   - Navigation component (`components/ui/navigation.tsx`)
   - Layout with badge2048 metadata

**Deliverable:** Project structure ready, types defined, dev server runs.

**Status:** Phase 1 COMPLETE - All tasks implemented and verified.

---

## Phase 2: Core Game Logic (Complete)

**Reference Files:** `GAME-MECHANICS.md`, `GAME-IMPLEMENTATION.md`

### Features implemented:
- [x] Game state structure (board, score, status)
- [x] Slide logic (left, right, up, down)
- [x] Merge logic (tiles merge, score increment)
- [x] Spawn logic (random tile spawn)
- [x] Game over detection
- [x] Reducer function for state management
- [x] Unit tests for game logic

**Deliverable:** Pure game logic functions that are fully tested and can be validated via unit tests.

**Detailed order:**
1. [x] Create types (`types.ts`) - done in Phase 1
2. [x] Create constants (`constants.ts`) - done in Phase 1
3. [x] Implement slide logic (`slide.ts`)
4. [x] Implement merge logic (`merge.ts`)
5. [x] Implement spawn logic (`spawn.ts`)
6. [x] Implement game over check (`checkGameOver.ts`)
7. [x] Create reducer (`reducer.ts`)
8. [x] Write unit tests - 49 tests, all passing

**Status:** Phase 2 COMPLETE - all game logic functions implemented and fully tested with Vitest.

---

## Phase 3: Game UI Component (Complete)

**Reference Files:** `UI-UX-SPEC.md`, `GAME-MECHANICS.md`

### Features implemented:
- [x] Game board component (4x4 grid)
- [x] Tile component with styling and animations (shadcn + aceternity)
- [x] Score display component
- [x] Basic animations (slide, merge, spawn) using Framer Motion
- [x] Game over modal (shadcn Dialog)
- [x] Restart button
- [x] Keyboard input handling (arrow keys)
- [x] Touch swipe (mobile) and mouse drag (desktop)
- [x] Responsive design for mobile and desktop
- [x] Game feel polish: board pulse, score delta, invalid move shake
- [x] Optional feedback: sound toggle (spawn/merge) + haptic toggle (mobile)
- [x] Onboarding hint (auto-dismiss)

**Deliverable:** Game playable in the browser with a polished UI/UX, responsive layout, and rich feedback.

**Detailed order:**
1. [x] Create GameBoard component (static grid first)
2. [x] Create Tile component with styling and aceternity animations
3. [x] Integrate game logic with React state using reducer
4. [x] Implement keyboard controls
5. [x] Add slide animation using Framer Motion
6. [x] Add merge animation with pop effect
7. [x] Add spawn animation for new tiles
8. [x] Create GameOver modal using shadcn Dialog
9. [x] Implement restart functionality
10. [x] Responsive styling
11. [x] Touch swipe + mouse drag input
12. [x] Game feel polish (board pulse, score delta, invalid move shake)
13. [x] Optional feedback (sound/haptics) + onboarding hint

**Status:** Phase 3 COMPLETE - Game UI fully implemented and playable in the browser.

---

## Phase 4: Multi-Page Structure (Complete)

**Reference Files:** `PAGES-ROUTING.md`

### Features implemented:
- [x] Setup App Router structure
- [x] Home page (redirect to /play or landing)
- [x] `/play` page with game component
- [x] Navigation component (header/navbar)
- [x] Basic layout component

**Deliverable:** Multi-page structure with working navigation.

**Status:** Phase 4 COMPLETE - Multi-page structure and navigation are working.

**Detailed order:**
1. [x] Setup routing structure
2. [x] Create layout component with navigation
3. [x] Create `/play` page (move game component here)
4. [x] Create home page
5. [x] Test navigation across pages

---

## Phase 5: Badge System Logic (Complete)

**Reference Files:** `BADGE-SYSTEM.md`, `DATA-MODELS.md`

### Features implemented:
- [x] Badge data structure
- [x] Badge unlock logic (check score threshold)
- [x] Badge state management
- [x] Local storage persistence for badges
- [x] Badge unlock detection after game over
- [x] Badge unlock toast/popup after game over
- [x] High score storage (localStorage)
- [x] Storage schema guard + migration (`badges_v1`)
- [x] Analytics hook event `badge_unlocked`
- [x] Tests for loadBadgesFromStorage (array/object/corrupt)

**Deliverable:** Badge system logic that can detect unlocks and persist to local storage.

**Status:** Phase 5 COMPLETE - Badge logic, persistence, and unlock testing validated.

**Detailed order:**
1. [x] Define badge types and default badges
2. [x] Create badge unlock function
3. [x] Integrate with game over flow
4. [x] Implement local storage save/load
5. [x] Test badge unlock with various scores
6. [x] Add toast/popup when badge unlocked
7. [x] Save high score to local storage
8. [x] Add schema versioning and migration
9. [x] Add analytics event hook
10. [x] Add storage load + corrupt data tests

---

## Phase 6: Badge Display Page (Complete)

**Reference Files:** `BADGE-SYSTEM.md`, `PAGES-ROUTING.md`

### Features implemented:
- [x] `/badges` page
- [x] Badge card component
- [x] Display all badge tiers
- [x] Visual distinction (owned vs locked)
- [x] Badge styling per tier
- [x] Badge progress summary + claim shortcut
- [x] Tier icon (SVG) per badge
- [x] Claimed timestamp display

**Deliverable:** Badge page showing all tiers with clear status indicators.

**Status:** Phase 6 COMPLETE - Badge page ready with status and progress.

**Detailed order:**
1. [x] Create `/badges` page
2. [x] Create BadgeCard component
3. [x] Load badges from local storage
4. [x] Badge progress summary + claim shortcut
5. [x] Styling for owned badges (highlighted)
6. [x] Styling for locked badges (greyed out)
7. [x] Tier icon (SVG) per badge
8. [x] Claimed timestamp display
9. [x] Test with various badge states

---

## Phase 7: Claim Flow (Complete)

**Reference Files:** `CLAIM-FLOW.md`, `BADGE-SYSTEM.md`

### Features implemented:
- [x] `/claim` page
- [x] List eligible badges (unlocked but not claimed)
- [x] Claim button per badge
- [x] Claim confirmation flow
- [x] Update badge state after claim
- [x] Success feedback
- [x] Navigation to /badges after claim

**Deliverable:** Complete claim flow from unlock to claim.

**Status:** Phase 7 COMPLETE - Claim flow validated with unit tests and manual UI testing.

**Detailed order:**
1. [x] Create `/claim` page
2. [x] Filter badges (unlocked but not claimed)
3. [x] Create claim button
4. [x] Implement claim action (update state)
5. [x] Save to local storage
6. [x] Show success message
7. [x] Update /badges page after claim
8. [x] Validate claim flow (unit tests + manual UI)

### Phase 7 Feedback
- [x] Claim flow complete: list eligible, confirm, update state, and persist
- [x] UX is clear: success banner + CTA to `/badges`, informative empty state
- [x] Visual consistency improved: tier colors + claim button styling
- [x] Manual UI testing done on desktop/mobile
- [x] Accessibility: success feedback with `aria-live`
- [x] UI: brief loading state on confirmation button

---

## Phase 8: Integration and Polish

**Reference Files:** `MVP-SCOPE.md`, `SUCCESS-CRITERIA.md`, `TESTING-MATRIX.md`, `PERFORMANCE-BASELINE.md`, `POLISH-CHECKLIST.md`

### Features to implement:
- [x] End-to-end testing for all flows
- [x] Bug fixes
- [x] UI/UX polish
- [x] Performance optimization
- [x] Mobile responsiveness check
- [x] Cross-browser testing

**Status:** Phase 8 COMPLETE - MVP ready for demo validation.

**Deliverable:** MVP complete and ready for demo.

**Detailed order:**
1. Test all user flows
2. Fix bugs found
3. Polish animations and transitions
4. Optimize performance
5. Test on multiple devices
6. Final review against MVP-SCOPE.md

**Progress update:**
- E2E coverage added for navigation, play smoke, badges state, and claim flow.
- E2E run on 2026-01-24: 20/20 tests passed.
- Touch gesture cleanup on cancel and reduced-motion handling for animations.
- Production Lighthouse baseline captured in `PERFORMANCE-BASELINE.md`.
- Mobile throttling baseline captured in `PERFORMANCE-BASELINE.md`.
- Mobile perf preset baseline captured in `PERFORMANCE-BASELINE.md`.
- Release summary published in `RELEASE-SUMMARY.md`.
- Lighthouse baseline captured in `PERFORMANCE-BASELINE.md` (local dev run).
- Cross-browser + mobile checks validated via Playwright engines and device emulation (see `TESTING-MATRIX.md`).

---

## Progress Tracking

Use the checklist above to track progress. Each phase should be complete before moving to the next.

## Tips

1. **Do not skip testing** - Test each phase before moving on
2. **Commit often** - Commit after each small feature
3. **Refer to the docs** - Read reference files before implementation
4. **Start simple** - Build the basic version first, then add polish
5. **Test in the browser** - Do not rely only on unit tests
6. **English only** - All user-facing content must be in English (see `UI-UX-SPEC.md`)

## Iteration

If issues are found or changes are needed, update the relevant docs and continue implementation.

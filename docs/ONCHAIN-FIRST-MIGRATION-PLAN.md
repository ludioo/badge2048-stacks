# Onchain-First Migration Plan: Remove Dual State Tracking

**Date**: 2026-01-27  
**Status**: 🚧 In Progress — Phase 1 Complete  
**Strategy**: Option 2 — Onchain-First with Cache (Read-Only)  
**Priority**: High — Architecture Improvement  
**Scope**: Desktop first; mobile refinement later

---

## Executive Summary

**Objective**: Migrate from dual state tracking (localStorage + blockchain) to a **single source of truth** (blockchain only), with localStorage used only as a **read-only cache** for performance.

**Current Problem**:
- Badge state is tracked in two places: localStorage (offchain) and blockchain (onchain)
- Unclear which source is authoritative (onchain vs offchain)
- Dual state can cause inconsistency

**Solution**:
- **Blockchain = Single Source of Truth** for badge state
- **localStorage = Read-Only Cache** for performance
- **Clear separation**: Data flow is blockchain → cache, not the other way around

**Impact**:
- ✅ Single source of truth (blockchain)
- ✅ No confusion between offchain and onchain
- ✅ Good performance via cache
- ✅ Clear architecture
- ⚠️ Breaking change: existing offchain state will be migrated to onchain-only flow

---

## Current State Analysis

### Current Badge State Tracking (Dual State)

**localStorage (`badges_v1`)**:
```typescript
{
  tier: 'bronze',
  threshold: 1024,
  unlocked: true,      // ← OFFCHAIN tracking
  claimed: true,       // ← OFFCHAIN tracking
  claimedAt: '...',    // ← OFFCHAIN timestamp
  onchainMinted: true, // ← ONCHAIN status
  tokenId: 1,          // ← ONCHAIN data
  txId: '0x...',       // ← ONCHAIN data
  mintedAt: '...'      // ← ONCHAIN timestamp
}
```

**Issues**:
1. **Dual tracking**: `unlocked`/`claimed` (offchain) vs `onchainMinted` (onchain)
2. **Confusion**: Which is the source of truth?
3. **Inconsistency**: offchain state bisa berbeda dengan onchain state
4. **Complexity**: Logic harus handle both offchain dan onchain

### Current Flow

```
Game Over → Unlock Badge (offchain) → Save to localStorage
                                    ↓
                            Navigate to /claim
                                    ↓
                          Click "Claim" button
                                    ↓
                          Mint Badge (onchain)
                                    ↓
                      Update localStorage with onchain data
```

**Problem**: Badge unlock and claim happen offchain first, then onchain — i.e. dual state.

---

## Target Architecture (Onchain-First)

### Target Badge State (Onchain-First dengan Cache)

**Blockchain (Source of Truth)**:
- Badge ownership: `get-badge-ownership(player, tier)` → returns `tokenId` or `none`
- High score: `get-high-score(player)` → returns score
- Badge metadata: `get-badge-metadata(tokenId)` → returns metadata

**localStorage (Read-Only Cache)**:
```typescript
{
  tier: 'bronze',
  threshold: 1024,        // Static config (unchanged)
  onchainMinted: true,    // Cached from blockchain
  tokenId: 1,             // Cached from blockchain
  txId: '0x...',          // Cached from blockchain
  mintedAt: '...',        // Cached from blockchain
  _cachedAt: '...',       // Cache timestamp (for expiry logic)
}
```

**Removed Fields**:
- ❌ `unlocked` (offchain) → Replaced by high score vs threshold check
- ❌ `claimed` (offchain) → Replaced by `onchainMinted` check
- ❌ `claimedAt` (offchain) → Replaced by `mintedAt` (onchain)

### Target Flow

```
Game Over → Check High Score
                ↓
        High Score ≥ Threshold?
                ↓
            Yes → Badge Eligible
                ↓
        Navigate to /claim
                ↓
    Show "Mint Badge" button
                ↓
    Click "Mint" → Transaction
                ↓
    Transaction Success
                ↓
Query Blockchain → Update Cache
```

**Key Changes**:
1. ✅ No offchain unlock/claim
2. ✅ Badge eligibility computed from high score
3. ✅ Mint badge directly onchain (no offchain claim)
4. ✅ Cache updated from blockchain query after mint

---

## Detailed Task Breakdown

### Phase 1: Setup & Preparation ✅ **COMPLETE** (2026-01-27)

**Status**: ✅ **COMPLETE** — Desktop focus; mobile refinement later.

**Deliverables**:

1. **Codebase review**  
   - Reviewed current badge flow, `ClaimGrid.tsx`, `lib/badges.ts`, `useBadges`, `useBadgeOnchain`, and docs.

2. **Implementation plan**  
   - This document: strategy, phases, tasks, success criteria, rollback, risks.

3. **Branch strategy**  
   - `backup/before-onchain-first-migration`: snapshot of `develop` before migration work.  
   - `feature/onchain-first-migration`: active branch for onchain-first work.

4. **Phase 1 commit (on `feature/onchain-first-migration`)**  
   - Migration plan doc (this file).  
   - ClaimGrid catch-block fix: preserve `unlocked: true` and use `originalTxId` in the “transaction success but token ID query failed” path.

**Manual testing for Phase 1**:
- Phase 1 is setup only (branches + plan + doc).
- **No manual testing of onchain-first flow yet** — that starts after Phase 2–3 (blockchain query hook + badge/claim UI).
- You can still manually test the **existing** flow on `feature/onchain-first-migration` (claim flow, badges, game over) to confirm nothing regressed.

**Next**: Phase 2 — Create blockchain query functions and cache-only badge storage.

---

### Phase 1 — Bug fix: “Already minted” badge still shown as claimable ✅ **FIXED**

**Issue (from manual testing)**:
- User had already minted a tier (e.g. silver) onchain.
- On `/claim` with wallet connected, that tier still appeared as “ready to claim” and they could click Claim → tx submitted → contract returned **1003 (already minted)**.
- Root cause (UI): claimable list was built from **localStorage** before onchain sync finished (or sync hadn’t run yet), so `onchainMinted` was false for that tier and it stayed in the claimable list.
- **Root cause (data)** — token ID extraction in `useBadgeOnchain` returned `null` for the nested [Stacks Blockchain API](https://docs.hiro.so/en/apis/stacks-blockchain-api) format (`{ value: { value: { value: "1" } } }`). Fixed in `hooks/useBadgeOnchain.ts` with an `extractNumber` helper that recursively unwraps `{ value: ... }`.

**Fixes implemented** (in `ClaimGrid.tsx`):

1. **Gate claimable list until sync has completed once**  
   - New state: `onchainSyncCompletedOnce`.  
   - When wallet is connected, `claimableBadges` stays **empty** until the first `syncBadgeStateWithOnchain()` run has completed.  
   - Only after that do we show badges that are `unlocked && !claimed && !onchainMinted`.  
   - Prevents “already minted” tiers from appearing as claimable before we’ve checked the chain.

2. **“Checking badge status” while syncing**  
   - When `(isAuthenticated && address) && !onchainSyncCompletedOnce`, we show “Checking badge status” + spinner instead of “No badges ready to claim”.  
   - User sees that we’re syncing, not that there are zero claimable badges.

3. **On tx error 1003 (already minted), refresh onchain state**  
   - In the `abort_by_response` handler, when `errorCode === 1003`, we call `syncBadgeStateWithOnchain()`.  
   - That run updates badge state from the chain so that tier gets `onchainMinted: true` and is removed from the claimable list.  
   - Next time the list is shown, that tier no longer appears as claimable.

4. **Reset sync gate when wallet disconnects**  
   - When `!isAuthenticated || !address`, we set `onchainSyncCompletedOnce = false` so that after reconnect we wait for a fresh sync before showing claimable badges again.

**Manual testing after this fix**:
- With wallet connected, open `/claim`. You should see “Checking badge status…” briefly, then either “No badges ready to claim” or only tiers that are **not** minted onchain.
- If you already minted silver, silver must **not** appear as claimable after sync.
- If a tx ever returns 1003, the UI should show the error and, after sync runs, that tier should disappear from the claimable list (and appear in minted if that section is shown).

---

### Phase 1 — Bug fix: Badges page shows previous wallet's badges (new wallet) ✅ **FIXED**

**Issue**: On `/badges`, a **new wallet** (never minted) still showed "2 badges owned" etc. because the page used localStorage, which is per-origin, not per-wallet.

**Fix** (in `BadgesGrid.tsx`): When wallet is connected, we fetch onchain ownership for this address and use it as the source of truth for owned/claimed/onchainMinted/unlocked. New wallet → 0 owned, 0 unlocked, 4 locked. "Checking badge status with blockchain…" is shown while syncing.

---

### Phase 1 — Bug fix: 429 / CORS → read ownership lewat backend ✅ **FIXED**

**Issue**: Setelah throttle + cache di client, error 429 Too Many Requests dan CORS dari Hiro API masih sering muncul saat buka `/badges` (browser memanggil `get-badge-ownership` per tier ke Hiro).

**Fix**: Semua **read ownership** dipindah ke backend:
- **API route**: `GET /api/badge-ownership?address=SP...` memanggil Hiro dari server (Next.js API route) dan mengembalikan `{ data: { bronze, silver, gold, elite } }` (tokenId per tier atau `null`).
- **Server module**: `lib/stacks/badgeOwnershipServer.ts` — `getBadgeOwnershipAllTiers(address)` memakai `fetchCallReadOnlyFunction` untuk keempat tier dengan throttle 120 ms antar tier (server-side).
- **BadgesGrid**: Tidak lagi memanggil `getBadgeOwnership` dari `useBadgeOnchain` per tier di browser; memanggil `fetch('/api/badge-ownership?address=...')` dan memakai respons untuk `onchainByTier` / effectiveBadges. Cache 60 s per address tetap di client untuk navigasi ulang.
- **ClaimGrid** ✅ **Migrated** (BE-FE-SEPARATION-PLAN): Tidak lagi memakai `useBadgeOnchain.getBadgeOwnership`. Semua ownership reads (sync, pre-check, post-mint token ID) lewat `fetchBadgeOwnership()` dari `lib/stacks/badgeOwnershipClient.ts` → `/api/badge-ownership`. Satu pola untuk BadgesGrid & ClaimGrid.

**Manfaat**: Satu request dari browser ke app kita; Hiro hanya dipanggil dari backend → CORS hilang di browser, dan rate limit Hiro diperlakukan per server bukan per user.

**Pattern**: Untuk badge ownership reads, selalu pakai `fetchBadgeOwnership(address)` / `getOwnershipForTier(ownershipByTier, tier)` dari `@/lib/stacks/badgeOwnershipClient`. Jangan panggil `getBadgeOwnership` dari `useBadgeOnchain` di production UI (hook tetap dipakai di `app/test-contract/page.tsx` untuk testing).

---

### Phase 1a: Badge State Model (Prep) ✅ **READY**

**Status**: ✅ **READY** — Badge interface already supports onchain fields (from Phase 6).

**Current state**:
- ✅ Badge interface has `onchainMinted`, `tokenId`, `txId`, `mintedAt`
- ✅ Storage helpers backward compatible
- ✅ Helpers available: `badgeNeedsMinting`, `updateBadgeWithOnchainData`, etc.

**No code changes** — Badge model is ready for onchain-first.

---

### Phase 2: Create Blockchain Query Functions

**Status**: ⏳ **TO DO**

**Objective**: Create functions untuk query badge state dari blockchain dengan caching

**Tasks**:

#### Task 2.1: Create Badge State Query Hook

**File**: `hooks/useBadgeState.ts` (NEW)

**Functions**:
- `queryBadgeStateFromBlockchain(address: string)` → Query all badge ownership untuk wallet
- `syncBadgeStateWithCache(badges: BadgeState)` → Update cache di localStorage
- `loadBadgeStateWithSync(address: string)` → Load dari cache, lalu sync dengan blockchain
- `getBadgeEligibility(highScore: number)` → Compute eligible badges dari high score

**Implementation** (use backend API — see BE-FE-SEPARATION-PLAN):
```typescript
import { fetchBadgeOwnership, getOwnershipForTier } from '@/lib/stacks/badgeOwnershipClient'

export function useBadgeState() {
  const { address, isAuthenticated } = useStacksWallet()
  const [badges, setBadges] = useState<BadgeState>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  // Query all badge tiers via backend API (GET /api/badge-ownership)
  const queryBadgeStateFromBlockchain = async (walletAddress: string) => {
    const ownershipByTier = await fetchBadgeOwnership(walletAddress)
    
    const badgeState = BADGE_TIERS.map((tier) => {
      const threshold = BADGE_THRESHOLDS[tier]
      const tokenId = getOwnershipForTier(ownershipByTier, tier)
      return {
        tier,
        threshold,
        onchainMinted: tokenId != null,
        tokenId: tokenId ?? undefined,
        _cachedAt: new Date().toISOString(),
      }
    })
    
    return badgeState
  }
  
  // Sync with cache (localStorage)
  const syncBadgeStateWithCache = (badgeState: BadgeState) => {
    saveBadgesToStorage(badgeState)
  }
  
  // Load badge state with sync
  const loadBadgeStateWithSync = async () => {
    if (!address || !isAuthenticated) return
    
    setLoading(true)
    
    // 1. Load from cache first (for immediate display)
    const cachedBadges = loadBadgesFromStorage()
    setBadges(cachedBadges)
    
    // 2. Query blockchain in background
    setSyncing(true)
    const blockchainBadges = await queryBadgeStateFromBlockchain(address)
    
    // 3. Update state and cache
    setBadges(blockchainBadges)
    syncBadgeStateWithCache(blockchainBadges)
    setSyncing(false)
    setLoading(false)
  }
  
  // Get eligible badges based on high score
  const getBadgeEligibility = (highScore: number) => {
    return badges.map(badge => ({
      ...badge,
      eligible: highScore >= badge.threshold && !badge.onchainMinted,
    }))
  }
  
  return {
    badges,
    loading,
    syncing,
    loadBadgeStateWithSync,
    getBadgeEligibility,
    queryBadgeStateFromBlockchain,
  }
}
```

**Dependencies**:
- `hooks/useStacksWallet.ts` (existing)
- `hooks/useBadgeOnchain.ts` (existing)
- `lib/badges.ts` (existing)
- `lib/stacks/constants.ts` (existing)

**Testing**:
- [ ] Test query all badge tiers
- [ ] Test cache sync
- [ ] Test load with sync
- [ ] Test eligibility computation
- [ ] Test with wallet connected
- [ ] Test with wallet disconnected

---

#### Task 2.2: Update Badge Storage to Cache-Only

**File**: `lib/badges.ts`

**Changes**:
1. **Remove offchain fields** dari `Badge` interface (koordinasi dengan `lib/game/types.ts`)
2. **Add cache metadata**: `_cachedAt?: string` untuk cache expiry
3. **Update storage functions** untuk cache-only mode:
   - `saveBadgesToStorage()` → Save cache dengan timestamp
   - `loadBadgesFromStorage()` → Load cache, check expiry
   - `clearBadgeCache()` → Clear cache (untuk testing)

**New Functions**:
```typescript
// Check if cache is expired (older than 5 minutes)
export const isCacheExpired = (badges: BadgeState): boolean => {
  if (badges.length === 0) return true
  const firstBadge = badges[0]
  if (!firstBadge._cachedAt) return true
  
  const cacheTime = new Date(firstBadge._cachedAt).getTime()
  const now = new Date().getTime()
  const fiveMinutes = 5 * 60 * 1000
  
  return (now - cacheTime) > fiveMinutes
}

// Clear badge cache
export const clearBadgeCache = (storage?: StorageLike): void => {
  const storageInstance = getStorage(storage)
  if (storageInstance) {
    storageInstance.removeItem(BADGES_STORAGE_KEY)
  }
}
```

**Backward Compatibility**:
- ✅ Old localStorage format (dengan `unlocked`, `claimed`) akan di-migrate
- ✅ Migration: Load old format → Query blockchain → Save new format
- ✅ Old keys akan di-remove setelah migration

**Testing**:
- [ ] Test cache save with timestamp
- [ ] Test cache load
- [ ] Test cache expiry check
- [ ] Test cache clear
- [ ] Test migration from old format

---

### Phase 3: Update Badge Display Logic

**Status**: ⏳ **TO DO**

**Objective**: Update badge display untuk use blockchain state (cached)

**Tasks**:

#### Task 3.1: Update Badges Page

**File**: `app/badges/page.tsx`

**Changes**:
1. **Remove `useBadges` hook** (offchain) → Replace dengan `useBadgeState` (onchain-first)
2. **Load badge state** dari blockchain (dengan cache)
3. **Show sync status** (syncing indicator)
4. **Add refresh button** untuk manual sync

**Implementation**:
```typescript
'use client'

import { useBadgeState } from '@/hooks/useBadgeState'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { useEffect } from 'react'

export default function BadgesPage() {
  const { address, isAuthenticated } = useStacksWallet()
  const { badges, loading, syncing, loadBadgeStateWithSync } = useBadgeState()
  
  // Load badge state on mount
  useEffect(() => {
    if (isAuthenticated && address) {
      loadBadgeStateWithSync()
    }
  }, [isAuthenticated, address])
  
  // Compute stats
  const mintedBadges = badges.filter(b => b.onchainMinted)
  const eligibleBadges = badges.filter(b => !b.onchainMinted && highScore >= b.threshold)
  
  return (
    <div>
      {/* Sync status */}
      {syncing && <div>Syncing with blockchain...</div>}
      
      {/* Refresh button */}
      <button onClick={loadBadgeStateWithSync}>
        Refresh from Blockchain
      </button>
      
      {/* Badge grid */}
      <BadgesGrid badges={badges} />
    </div>
  )
}
```

**Testing**:
- [ ] Test badge display dengan wallet connected
- [ ] Test badge display dengan wallet disconnected
- [ ] Test sync status indicator
- [ ] Test refresh button
- [ ] Test responsive design

---

#### Task 3.2: Update Claim Page

**File**: `app/claim/page.tsx`

**Changes**:
1. **Remove offchain unlock check** → Replace dengan eligibility check dari high score
2. **Load badge state** dari blockchain (dengan cache)
3. **Compute eligible badges**: `highScore >= threshold && !onchainMinted`
4. **Show "Mint Badge" button** instead of "Claim"

**Implementation**:
```typescript
'use client'

import { useBadgeState } from '@/hooks/useBadgeState'
import { loadHighScore } from '@/lib/highScore'
import { useStacksWallet } from '@/hooks/useStacksWallet'
import { useEffect, useState } from 'react'

export default function ClaimPage() {
  const { address, isAuthenticated } = useStacksWallet()
  const { badges, loading, syncing, loadBadgeStateWithSync, getBadgeEligibility } = useBadgeState()
  const [highScore, setHighScore] = useState(0)
  
  // Load high score and badge state
  useEffect(() => {
    const score = loadHighScore()
    setHighScore(score)
    
    if (isAuthenticated && address) {
      loadBadgeStateWithSync()
    }
  }, [isAuthenticated, address])
  
  // Get eligible badges
  const eligibleBadges = getBadgeEligibility(highScore).filter(b => b.eligible)
  
  return (
    <div>
      {/* High score display */}
      <div>Your High Score: {highScore}</div>
      
      {/* Eligible badges */}
      {eligibleBadges.length === 0 ? (
        <div>No badges available to mint. Play more to unlock!</div>
      ) : (
        <ClaimGrid badges={eligibleBadges} />
      )}
    </div>
  )
}
```

**Testing**:
- [ ] Test eligible badge computation
- [ ] Test with high score = 0 (no eligible badges)
- [ ] Test with high score = 1024 (bronze eligible)
- [ ] Test with high score = 2048 (bronze + silver eligible)
- [ ] Test wallet not connected prompt
- [ ] Test responsive design

---

#### Task 3.3: Update Claim Grid Component

**File**: `components/badge/ClaimGrid.tsx`

**Changes**:
1. **Remove offchain claim logic** (already removed in Phase 7.2)
2. **Update button text**: "Claim Badge" → "Mint Badge"
3. **After mint success**: Query blockchain → Update cache
4. **Remove badge dari eligible list** setelah mint success

**Implementation**:
```typescript
// In handleConfirmClaim, after transaction success:

// Re-sync badge state from blockchain
await loadBadgeStateWithSync()

// Badge will be removed from eligible list automatically
// because onchainMinted = true after sync
```

**Testing**:
- [ ] Test mint flow
- [ ] Test badge removal after mint
- [ ] Test cache update after mint
- [ ] Test error handling

---

### Phase 4: Update Game Over Flow

**Status**: ⏳ **TO DO**

**Objective**: Update game over flow untuk tidak save offchain unlock

**Tasks**:

#### Task 4.1: Remove Offchain Badge Unlock

**File**: `components/game/Game.tsx` (atau dimana game over logic)

**Changes**:
1. **Remove**: `unlockBadgesForScore()` call (offchain unlock)
2. **Keep**: High score save ke localStorage
3. **Add**: Notification untuk eligible badges (computed dari high score)
4. **Add**: Link ke `/claim` page

**Implementation**:
```typescript
// Game over handler
const handleGameOver = () => {
  const finalScore = score
  
  // Save high score (offchain, for UX)
  saveHighScore(finalScore)
  
  // DON'T unlock badges offchain anymore
  // unlockBadgesForScore(finalScore) ← REMOVE THIS
  
  // Compute eligible badges from high score
  const eligibleBadges = BADGE_TIERS.filter(tier => {
    const threshold = BADGE_THRESHOLDS[tier]
    return finalScore >= threshold
  })
  
  // Show notification if eligible badges
  if (eligibleBadges.length > 0) {
    showNotification(
      `You're eligible for ${eligibleBadges.length} badge(s)! Mint them onchain.`,
      { action: 'Go to Claim', link: '/claim' }
    )
  }
  
  setGameStatus('gameover')
}
```

**Testing**:
- [ ] Test game over dengan score < 1024 (no badges)
- [ ] Test game over dengan score = 1024 (bronze eligible)
- [ ] Test game over dengan score = 2048 (bronze + silver eligible)
- [ ] Test notification display
- [ ] Test link ke `/claim` page

---

### Phase 5: Migration Strategy

**Status**: ⏳ **TO DO**

**Objective**: Migrate existing users dari offchain state ke onchain-first

**Tasks**:

#### Task 5.1: Create Migration Function

**File**: `lib/badges.ts`

**Function**:
```typescript
/**
 * Migrate old badge state (offchain) to new badge state (onchain-first)
 * 
 * Strategy:
 * 1. Load old badge state from localStorage
 * 2. For badges with claimed=true but onchainMinted=false:
 *    - Keep in localStorage sebagai "pending mint"
 *    - Show in /claim page dengan "Mint to Blockchain" button
 * 3. For badges with onchainMinted=true:
 *    - Keep onchain data, remove offchain data
 * 4. Save new format to localStorage
 */
export const migrateBadgeState = async (
  address: string,
  getBadgeOwnership: (address: string, tier: BadgeTier) => Promise<any>
): Promise<BadgeState> => {
  // 1. Load old state
  const oldBadges = loadBadgesFromStorage()
  
  // 2. Query blockchain for each tier
  const onchainBadges = await Promise.all(
    BADGE_TIERS.map(async tier => {
      const ownership = await getBadgeOwnership(address, tier)
      return {
        tier,
        threshold: BADGE_THRESHOLDS[tier],
        onchainMinted: ownership.data !== null,
        tokenId: ownership.data?.tokenId,
        txId: ownership.data?.txId,
        mintedAt: ownership.data?.mintedAt,
        _cachedAt: new Date().toISOString(),
      }
    })
  )
  
  // 3. Save new format
  saveBadgesToStorage(onchainBadges)
  
  // 4. Remove legacy keys
  const storage = getStorage()
  if (storage) {
    storage.removeItem(LEGACY_BADGES_STORAGE_KEY)
  }
  
  return onchainBadges
}
```

**Testing**:
- [ ] Test migration dengan old format (unlocked, claimed)
- [ ] Test migration dengan mixed state (some onchain, some offchain)
- [ ] Test migration dengan all onchain
- [ ] Test legacy key removal

---

#### Task 5.2: Add Migration Trigger

**Location**: `app/layout.tsx` atau wallet connect handler

**Implementation**:
```typescript
// In wallet connect handler or app mount
useEffect(() => {
  if (isAuthenticated && address) {
    // Check if migration needed
    const badges = loadBadgesFromStorage()
    const needsMigration = badges.some(b => 
      b.hasOwnProperty('unlocked') || b.hasOwnProperty('claimed')
    )
    
    if (needsMigration) {
      console.log('[Migration] Old badge format detected, migrating...')
      migrateBadgeState(address, getBadgeOwnership).then(newBadges => {
        console.log('[Migration] Migration complete:', newBadges)
      })
    }
  }
}, [isAuthenticated, address])
```

**Testing**:
- [ ] Test migration trigger pada wallet connect
- [ ] Test migration trigger pada app mount
- [ ] Test skip migration jika sudah new format

---

### Phase 6: Remove Offchain State Completely

**Status**: ⏳ **TO DO**

**Objective**: Clean up code, remove unused offchain logic

**Tasks**:

#### Task 6.1: Remove Unused Functions

**Files to Update**:
- `lib/badges.ts`:
  - ❌ Remove `unlockBadgesForScore()` (tidak dipakai lagi)
  - ❌ Remove `claimBadgeForTier()` (tidak dipakai lagi)
  - ✅ Keep `badgeNeedsMinting()` (masih dipakai untuk migration)
  - ✅ Keep `updateBadgeWithOnchainData()` (masih dipakai untuk sync)

- `hooks/useBadges.ts`:
  - ⚠️ **Deprecate entire hook** (tidak dipakai lagi)
  - Replace dengan `hooks/useBadgeState.ts` (new hook)

**Testing**:
- [ ] Verify no references ke removed functions
- [ ] Run TypeScript check
- [ ] Run unit tests
- [ ] Run E2E tests

---

#### Task 6.2: Update Type Definitions

**File**: `lib/game/types.ts`

**Changes**:
```typescript
// OLD Badge interface (with offchain fields)
interface Badge {
  tier: BadgeTier
  threshold: number
  unlocked: boolean      // ← REMOVE
  claimed: boolean       // ← REMOVE
  claimedAt?: string     // ← REMOVE
  onchainMinted?: boolean
  tokenId?: number
  txId?: string
  mintedAt?: string
}

// NEW Badge interface (onchain-first)
interface Badge {
  tier: BadgeTier
  threshold: number
  onchainMinted: boolean   // No longer optional
  tokenId?: number
  txId?: string
  mintedAt?: string
  _cachedAt?: string       // Cache metadata
}
```

**Testing**:
- [ ] TypeScript compilation succeeds
- [ ] No type errors
- [ ] Unit tests pass

---

### Phase 7: Testing & Validation

**Status**: ⏳ **TO DO**

**Objective**: Comprehensive testing untuk ensure no regressions

**Testing Checklist**:

#### Unit Tests

- [ ] `lib/badges.ts`:
  - [ ] Cache save/load
  - [ ] Cache expiry check
  - [ ] Cache clear
  - [ ] Migration function

- [ ] `hooks/useBadgeState.ts`:
  - [ ] Query blockchain
  - [ ] Sync with cache
  - [ ] Load with sync
  - [ ] Eligibility computation

#### Integration Tests

- [ ] Badge display on `/badges` page
- [ ] Badge eligibility on `/claim` page
- [ ] Mint flow end-to-end
- [ ] Cache sync after mint
- [ ] Migration flow

#### E2E Tests

- [ ] Full user flow: Play → Game Over → Mint → View Badge
- [ ] Wallet connect → Load badges → Display
- [ ] Mint badge → Cache update → Badge removed from eligible
- [ ] Refresh page → Cache load → Sync with blockchain

#### Manual Tests

- [ ] Test dengan wallet connected
- [ ] Test dengan wallet disconnected
- [ ] Test dengan no badges minted
- [ ] Test dengan some badges minted
- [ ] Test dengan all badges minted
- [ ] Test cache expiry (wait 5 minutes)
- [ ] Test manual refresh
- [ ] Test migration dari old format

---

## Implementation Steps (Sequential)

### Step 1: Setup & Preparation (Est: 1 hour) ✅ **COMPLETE**

1. ✅ Review current codebase
2. ✅ Create this implementation plan document
3. ✅ Create backup branch: `backup/before-onchain-first-migration` (from `develop`)
4. ✅ Create feature branch: `feature/onchain-first-migration` (from `develop`)
5. ✅ Commit Phase 1 deliverables: plan doc + ClaimGrid catch-block fix (on feature branch)

### Step 2: Create Blockchain Query Functions (Est: 2-3 hours)

1. Create `hooks/useBadgeState.ts` (Task 2.1)
2. Update `lib/badges.ts` untuk cache-only (Task 2.2)
3. Unit tests untuk new functions
4. Verify TypeScript compilation

### Step 3: Update Badge Display (Est: 2-3 hours)

1. Update `app/badges/page.tsx` (Task 3.1)
2. Update `app/claim/page.tsx` (Task 3.2)
3. Update `components/badge/ClaimGrid.tsx` (Task 3.3)
4. Test badge display manually

### Step 4: Update Game Over Flow (Est: 1 hour)

1. Update `components/game/Game.tsx` (Task 4.1)
2. Remove offchain unlock
3. Add notification
4. Test game over flow

### Step 5: Implement Migration (Est: 2 hours)

1. Create migration function (Task 5.1)
2. Add migration trigger (Task 5.2)
3. Test migration with old data

### Step 6: Clean Up (Est: 1 hour)

1. Remove unused functions (Task 6.1)
2. Update type definitions (Task 6.2)
3. Run linter
4. Fix warnings

### Step 7: Testing (Est: 3-4 hours)

1. Run unit tests
2. Run integration tests
3. Run E2E tests
4. Manual testing
5. Fix bugs

### Step 8: Documentation (Est: 1 hour)

1. Update README.md
2. Update API documentation
3. Add migration guide
4. Update changelog

---

## Success Criteria

### Functional Requirements

- ✅ Badge state hanya dari blockchain (single source of truth)
- ✅ localStorage hanya sebagai read-only cache
- ✅ Cache sync dengan blockchain setiap load
- ✅ Badge eligibility computed dari high score
- ✅ No more offchain unlock/claim
- ✅ Migration dari old format berjalan smooth

### Non-Functional Requirements

- ✅ Performance: Cache load instant (<100ms)
- ✅ Performance: Blockchain sync <2 seconds
- ✅ UX: Loading indicators selama sync
- ✅ UX: Manual refresh button available
- ✅ Backward compatibility: Old format di-migrate
- ✅ No breaking changes untuk existing users

### Testing Requirements

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Manual testing complete
- ✅ No console errors
- ✅ No TypeScript errors

---

## Rollback Plan

**If migration fails**:

1. **Rollback code**:
   ```bash
   git checkout backup/before-onchain-first-migration
   ```

2. **Restore localStorage** (if needed):
   - User dapat re-claim badges offchain
   - Mint ke onchain later

3. **Communication**:
   - Show notification: "Migration paused, please try again later"
   - Provide fallback flow

**Rollback triggers**:
- Migration error rate >10%
- Critical bugs discovered
- Performance degradation >50%
- User complaints spike

---

## Risk Assessment

### High Risk

- ⚠️ **Data loss**: User loses badge progress
  - **Mitigation**: Backup localStorage sebelum migration
  - **Fallback**: Keep old data, allow re-mint

- ⚠️ **Performance**: Blockchain query lambat
  - **Mitigation**: Cache dengan aggressive expiry
  - **Fallback**: Show cached data first, sync in background

### Medium Risk

- ⚠️ **Migration bugs**: Old format tidak ter-migrate dengan benar
  - **Mitigation**: Comprehensive testing
  - **Fallback**: Manual migration tool

- ⚠️ **UX confusion**: User tidak paham perubahan
  - **Mitigation**: Clear messaging, tooltips, help text
  - **Fallback**: Show migration guide

### Low Risk

- ⚠️ **Breaking changes**: Existing integrations break
  - **Mitigation**: Maintain backward compatibility
  - **Fallback**: Provide adapter functions

---

## Timeline Estimation

**Total Estimated Time**: 15-18 hours

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Prep & Planning | 1 hour |
| Phase 2 | Blockchain Query Functions | 2-3 hours |
| Phase 3 | Badge Display Logic | 2-3 hours |
| Phase 4 | Game Over Flow | 1 hour |
| Phase 5 | Migration Strategy | 2 hours |
| Phase 6 | Clean Up | 1 hour |
| Phase 7 | Testing | 3-4 hours |
| Phase 8 | Documentation | 1 hour |
| **Buffer** | Unexpected issues | 2-3 hours |

**Realistic Timeline**: 2-3 working days (part-time work)

---

## Progress Tracking

### Phase Completion

- [x] **Phase 1: Setup & Preparation** ✅ (2026-01-27)
  - Branches created; plan doc + ClaimGrid fix committed on `feature/onchain-first-migration`
  - Manual testing of **onchain-first flow** will be available after Phase 2–3
- [ ] Phase 2: Blockchain Query Functions
- [ ] Phase 3: Badge Display Logic
- [ ] Phase 4: Game Over Flow
- [ ] Phase 5: Migration Strategy
- [ ] Phase 6: Clean Up
- [ ] Phase 7: Testing
- [ ] Phase 8: Documentation

### Task Completion

**Phase 2**:
- [ ] Task 2.1: Create Badge State Query Hook
- [ ] Task 2.2: Update Badge Storage to Cache-Only

**Phase 3**:
- [ ] Task 3.1: Update Badges Page
- [ ] Task 3.2: Update Claim Page
- [ ] Task 3.3: Update Claim Grid Component

**Phase 4**:
- [ ] Task 4.1: Remove Offchain Badge Unlock

**Phase 5**:
- [ ] Task 5.1: Create Migration Function
- [ ] Task 5.2: Add Migration Trigger

**Phase 6**:
- [ ] Task 6.1: Remove Unused Functions
- [ ] Task 6.2: Update Type Definitions

**Phase 7**:
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] E2E Tests
- [ ] Manual Tests

---

## Related Documents

- `docs/ONCHAIN_STACKS_BADGE2048.md` — Onchain implementation overview
- `docs/DATA-MODELS.md` — Badge data model specification
- `docs/BADGE-SYSTEM.md` — Badge system rules
- `docs/CLAIM-FLOW.md` — Original claim flow (pre-onchain)
- `docs/PHASE7-2-IMPLEMENTATION-PLAN.md` — Onchain minting implementation
- `docs/PHASE7-2-BUG-ANALYSIS.md` — Phase 7.2 bug analysis

---

**Document Version**: 1.1  
**Last Updated**: 2026-01-27  
**Status**: 🚧 In Progress — Phase 1 Complete  
**Current Branch**: `feature/onchain-first-migration`  
**Next Action**: Phase 2 — Create blockchain query functions (`useBadgeState`, cache-only storage)

---

## Manual Testing Guide

### Phase 1 — Manual Testing Checklist

**Scope**: Phase 1 is setup (branches, plan doc, fixes) plus the **“already minted”** fix. Use this checklist to confirm existing flows and that already-minted tiers never appear as claimable.  
**Target**: Desktop. Mobile refinement later.

**After the Phase 1 “already minted” fix**: Steps 4 and **4b** are the main checks — step 4 for normal Play → Claim → Mint, step 4b for “already minted not shown as claimable”.

---

#### 1. Prepare environment

```bash
git checkout feature/onchain-first-migration
npm run dev
```

Open `http://localhost:3000` in your browser (desktop).

---

#### 2. Wallet disconnected — clean state (Claim page)

**Goal**: With wallet disconnected, no stale “claimable” badges from localStorage.

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Ensure wallet is **disconnected** (navbar shows Connect, not address). | — |
| 2.2 | Go to **`/claim`**. | “No badges ready to claim” (or empty claimable list). |
| 2.3 | Do **Ctrl+Shift+R** (hard refresh). Stay on `/claim`, wallet still disconnected. | Still “No badges ready to claim.” No “1 badge ready to claim” from old play. |

If you see “X badge(s) ready to claim” while wallet is disconnected, the claim-page fix is not working.

---

#### 3. Wallet disconnected — clean state (Badges page)

**Goal**: With wallet disconnected, no stale unlocked/claimable/owned counts from localStorage.

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Wallet **disconnected**. Go to **`/badges`**. | “0 of 4 badges unlocked”, “No badges ready to claim”, Owned: 0, Claimable: 0, Locked: 4. All four cards show **Locked**. |
| 3.2 | **Ctrl+Shift+R** on `/badges`, wallet still disconnected. | Same as 3.1. No progress bar, no “Go to Claim,” no “1 unlocked” from old play. |

If you see unlocked/claimable/owned > 0 or “Go to Claim” while wallet is disconnected, the badges-page fix is not working.

---

#### 4. Wallet connected — existing flow (Play → Claim → Mint)

**Goal**: Play → unlock → claim → mint onchain still works; no regression.

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Connect wallet (navbar). | Wallet shows as connected. |
| 4.2 | Go to **`/claim`**. | Brief “Checking badge status…” then either “No badges ready to claim” or the claimable list. |
| 4.3 | Go to **`/play`**, play until score ≥ 1024 (e.g. bronze). | Game over, badge unlocked (offchain). |
| 4.4 | Go to **`/claim`** again. | At least one badge “ready to claim” (after sync, only tiers **not** already minted onchain). |
| 4.5 | Click “Claim badge” → Confirm → Approve in wallet. | Transaction submitted, then “Badge minted successfully!” (or clear error). |
| 4.6 | Open **`/badges`**. | That badge shows as owned/minted. |

---

#### 4b. Wallet connected — already-minted not shown as claimable ✅ **New**

**Goal**: Tiers you already minted onchain must never appear as “ready to claim”; you must not be able to trigger error 1003 from the UI.

| Step | Action | Expected |
|------|--------|----------|
| 4b.1 | Ensure you have at least one tier **already minted** onchain (e.g. silver) for the connected wallet. | — |
| 4b.2 | Go to **`/claim`** with that wallet connected. | Brief “Checking badge status…”, then “No badges ready to claim” **or** only tiers that are **not** minted (e.g. gold/elite if you only minted bronze/silver). |
| 4b.3 | Confirm that the **already-minted** tier (e.g. silver) does **not** appear in “ready to claim” and that there is no “Claim” action for it. | You cannot click “Claim” on that tier; it must not be in the claimable list. |
| 4b.4 | *(Optional)* If a tx ever returns 1003 (e.g. from an old tab or race): after the error is shown, refresh or re-open `/claim`. | That tier no longer appears as claimable; list matches onchain after sync. |

If an already-minted tier still appears as claimable after “Checking badge status…” has finished, the “gate claimable until sync” / “already-minted” fix is not working.

---

#### 5. ClaimGrid catch-block behaviour (optional, hard to trigger)

**Goal**: If “transaction success but token ID query fails,” badge stays unlocked and uses correct `originalTxId`.

This only applies when the token-ID query throws (e.g. network/contract issue right after a successful mint). You don’t need to force this for Phase 1 sign-off. If it happens, check: badge does not become locked, and stored `txId` matches the real tx (e.g. in Stacks Explorer).

---

#### 6. Branch / doc sanity check

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | `git branch` | Current branch is `feature/onchain-first-migration`. |
| 6.2 | Open **`docs/ONCHAIN-FIRST-MIGRATION-PLAN.md`** | Phase 1 marked complete; “Manual Testing Guide” section matches this checklist. |

---

### What is *not* testable in Phase 1

- **Onchain-first flow** (blockchain as single source of truth, cache-only badges) — available after **Phase 2–3** (blockchain query hook + badge/claim UI).
- A separate **“Manual testing for onchain-first”** checklist will be added when Phase 2–3 are done.

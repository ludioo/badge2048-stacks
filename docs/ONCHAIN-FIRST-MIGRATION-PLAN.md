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

**Implementation**:
```typescript
export function useBadgeState() {
  const { address, isAuthenticated } = useStacksWallet()
  const { getBadgeOwnership } = useBadgeOnchain()
  const [badges, setBadges] = useState<BadgeState>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  // Query all badge tiers from blockchain
  const queryBadgeStateFromBlockchain = async (walletAddress: string) => {
    const results = await Promise.all(
      BADGE_TIERS.map(tier => getBadgeOwnership(walletAddress, tier))
    )
    
    // Convert to badge state
    const badgeState = results.map((result, index) => {
      const tier = BADGE_TIERS[index]
      const threshold = BADGE_THRESHOLDS[tier]
      const onchainData = result.data
      
      return {
        tier,
        threshold,
        onchainMinted: onchainData !== null,
        tokenId: onchainData?.tokenId,
        txId: onchainData?.txId,
        mintedAt: onchainData?.mintedAt,
        _cachedAt: new Date().toISOString(), // Cache timestamp
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

### After Phase 1 (Setup & Preparation)

**What you can test now** (on branch `feature/onchain-first-migration`):

1. **Existing flows** — Same as before Phase 1:
   - Play game, unlock badge (offchain), go to `/claim`, connect wallet, claim → mint onchain.
   - `/badges`: badges still load from localStorage + onchain data.
   - Confirm the **ClaimGrid catch-block fix**: if “transaction success but token ID query fails,” the badge still keeps `unlocked: true` and uses the correct `originalTxId`; no “locked” or wrong txId.

2. **How to run**:
   ```bash
   git checkout feature/onchain-first-migration
   npm run dev
   ```
   Then test on desktop (mobile refinement is later).

**What is not available yet**:
- Onchain-first flow (blockchain as source of truth, cache-only badges) — that will be testable after **Phase 2–3** (blockchain query hook + badge/claim UI updates).
- No new manual test checklist for “onchain-first” until Phase 2–3 are done.

**When to run manual “onchain-first” tests**: After Phase 2–3 implementation, the plan will be updated with a clear **Manual testing for onchain-first** checklist.

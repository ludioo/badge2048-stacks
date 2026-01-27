# BE/FE Separation Plan: Backend Proxy untuk Blockchain Reads

**Date**: 2026-01-27  
**Status**: ✅ Implementation Complete — ClaimGrid Migrated  
**Priority**: High — Foundation untuk ONCHAIN-FIRST migration  
**Branch**: `feature/onchain-first-migration`

---

## Executive Summary

**Objective**: Memperjelas pola Backend/Frontend dengan memindahkan **semua read operations ke blockchain** (khususnya badge ownership) melalui backend proxy, bukan langsung dari browser ke Hiro API.

**Current Problem** (resolved):
- BadgesGrid sudah pakai `/api/badge-ownership` (backend proxy) ✅
- ClaimGrid sebelumnya pakai `useBadgeOnchain` → `getBadgeOwnership` langsung ke Hiro ❌ → **sekarang migrated** ✅
- Semua read ownership lewat backend; tidak ada lagi panggilan Hiro dari browser untuk ownership
- Risiko: CORS errors, 429 rate limiting, duplikasi logic

**Solution**:
- **Single pattern**: Semua read badge ownership lewat `GET /api/badge-ownership`
- **Backend proxy**: Next.js API route sebagai perantara ke Hiro API
- **Client-side**: Hanya fetch ke app kita, tidak langsung ke Hiro
- **Consistency**: BadgesGrid & ClaimGrid pakai endpoint yang sama

**Impact**:
- ✅ No CORS errors dari Hiro
- ✅ Rate limiting di-handle oleh backend (per server, bukan per user)
- ✅ Konsistensi arsitektur: satu pola untuk ownership reads
- ✅ Foundation yang kuat untuk ONCHAIN-FIRST Phase 2 & Phase 7.2

---

## Current State Analysis

### What's Already Done ✅

| Component | Current State | Status |
|-----------|--------------|--------|
| **`/api/badge-ownership` route** | `GET /api/badge-ownership?address=...` | ✅ Implemented |
| **`lib/stacks/badgeOwnershipServer.ts`** | `getBadgeOwnershipAllTiers(address)` | ✅ Implemented |
| **BadgesGrid** | Fetch ownership via `/api/badge-ownership` | ✅ Migrated |
| **Address validation** | Support ST (testnet) & SP (mainnet) | ✅ Fixed |

### What Needed Migration → Done ✅

| Component | Before | After |
|-----------|--------|--------|
| **ClaimGrid** | 13 calls to `getBadgeOwnership` (client → Hiro) | ✅ Uses `fetchBadgeOwnership` via `/api/badge-ownership` |
| **`syncBadgeStateWithOnchain`** | 4 sequential calls + throttle | ✅ 1 API call via `badgeOwnershipClient` |
| **Pre-check before dialog** | 1 call per badge | ✅ `fetchBadgeOwnership` + `getOwnershipForTier` |
| **Post-mint token ID** | `getBadgeOwnership` + retry | ✅ `fetchBadgeOwnership` + retry |
| **Refresh button** | Calls sync (same) | ✅ Unchanged; sync now uses backend API |

---

## Detailed Migration Plan

### Phase 1: Audit ClaimGrid Ownership Reads

**Status**: ✅ Done

**Objective**: Identifikasi semua pemakaian `getBadgeOwnership` di ClaimGrid dan categorize use cases.

#### All `getBadgeOwnership` Calls in ClaimGrid

Dari grep results, ada **13 lokasi** di `ClaimGrid.tsx`:

| Line | Function/Context | Purpose | Frequency |
|------|------------------|---------|-----------|
| 9 | Import | Import hook | - |
| 33 | Hook init | Initialize hook | Once |
| 138 | `syncBadgeStateWithOnchain` | Sync all 4 tiers | On mount + manual |
| 235 | `handleBadgeClick` | Pre-check before dialog | Per badge click |
| 493 | Error handler (1003) | Re-sync after "already minted" | On error |
| 512 | `handleConfirmClaim` | Post-mint get tokenId (1st try) | After mint tx |
| 520 | `handleConfirmClaim` | Post-mint get tokenId (retry) | After 2s delay |
| 688 | Transaction success | Re-sync after success | After tx confirmed |
| 976 | Refresh button | Manual sync trigger | User action |
| 992 | Sync error retry | Retry after sync error | User action |
| 1077 | Refresh link | Manual sync trigger | User action |

#### Categorization

**A. Bulk Sync (4 tiers at once)**
- `syncBadgeStateWithOnchain()` — lines 138, 493, 688, 976, 992, 1077
- Use case: Get ownership untuk semua tier (bronze, silver, gold, elite)
- Current: 4 sequential calls dengan throttle
- **Migration**: Satu call ke `/api/badge-ownership?address=...` → returns all 4 tiers

**B. Single Badge Pre-check**
- `handleBadgeClick()` — line 235
- Use case: Check ownership untuk 1 badge sebelum buka dialog
- Current: 1 call per badge
- **Migration**: Bisa pakai hasil dari sync terakhir (cache), atau fetch ulang jika stale

**C. Post-Mint Token ID**
- `handleConfirmClaim()` — lines 512, 520
- Use case: Get tokenId setelah mint transaction confirmed
- Current: 1 call + retry dengan delay 2s
- **Migration**: Fetch `/api/badge-ownership?address=...` untuk tier yang baru di-mint

---

### Phase 2: Design API Integration Pattern

**Status**: ✅ Done (client helper: `lib/stacks/badgeOwnershipClient.ts`)

#### API Endpoint (Already Exists)

```
GET /api/badge-ownership?address={stacksAddress}
```

**Response Format**:
```typescript
{
  data: {
    bronze: number | null,  // tokenId or null
    silver: number | null,
    gold: number | null,
    elite: number | null
  }
}
```

**Error Responses**:
- `400`: Missing or invalid address
- `500`: Hiro API error or server error

#### Client-Side Helper Function (NEW)

**File**: `lib/stacks/badgeOwnershipClient.ts` (NEW)

```typescript
import type { BadgeTier } from '@/lib/game/types'

export type OwnershipByTier = Record<BadgeTier, number | null>

export interface BadgeOwnershipResponse {
  data: OwnershipByTier
}

/**
 * Fetch badge ownership dari backend API (semua tier sekaligus)
 */
export async function fetchBadgeOwnership(
  address: string
): Promise<OwnershipByTier> {
  if (!address) {
    throw new Error('Address required')
  }

  const res = await fetch(
    `/api/badge-ownership?address=${encodeURIComponent(address)}`
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `HTTP ${res.status}`)
  }

  const json: BadgeOwnershipResponse = await res.json()
  return json.data
}

/**
 * Get ownership untuk single tier dari result
 */
export function getOwnershipForTier(
  ownershipByTier: OwnershipByTier,
  tier: BadgeTier
): number | null {
  return ownershipByTier[tier] ?? null
}
```

#### Usage Pattern in ClaimGrid

**Before (Current)**:
```typescript
const { getBadgeOwnership } = useBadgeOnchain(address)

// Sync all tiers
for (const tier of BADGE_TIERS) {
  const result = await getBadgeOwnership(address, tier)
  const tokenId = result.data?.tokenId ?? null
  // ... update state
}
```

**After (Migration)**:
```typescript
import { fetchBadgeOwnership, getOwnershipForTier } from '@/lib/stacks/badgeOwnershipClient'

// Sync all tiers (single API call)
const ownershipByTier = await fetchBadgeOwnership(address)

// Update state untuk semua tier
for (const tier of BADGE_TIERS) {
  const tokenId = getOwnershipForTier(ownershipByTier, tier)
  // ... update state
}
```

**Benefits**:
- Satu API call untuk 4 tiers (vs 4 sequential calls)
- No throttling needed (backend handles it)
- Consistent error handling
- Same pattern as BadgesGrid

---

### Phase 3: Migrate ClaimGrid Functions

**Status**: ✅ Done

#### Task 3.1: Migrate `syncBadgeStateWithOnchain`

**File**: `components/badge/ClaimGrid.tsx`  
**Current Code**: Lines 119-158

**Changes**:
1. Import `fetchBadgeOwnership` dari `lib/stacks/badgeOwnershipClient`
2. Replace loop dengan single `fetchBadgeOwnership(address)` call
3. Process hasil untuk update state semua tier sekaligus
4. Remove throttle delays (tidak perlu lagi)

**Before**:
```typescript
const syncBadgeStateWithOnchain = async () => {
  setSyncError(null)
  setSyncing(true)
  
  const tiers: BadgeTier[] = ['bronze', 'silver', 'gold', 'elite']
  
  for (const tier of tiers) {
    try {
      const result = await getBadgeOwnership(address, tier)
      const tokenId = result.data?.tokenId ?? null
      
      // Update badge state...
    } catch (err) {
      // Handle error...
    }
    
    // Throttle delay
    if (tier !== 'elite') {
      await new Promise(resolve => setTimeout(resolve, 450))
    }
  }
  
  setSyncing(false)
}
```

**After**:
```typescript
const syncBadgeStateWithOnchain = async () => {
  setSyncError(null)
  setSyncing(true)
  
  try {
    const ownershipByTier = await fetchBadgeOwnership(address)
    
    const updated = currentBadges.map(badge => {
      const tokenId = getOwnershipForTier(ownershipByTier, badge.tier)
      if (tokenId != null) {
        return {
          ...badge,
          onchainMinted: true,
          claimed: true,
          tokenId,
        }
      }
      return badge
    })
    
    replaceBadges(updated)
    setOnchainSyncCompletedOnce(true)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    setSyncError(message)
    console.error('[ClaimGrid] Sync error:', err)
  } finally {
    setSyncing(false)
  }
}
```

**Impact**:
- ✅ 1 API call vs 4 sequential calls
- ✅ No throttling delays (450ms × 3 = 1.35s saved)
- ✅ Simpler error handling
- ✅ Consistent dengan BadgesGrid

---

#### Task 3.2: Migrate Pre-check in `handleBadgeClick`

**File**: `components/badge/ClaimGrid.tsx`  
**Current Code**: Lines 223-240

**Strategy**: 
- Option A: Re-fetch ownership untuk badge ini saja (fresh check)
- Option B: Pakai hasil sync terakhir (faster, tapi bisa stale)

**Recommended: Option A** (safety over speed)

**Before**:
```typescript
const handleBadgeClick = async (badge: Badge) => {
  if (!address) return
  
  try {
    const result = await getBadgeOwnership(address, badge.tier)
    if (result.data?.tokenId != null) {
      // Already minted, don't open dialog
      return
    }
  } catch (err) {
    // Handle error...
  }
  
  setSelectedBadge(badge)
  setIsDialogOpen(true)
}
```

**After**:
```typescript
const handleBadgeClick = async (badge: Badge) => {
  if (!address) return
  
  try {
    const ownershipByTier = await fetchBadgeOwnership(address)
    const tokenId = getOwnershipForTier(ownershipByTier, badge.tier)
    
    if (tokenId != null) {
      // Already minted, refresh badge state
      const updated = currentBadges.map(b => {
        const tid = getOwnershipForTier(ownershipByTier, b.tier)
        if (tid != null) {
          return { ...b, onchainMinted: true, claimed: true, tokenId: tid }
        }
        return b
      })
      replaceBadges(updated)
      return
    }
  } catch (err) {
    console.error('[ClaimGrid] Pre-check error:', err)
    // Continue to dialog (user can retry)
  }
  
  setSelectedBadge(badge)
  setIsDialogOpen(true)
}
```

**Note**: Kita fetch semua tier (bukan hanya 1) karena:
- API endpoint mengembalikan semua tier anyway
- Bisa sekalian update state untuk tier lain juga (bonus sync)
- Consistent pattern

---

#### Task 3.3: Migrate Post-Mint Token ID in `handleConfirmClaim`

**File**: `components/badge/ClaimGrid.tsx`  
**Current Code**: Lines 503-528

**Before**:
```typescript
// After transaction confirmed, get token ID
let ownershipResult = await getBadgeOwnership(address, selectedBadge.tier)

if (!ownershipResult.data?.tokenId) {
  // Retry after 2s
  await new Promise(resolve => setTimeout(resolve, 2000))
  ownershipResult = await getBadgeOwnership(address, selectedBadge.tier)
}

const tokenId = ownershipResult.data?.tokenId || null
```

**After**:
```typescript
// After transaction confirmed, get token ID
let ownershipByTier = await fetchBadgeOwnership(address)
let tokenId = getOwnershipForTier(ownershipByTier, selectedBadge.tier)

if (tokenId == null) {
  // Retry after 2s (blockchain propagation delay)
  await new Promise(resolve => setTimeout(resolve, 2000))
  ownershipByTier = await fetchBadgeOwnership(address)
  tokenId = getOwnershipForTier(ownershipByTier, selectedBadge.tier)
}
```

**Bonus**: Setelah fetch, kita bisa update state untuk semua tier (jika ada yang berubah), tapi untuk saat ini fokus ke tier yang baru di-mint saja.

---

#### Task 3.4: Migrate Refresh Button & Error Retry

**Files**: `components/badge/ClaimGrid.tsx`  
**Current Code**: Lines 976, 992, 1077 (onClick handlers)

**Changes**: Sudah menggunakan `syncBadgeStateWithOnchain()`, jadi setelah Task 3.1 selesai, otomatis pakai backend API.

**No additional changes needed** ✅

---

### Phase 4: Remove Client-Side Hiro Calls

**Status**: ✅ Done (ClaimGrid no longer uses `useBadgeOnchain`; hook kept for test-contract only)

#### Task 4.1: Evaluate `useBadgeOnchain` Usage

**After ClaimGrid migration**:
- ClaimGrid tidak lagi pakai `getBadgeOwnership`
- BadgesGrid tidak pakai `getBadgeOwnership` (sudah pakai backend API)

**Check Other Usages**:
```bash
# Find all imports of useBadgeOnchain
grep -r "useBadgeOnchain" --include="*.tsx" --include="*.ts"
```

**Expected**:
- ✅ `hooks/useBadgeOnchain.ts` (definition)
- ✅ `app/test-contract/page.tsx` (might still use for testing)
- ❌ No other production usage

**Decision**:
- Keep `useBadgeOnchain` untuk:
  - Testing purposes (`test-contract` page)
  - Future read-only calls (high-score, metadata) yang belum punya backend API
- Add comment: "⚠️ For badge ownership reads, use `/api/badge-ownership` instead"

---

### Phase 5: Update Documentation

**Status**: ✅ Done

#### Task 5.1: Update ONCHAIN-FIRST-MIGRATION-PLAN.md

**Changes**:
1. Update "Phase 1 — Bug fix: 429 / CORS" section dengan:
   - ✅ BadgesGrid migrated
   - ✅ ClaimGrid migrated
   - Pattern: All badge ownership reads go through `/api/badge-ownership`

2. Update Phase 2 plan:
   - `queryBadgeStateFromBlockchain` should use `/api/badge-ownership`, not direct `getBadgeOwnership`
   - Example code should show fetch to API route

#### Task 5.2: Update PHASE7-2-IMPLEMENTATION-PLAN.md

**Changes**:
1. Update sync, pre-check, post-mint sections:
   - Replace `getBadgeOwnership` dengan `fetchBadgeOwnership`
   - Update code examples

2. Update polling / token ID extraction:
   - Show new pattern dengan backend API

---

## Implementation Checklist

### Pre-Implementation

- [x] Review current ClaimGrid code
- [x] Confirm all `getBadgeOwnership` locations
- [x] Verify `/api/badge-ownership` works correctly
- [x] Plan testing strategy

### Implementation Tasks

- [x] **Task 3.0**: Create `lib/stacks/badgeOwnershipClient.ts`
  - [x] `fetchBadgeOwnership(address)` function
  - [x] `getOwnershipForTier(ownershipByTier, tier)` helper
  - [x] Type definitions (`OwnershipByTier`, `BadgeOwnershipResponse`)
  - [x] Error handling

- [x] **Task 3.1**: Migrate `syncBadgeStateWithOnchain`
  - [x] Replace 4 sequential calls dengan 1 API call
  - [x] Remove throttle delays
  - [x] Update error handling
  - [x] Sync on mount & manual refresh use `fetchBadgeOwnership`

- [x] **Task 3.2**: Migrate `handleOpenDialog` pre-check
  - [x] Replace single `getBadgeOwnership` dengan `fetchBadgeOwnership`
  - [x] Update state dengan semua tiers (bonus sync)
  - [x] Pre-check before dialog via backend API

- [x] **Task 3.3**: Migrate post-mint token ID in `handleConfirmClaim`
  - [x] Replace `getBadgeOwnership` dengan `fetchBadgeOwnership`
  - [x] Keep retry logic (max 3 attempts, 2s delay)
  - [x] Post-mint token ID via backend API

- [x] **Task 3.4**: Verify refresh buttons
  - [x] Refresh / Retry sync / “Refresh Status” call `syncBadgeStateWithOnchain` (unchanged)
  - [x] No structural changes; sync now uses backend API

- [x] **Task 4.1**: Evaluate `useBadgeOnchain` usage
  - [x] Grep: ClaimGrid no longer uses it; only `app/test-contract/page.tsx` does
  - [x] Warning comment added in `hooks/useBadgeOnchain.ts`

- [x] **Task 5.1**: Update ONCHAIN-FIRST-MIGRATION-PLAN.md
  - [x] Phase 1 — 429/CORS: ClaimGrid migrated
  - [x] Pattern: all badge ownership reads via `/api/badge-ownership`

- [x] **Task 5.2**: Update PHASE7-2-IMPLEMENTATION-PLAN.md
  - [x] Reference backend API for sync / pre-check / post-mint (see BE-FE-SEPARATION-PLAN)

### Testing

- [x] **Unit-level** (`lib/stacks/badgeOwnershipClient.test.ts`):
  - [x] `fetchBadgeOwnership` dengan valid address
  - [x] `fetchBadgeOwnership` dengan invalid/empty address (throws "Address required")
  - [x] `fetchBadgeOwnership` dengan 400 → throws message dari API
  - [x] `fetchBadgeOwnership` dengan 500 / non-string error → throws "HTTP {status}"
  - [x] `fetchBadgeOwnership` dengan invalid response shape → throws "Invalid response..."
  - [x] `getOwnershipForTier` dengan valid tier (returns tokenId)
  - [x] `getOwnershipForTier` dengan null / missing tier (returns null)

- [ ] **Component-level** (manual — gunakan [BE-FE-SEPARATION-MANUAL-TESTING.md](./BE-FE-SEPARATION-MANUAL-TESTING.md)):
  - [x] Skenario 1: Sync on mount (connect wallet) ✅ Validated — Network hanya `/api/badge-ownership`, no Hiro/CORS/429
  - [x] Skenario 2: Pre-check → dialog buka untuk badge belum minted ✅ Validated — mint Bronze berhasil; tombol "Claim badge" pakai "Checking..." + disabled selama pre-check (perbaikan double-click)
  - [x] Skenario 3: Pre-check → dialog tidak buka untuk badge sudah minted ✅ Validated — Bronze minted tanpa tombol claim; Silver claimable terpisah
  - [x] Skenario 4: Post-mint token ID tampil ✅ Validated — token ID 5 via `/api/badge-ownership`; tx polling tetap ke Hiro (out of scope BE-FE)
  - [x] Skenario 5: Refresh / Retry sync ✅ Validated — hanya `/api/badge-ownership`, response ok
  - [x] Skenario 6: Konsistensi /badges vs /claim ✅ Validated — BadgesGrid pakai badge.unlocked untuk non-owned agar claimable selaras dengan /claim

- [ ] **Integration-level** (tercover oleh skenario manual di atas):
  - [ ] Connect wallet → auto sync
  - [ ] Claim badge → post-mint sync gets tokenId
  - [ ] Already minted badge → pre-check blocks dialog
  - [ ] Navigate /badges → /claim → state consistent

### Verification

- [ ] No CORS errors di browser console
- [ ] No 429 rate limit errors
- [ ] BadgesGrid & ClaimGrid show consistent data
- [ ] Token ID displays correctly after mint
- [ ] Sync status shows correctly
- [ ] Error messages are user-friendly
- [ ] Build passes (`npm run build --webpack`)
- [ ] No linter errors

---

## Success Criteria

### Functional

1. ✅ ClaimGrid tidak lagi panggil Hiro API langsung dari browser
2. ✅ Semua badge ownership reads lewat `/api/badge-ownership`
3. ✅ Sync, pre-check, post-mint work correctly dengan backend API
4. ✅ Token ID ter-extract dengan benar setelah mint
5. ✅ No CORS atau 429 errors di ClaimGrid

### Non-Functional

1. ✅ Performance: Sync lebih cepat (1 call vs 4 sequential)
2. ✅ Consistency: BadgesGrid & ClaimGrid pakai pattern yang sama
3. ✅ Maintainability: Satu backend endpoint untuk ownership
4. ✅ Documentation: Plan & implementation docs updated

### Technical Debt

1. ✅ `useBadgeOnchain` usage reduced (hanya untuk testing)
2. ✅ No duplicate ownership read logic
3. ✅ Clear separation: backend handles Hiro, frontend handles UI

---

## Rollback Plan

Jika terjadi critical issue:

1. **Immediate**: Revert ClaimGrid changes, keep old `getBadgeOwnership` pattern
2. **Keep**: BadgesGrid tetap pakai `/api/badge-ownership` (already stable)
3. **Debug**: Investigate issue di backend atau client helper
4. **Re-deploy**: Setelah fix, migrate ClaimGrid lagi

**Low Risk**: BadgesGrid sudah production-ready dengan pattern ini, jadi migration ClaimGrid adalah "extend proven pattern".

---

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Audit | Review current code | 30 min ✅ Done in this doc |
| Phase 2: Design | API pattern & helper | 30 min ✅ Done in this doc |
| Phase 3: Migrate ClaimGrid | Tasks 3.1-3.4 | 2-3 hours |
| Phase 4: Cleanup | Evaluate useBadgeOnchain | 30 min |
| Phase 5: Documentation | Update 2 docs | 30 min |
| Testing | Component + Integration | 1-2 hours |
| **Total** | | **4-6 hours** |

---

## Next Steps

1. ✅ **Review this plan** dengan user (Deal? ✅)
2. ✅ **Create `lib/stacks/badgeOwnershipClient.ts`** (Task 3.0)
3. ✅ **Migrate `syncBadgeStateWithOnchain`** (Task 3.1)
4. ✅ **Migrate pre-check & post-mint** (Tasks 3.2-3.3)
5. ⏳ **Test thoroughly** (manual/E2E: sync, pre-check, post-mint, refresh) → **Panduan skenario manual**: [BE-FE-SEPARATION-MANUAL-TESTING.md](./BE-FE-SEPARATION-MANUAL-TESTING.md)
6. ✅ **Update docs** (BE-FE-SEPARATION-PLAN + ONCHAIN-FIRST + PHASE7-2 ref)
7. ⏳ **Setelah testing lulus**: Centang checklist Testing & Verification, lalu plan dianggap **Done**.

---

## Analisis & Langkah Selanjutnya

### Status Saat Ini

| Area | Status | Keterangan |
|------|--------|------------|
| **Implementasi** | ✅ Selesai | Task 3.0–5.2 semua done; ClaimGrid full migrated |
| **Success criteria** | ✅ Terpenuhi | Ownership lewat backend, no Hiro dari browser |
| **Testing** | ⏳ Belum | Unit / component / integration masih unchecked |
| **Verification** | ⏳ Belum | CORS, 429, konsistensi data, build (ditunda) |

### Yang Sudah Rampung

- Backend proxy (`/api/badge-ownership`) & server module ✅  
- Client helper (`badgeOwnershipClient.ts`) ✅  
- BadgesGrid & ClaimGrid pakai endpoint yang sama ✅  
- Dokumen (BE-FE, ONCHAIN-FIRST, PHASE7-2) sudah diupdate ✅  
- **Bug fix (manual testing)**: "No Badge ready to claim" padahal score sudah unlock — sync sekarang **membersihkan** `onchainMinted`/`claimed` ketika API mengembalikan `null` untuk suatu tier, sehingga onchain jadi source of truth dan badge yang unlocked + belum mint tampil di claimable. Lihat [BE-FE-SEPARATION-MANUAL-TESTING.md](./BE-FE-SEPARATION-MANUAL-TESTING.md).
- **Bug fix (Skenario 6)**: `/badges` menampilkan tier claimable (Silver) sebagai "Locked" — BadgesGrid sekarang memakai `badge.unlocked` dari useBadges untuk tier yang belum mint onchain, sehingga status "Claimable"/"Claim" selaras dengan `/claim`.  

### Langkah Selanjutnya (Prioritas)

1. **Testing (fokus utama)**  
   - **Manual**:  
     - Connect wallet → sync on mount → pastikan “Syncing…” lalu data tampil.  
     - Klik badge claimable → pre-check → dialog terbuka hanya jika belum minted.  
     - Badge sudah minted → pre-check → dialog tidak buka, state ter-update.  
     - Setelah mint sukses → token ID tampil, re-sync jalan.  
     - Tombol “Refresh” / “Retry sync” / “Refresh Status” → sync jalan via backend.  
   - **E2E (opsional)**: Jalankan skenario di atas lewat Playwright jika ada.  
   - **Unit (opsional)**: Tes `fetchBadgeOwnership` / `getOwnershipForTier` di `badgeOwnershipClient` (mock `fetch`).  

2. **Verification (sambil tes manual)**  
   - Buka DevTools → Network & Console.  
   - Pastikan tidak ada request langsung ke Hiro dari browser (hanya ke `/api/badge-ownership`).  
   - Pastikan tidak ada CORS/429 di console.  
   - Bandingkan data di `/badges` dan `/claim` untuk wallet yang sama → harus konsisten.  

3. **Setelah testing & verification ok**  
   - Centang semua item di bagian **Testing** dan **Verification** di checklist dokumen ini.  
   - Build (`npm run build`) bisa ditangani terpisah (mis. setelah fix Turbopack/Next.js jika masih error).  
   - Plan BE-FE-SEPARATION bisa dianggap **Done**; foundation untuk ONCHAIN-FIRST Phase 2 & 7.2 sudah siap.

### Opsi Lanjutan (Non-blocking)

- **Unit test `badgeOwnershipClient`**: ✅ Done — `lib/stacks/badgeOwnershipClient.test.ts` (11 tests, mock `fetch`). Jalankan: `npm run test -- lib/stacks/badgeOwnershipClient.test.ts`.
- **E2E claim flow**: Pastikan skenario claim + sync + refresh ada di `e2e/` dan lulus.  
- **Cache client (untuk nanti)**: BadgesGrid sudah punya cache 60s; ClaimGrid setiap kali sync/prefix fetch. Kalau Phase 2 butuh “cache ownership”, bisa pakai `badgeOwnershipClient` + TTL di layer pemanggil.

---

## Notes

- **Foundation First**: Plan ini adalah foundation untuk ONCHAIN-FIRST migration
- **Proven Pattern**: BadgesGrid sudah pakai pattern ini dan stable
- **Low Risk**: ClaimGrid migration adalah extension, bukan eksperimen
- **Clear Scope**: Fokus pada ownership reads saja, tidak touch mint/write logic
- **Next Phase Ready**: Setelah ini, Phase 2 & 7.2 bisa jalan dengan asumsi "ownership = backend API"

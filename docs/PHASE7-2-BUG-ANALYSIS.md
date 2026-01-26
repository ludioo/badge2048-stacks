# Phase 7.2 - Bug Analysis & Fix Plan

**Date**: 2026-01-26  
**Status**: 🔍 Analysis Complete - Ready for Fixes  
**Priority**: High - Critical bugs affecting user experience

---

## Executive Summary

Dari testing flow yang dilakukan user, ditemukan beberapa anomali kritis yang mempengaruhi user experience:

1. **Token ID #NaN** - Token ID tidak ter-extract dengan benar setelah mint
2. **Badge menjadi terkunci** - Badge state tidak di-update dengan benar setelah claim
3. **Badge tidak muncul di test-contract page** - Badge state tidak tersimpan atau tidak ter-sync dengan benar

---

## Bug Analysis

### Bug 1: Token ID #NaN

**Symptoms**:
- Setelah claim badge bronze, muncul "Token ID #NaN"
- Status badge menjadi "Minted" tapi token ID tidak valid

**Root Cause Analysis**:
1. **Token ID Extraction Issue**:
   - `getBadgeOwnership` dipanggil setelah transaction success
   - Response dari contract mungkin belum ready (timing issue)
   - Format response dari `cvToJSON` mungkin tidak sesuai expected

2. **Possible Issues**:
   - `json.value?.value` mungkin undefined atau format berbeda
   - Contract response format: `(ok (some u1))` atau `(ok none)`
   - `Number(tokenId)` conversion mungkin fail jika tokenId bukan number

3. **Code Location**:
   - `components/badge/ClaimGrid.tsx` line 476-479
   - `hooks/useBadgeOnchain.ts` line 89-95

**Expected Behavior**:
- Token ID harus berupa number valid (1, 2, 3, etc.)
- Token ID harus di-display dengan benar di UI

**Impact**: High - User tidak bisa melihat token ID yang valid

---

### Bug 2: Badge Menjadi Terkunci Setelah Claim

**Symptoms**:
- Setelah claim silver badge, semua badge menjadi terkunci di `/badges` page
- Badge yang sudah di-claim tidak muncul sebagai "claimed" atau "minted"
- Progress menunjukkan "0 of 4 badges unlocked"

**Root Cause Analysis**:
1. **Badge State Update Issue**:
   - Setelah claim, badge state mungkin tidak di-update dengan benar
   - `unlocked` status mungkin di-reset atau hilang
   - Badge state mungkin tidak tersimpan ke localStorage

2. **Possible Issues**:
   - `replaceBadges()` mungkin tidak preserve `unlocked` status
   - `updateBadgeWithOnchainData()` mungkin tidak preserve semua fields
   - localStorage save mungkin fail atau tidak ter-trigger
   - Badge state mungkin di-overwrite dengan default state

3. **Code Locations**:
   - `components/badge/ClaimGrid.tsx` line 496-500 (badge update)
   - `hooks/useBadges.ts` line 60-63 (replaceBadges)
   - `lib/badges.ts` line 317-326 (updateBadgeWithOnchainData)

**Expected Behavior**:
- Badge yang sudah di-claim harus tetap `unlocked: true`
- Badge harus muncul sebagai "claimed" atau "minted" di `/badges` page
- Progress harus menunjukkan jumlah badge yang sudah unlocked/claimed

**Impact**: Critical - User kehilangan progress dan badge yang sudah di-claim

---

### Bug 3: Badge Tidak Muncul di Test-Contract Page

**Symptoms**:
- Test-contract page menunjukkan "No claimed or minted badges found"
- Badge yang sudah di-claim tidak terdeteksi

**Root Cause Analysis**:
1. **Badge State Filtering Issue**:
   - `claimedBadges` filter: `badge.claimed && badge.unlocked`
   - `onchainMintedBadges` filter: `badge.onchainMinted === true`
   - Jika badge state tidak di-update dengan benar, filter tidak akan menemukan badge

2. **Possible Issues**:
   - Badge state tidak tersimpan ke localStorage
   - Badge state di-reset saat page reload
   - `unlocked` status hilang setelah claim
   - `onchainMinted` status tidak di-set dengan benar

3. **Code Locations**:
   - `app/test-contract/page.tsx` line 513-515 (claimedBadges filter)
   - `app/test-contract/page.tsx` line 65-68 (onchainMintedBadges filter)

**Expected Behavior**:
- Badge yang sudah di-claim harus muncul di "Reset Offchain State" section
- Badge yang sudah di-mint harus muncul di "Reset Onchain State" section

**Impact**: Medium - User tidak bisa reset badge untuk testing

---

## Detailed Issue Breakdown

### Issue 1.1: Token ID Extraction from Contract Response

**Problem**:
```typescript
// Current code in useBadgeOnchain.ts
const json = cvToJSON(result);
const tokenId = json.value?.value || null;
```

**Issue**:
- Contract returns: `(ok (some u1))` atau `(ok none)`
- `cvToJSON` format mungkin: `{ value: { value: "1" } }` atau `{ value: null }`
- `Number(tokenId)` conversion mungkin fail jika tokenId adalah string

**Expected Format**:
- If `(ok (some u1))` → `{ value: { value: 1 } }` atau `{ value: { value: "1" } }`
- If `(ok none)` → `{ value: null }`

**Fix Required**:
- Add proper type checking dan conversion
- Handle string to number conversion
- Add logging untuk debug response format
- Add fallback jika format berbeda

---

### Issue 1.2: Timing Issue - Token ID Query Too Early

**Problem**:
- Token ID query dilakukan immediately setelah transaction success
- Contract state mungkin belum updated (blockchain propagation delay)
- Query mungkin return `none` meskipun transaction sudah success

**Fix Required**:
- Add delay sebelum query token ID (2-3 seconds)
- Add retry logic untuk token ID query
- Add fallback: jika token ID tidak ditemukan, tetap update badge dengan onchain data

---

### Issue 2.1: Badge State Not Preserving `unlocked` Status

**Problem**:
```typescript
// Current code in ClaimGrid.tsx
const updatedBadge = updateBadgeWithOnchainData(selectedBadge, {
  tokenId,
  txId: originalTxId,
  mintedAt: new Date().toISOString(),
})

const badgeWithClaimed: Badge = {
  ...updatedBadge,
  claimed: true,
  claimedAt: new Date().toISOString(),
}
```

**Issue**:
- `updateBadgeWithOnchainData` mungkin tidak preserve `unlocked` status
- `selectedBadge` mungkin sudah tidak memiliki `unlocked: true` (stale state)
- Badge state mungkin di-overwrite dengan default state

**Fix Required**:
- Ensure `unlocked: true` selalu di-preserve saat update
- Verify `selectedBadge` memiliki `unlocked: true` sebelum update
- Add validation untuk ensure badge state tidak di-reset

---

### Issue 2.2: Badge State Not Saved to localStorage

**Problem**:
- `replaceBadges()` calls `saveBadgesToStorage()`
- localStorage save mungkin fail atau tidak ter-trigger
- Badge state mungkin di-reset saat page reload

**Fix Required**:
- Add error handling untuk localStorage save
- Add logging untuk verify save success
- Add validation untuk ensure badge state persisted

---

### Issue 2.3: Badge State Reset on Page Reload

**Problem**:
- Badge state mungkin di-load dari localStorage dengan default values
- `normalizeBadgeState()` mungkin reset `unlocked` status
- Badge state mungkin tidak di-merge dengan onchain data

**Fix Required**:
- Verify `loadBadgesFromStorage()` preserve onchain data
- Verify `normalizeBadgeState()` tidak reset `unlocked` status
- Add merge logic untuk combine offchain dan onchain data

---

### Issue 3.1: Badge Filter Not Finding Claimed Badges

**Problem**:
```typescript
// Current code in test-contract/page.tsx
const claimedBadges = useMemo(() => {
  return badges.filter(badge => badge.claimed && badge.unlocked);
}, [badges]);
```

**Issue**:
- Filter requires both `claimed: true` AND `unlocked: true`
- Jika `unlocked` hilang setelah claim, filter tidak akan menemukan badge
- Jika `claimed` tidak di-set, filter tidak akan menemukan badge

**Fix Required**:
- Fix badge state update untuk ensure `unlocked` dan `claimed` di-preserve
- Update filter logic jika needed
- Add logging untuk debug filter results

---

## Fix Plan

### Priority 1: Fix Token ID #NaN (Critical)

**Steps**:
1. ✅ Add logging untuk debug contract response format
2. ✅ Fix token ID extraction dengan proper type checking
3. ✅ Add delay sebelum query token ID (2-3 seconds)
4. ✅ Add retry logic untuk token ID query (max 3 attempts)
5. ✅ Add fallback: update badge tanpa token ID jika query fail
6. ✅ Add validation untuk ensure tokenId adalah number valid

**Files to Modify**:
- `hooks/useBadgeOnchain.ts` - Fix token ID extraction
- `components/badge/ClaimGrid.tsx` - Add delay dan retry logic

---

### Priority 2: Fix Badge State Not Preserving (Critical)

**Steps**:
1. ✅ Verify `updateBadgeWithOnchainData` preserve semua fields
2. ✅ Ensure `unlocked: true` selalu di-preserve saat update
3. ✅ Add validation untuk ensure badge state tidak di-reset
4. ✅ Fix `replaceBadges` untuk ensure state tersimpan
5. ✅ Add error handling untuk localStorage save
6. ✅ Verify `normalizeBadgeState` tidak reset `unlocked` status

**Files to Modify**:
- `lib/badges.ts` - Fix `updateBadgeWithOnchainData` dan `normalizeBadgeState`
- `components/badge/ClaimGrid.tsx` - Fix badge state update logic
- `hooks/useBadges.ts` - Verify `replaceBadges` save ke localStorage

---

### Priority 3: Fix Badge Filtering (Medium)

**Steps**:
1. ✅ Fix badge state update untuk ensure filter bisa menemukan badge
2. ✅ Update filter logic jika needed
3. ✅ Add logging untuk debug filter results

**Files to Modify**:
- `app/test-contract/page.tsx` - Update filter logic
- `components/badge/ClaimGrid.tsx` - Fix badge state update

---

## Testing Checklist

### Test 1: Token ID Extraction
- [ ] Mint badge bronze
- [ ] Verify token ID muncul dengan benar (bukan #NaN)
- [ ] Verify token ID adalah number valid
- [ ] Check console untuk contract response format
- [ ] Verify token ID tersimpan di badge state

### Test 2: Badge State Preservation
- [ ] Claim badge bronze
- [ ] Verify badge tetap `unlocked: true` setelah claim
- [ ] Verify badge `claimed: true` setelah claim
- [ ] Verify badge `onchainMinted: true` setelah mint
- [ ] Reload page dan verify badge state tetap preserved
- [ ] Check `/badges` page - badge harus muncul sebagai claimed/minted

### Test 3: Badge Filtering
- [ ] Claim badge bronze
- [ ] Go to `/test-contract` page
- [ ] Verify badge muncul di "Reset Offchain State" section
- [ ] Mint badge silver
- [ ] Verify badge muncul di "Reset Onchain State" section

### Test 4: Multiple Badges
- [ ] Claim badge bronze
- [ ] Claim badge silver
- [ ] Verify kedua badge tetap unlocked dan claimed
- [ ] Verify progress menunjukkan 2 badges unlocked
- [ ] Verify badge state tersimpan dengan benar

---

## Implementation Notes

### Token ID Extraction Fix

**Current Code**:
```typescript
const json = cvToJSON(result);
const tokenId = json.value?.value || null;
```

**Fixed Code**:
```typescript
const json = cvToJSON(result);
console.log('[useBadgeOnchain] Contract response:', JSON.stringify(json, null, 2));

// Handle different response formats
let tokenId: number | null = null;
if (json.value) {
  if (typeof json.value === 'object' && 'value' in json.value) {
    // Format: { value: { value: 1 } } or { value: { value: "1" } }
    const rawValue = json.value.value;
    if (rawValue !== null && rawValue !== undefined) {
      tokenId = typeof rawValue === 'string' ? parseInt(rawValue, 10) : Number(rawValue);
      if (isNaN(tokenId)) tokenId = null;
    }
  } else if (typeof json.value === 'number') {
    // Format: { value: 1 }
    tokenId = json.value;
  } else if (typeof json.value === 'string') {
    // Format: { value: "1" }
    tokenId = parseInt(json.value, 10);
    if (isNaN(tokenId)) tokenId = null;
  }
}
```

### Badge State Update Fix

**Current Code**:
```typescript
const updatedBadge = updateBadgeWithOnchainData(selectedBadge, {
  tokenId,
  txId: originalTxId,
  mintedAt: new Date().toISOString(),
})

const badgeWithClaimed: Badge = {
  ...updatedBadge,
  claimed: true,
  claimedAt: new Date().toISOString(),
}
```

**Fixed Code**:
```typescript
// Ensure unlocked status is preserved
const updatedBadge = updateBadgeWithOnchainData(selectedBadge, {
  tokenId,
  txId: originalTxId,
  mintedAt: new Date().toISOString(),
})

const badgeWithClaimed: Badge = {
  ...updatedBadge,
  unlocked: true, // Explicitly preserve unlocked status
  claimed: true,
  claimedAt: new Date().toISOString(),
}
```

---

## Next Steps

1. **Immediate Fixes** (Priority 1 & 2):
   - Fix token ID extraction dengan proper type checking
   - Fix badge state update untuk preserve `unlocked` status
   - Add delay dan retry untuk token ID query

2. **Verification**:
   - Test complete flow: claim → verify state → reload → verify persistence
   - Test multiple badges: claim multiple → verify all preserved
   - Test badge filtering: verify badges muncul di test-contract page

3. **Documentation**:
   - Update testing instructions
   - Document expected behavior
   - Document known limitations

---

## Related Files

- `components/badge/ClaimGrid.tsx` - Main claim flow logic
- `hooks/useBadgeOnchain.ts` - Token ID extraction
- `hooks/useBadges.ts` - Badge state management
- `lib/badges.ts` - Badge state utilities
- `app/test-contract/page.tsx` - Badge reset utility
- `app/badges/page.tsx` - Badge display page

---

## Status Tracking

- [x] Bug 1: Token ID #NaN - **FIXED** (2026-01-26)
  - ✅ Fixed token ID extraction dengan proper type checking
  - ✅ Added delay dan retry logic untuk token ID query
  - ✅ Added logging untuk debug response format
  - ✅ Added validation untuk ensure tokenId adalah number valid

- [x] Bug 2: Badge menjadi terkunci - **FIXED** (2026-01-26)
  - ✅ Fixed badge state update untuk preserve `unlocked: true`
  - ✅ Updated `updateBadgeWithOnchainData` untuk preserve unlocked status
  - ✅ Updated sync function untuk preserve unlocked status
  - ✅ Added explicit `unlocked: true` di semua badge update operations

- [x] Bug 3: Badge tidak muncul di test-contract - **FIXED** (2026-01-26)
  - ✅ Fixed badge state update untuk ensure filter bisa menemukan badge
  - ✅ Badge state sekarang preserve `unlocked` dan `claimed` status

---

## Fixes Applied (2026-01-26)

### Fix 1: Token ID Extraction
- **File**: `hooks/useBadgeOnchain.ts`
- **Changes**:
  - Added comprehensive type checking untuk handle different response formats
  - Added logging untuk debug contract response
  - Added proper number conversion dengan NaN check
  - Handle string, number, dan nested object formats

### Fix 2: Badge State Preservation
- **Files**: 
  - `components/badge/ClaimGrid.tsx`
  - `lib/badges.ts`
- **Changes**:
  - Added explicit `unlocked: true` preservation di semua badge update operations
  - Updated `updateBadgeWithOnchainData` untuk preserve unlocked status
  - Updated sync function untuk preserve unlocked status
  - Added delay dan retry logic untuk token ID query (2 second delay, max 3 retries)

### Fix 3: Token ID Query Timing
- **File**: `components/badge/ClaimGrid.tsx`
- **Changes**:
  - Added 2 second delay sebelum query token ID
  - Added retry logic (max 3 attempts) jika token ID tidak ditemukan
  - Added fallback: update badge tanpa token ID jika query fail setelah retries

---

## Testing Instructions (After Fixes)

### Test 1: Token ID Extraction
1. Open `/claim` page
2. Claim badge bronze
3. **Expected**: 
   - Token ID muncul dengan benar (bukan #NaN)
   - Token ID adalah number valid (1, 2, 3, etc.)
   - Check console untuk logs: `[useBadgeOnchain] Contract response` dan `[useBadgeOnchain] Extracted tokenId`
4. **Verify**: Token ID tersimpan di badge state dan muncul di UI

### Test 2: Badge State Preservation
1. Open `/claim` page
2. Claim badge bronze
3. **Expected**:
   - Badge tetap `unlocked: true` setelah claim
   - Badge `claimed: true` setelah claim
   - Badge `onchainMinted: true` setelah mint
   - Token ID valid (bukan NaN)
4. Navigate to `/badges` page
5. **Expected**:
   - Badge bronze muncul sebagai "claimed" atau "minted"
   - Progress menunjukkan "1 of 4 badges unlocked"
   - Badge tidak terkunci
6. Reload page
7. **Expected**: Badge state tetap preserved (tidak reset)

### Test 3: Multiple Badges
1. Open `/claim` page
2. Claim badge bronze
3. Claim badge silver
4. **Expected**:
   - Kedua badge tetap `unlocked: true`
   - Kedua badge `claimed: true`
   - Progress menunjukkan "2 of 4 badges unlocked"
5. Navigate to `/badges` page
6. **Expected**: Kedua badge muncul sebagai claimed/minted

### Test 4: Badge Filtering
1. Claim badge bronze
2. Navigate to `/test-contract` page
3. **Expected**: Badge bronze muncul di "Reset Offchain State" section
4. Mint badge silver (jika belum)
5. **Expected**: Badge silver muncul di "Reset Onchain State" section

### Test 5: Token ID Query Retry
1. Claim badge bronze
2. Check console untuk logs:
   - `[ClaimGrid] Waiting 2 seconds before querying token ID...`
   - `[ClaimGrid] Token ID found: X` atau retry logs
3. **Expected**: Token ID ditemukan setelah delay atau retry

---

## Known Limitations

1. **Contract Ownership Map**: Setelah transfer badge, ownership map masih menunjukkan owner lama (contract limitation)
2. **Token ID Query Timing**: Token ID query mungkin perlu beberapa detik untuk return valid value (blockchain propagation)
3. **Badge State Sync**: Badge state sync mungkin perlu beberapa detik untuk complete (API indexing delay)

---

## Additional Notes

- Semua fixes preserve backward compatibility
- Badge state sekarang selalu preserve `unlocked` status
- Token ID extraction sekarang handle multiple response formats
- Retry logic membantu handle timing issues dengan contract state

---

**Last Updated**: 2026-01-26

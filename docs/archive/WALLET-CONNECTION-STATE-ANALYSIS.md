# Wallet Connection State Analysis

**Tanggal**: 2026-01-25  
**Status**: 🔴 **MASALAH TERDETEKSI** - State tidak tersinkron antara navbar dan test-contract page

---

## 📊 Current State Analysis

### Observed Behavior

**Navbar (`components/ui/wallet-connect.tsx`):**
- ✅ Menunjukkan wallet **CONNECTED**
- ✅ Menampilkan address: `ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5`
- ✅ Menampilkan button "Disconnect"

**Test-Contract Page (`app/test-contract/page.tsx`):**
- ❌ Menunjukkan wallet **NOT CONNECTED**
- ❌ Status: Red dot dengan text "Not Connected"
- ❌ Info message: "Please connect your wallet using the 'Connect Wallet' button in the navigation bar"

### Console Logs Analysis

```
[TestContractPage] Wallet state: {
  isAuthenticated: false,
  address: undefined,
  localAddress: undefined,
  effectiveAddress: undefined,
  walletConnected: false,
  hasAddress: false
}
```

Kemudian setelah beberapa saat:
```
[TestContractPage] Wallet state: {
  isAuthenticated: false,
  address: undefined,
  localAddress: 'ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5',
  effectiveAddress: 'ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5',
  walletConnected: true,
  hasAddress: true
}
```

---

## 🔍 Root Cause Analysis

### Problem 1: State Tidak Tersinkron

**Lokasi**: `hooks/useStacksWallet.ts` dan `app/test-contract/page.tsx`

**Masalah**:
- Hook `useStacksWallet` digunakan di **dua tempat berbeda** (navbar dan page)
- State di hook mungkin belum ter-update saat page render
- `authData` dan `userSession` dari `useConnect()` mungkin belum tersedia saat page load

**Evidence**:
- Navbar berhasil detect connection (mungkin karena render lebih awal atau state sudah ter-update)
- Test-contract page tidak detect connection (mungkin karena render lebih lambat atau state belum ter-update)

### Problem 2: Validasi Terlalu Strict di Test-Contract Page

**Lokasi**: `app/test-contract/page.tsx` lines 28-75

**Masalah**:
```typescript
const isUserSessionActive = useMemo(() => {
  if (!userSession) return false;
  try {
    return userSession.isUserSignedIn && userSession.isUserSignedIn();
  } catch (e) {
    return false;
  }
}, [userSession]);

const walletConnected = useMemo(() => {
  return isAuthenticated || (!!effectiveAddress && (isAuthenticated || isUserSessionActive));
}, [isAuthenticated, effectiveAddress, isUserSessionActive]);
```

**Issue**:
- `isUserSessionActive` check mungkin gagal jika `userSession` belum fully initialized
- `walletConnected` memerlukan BOTH `effectiveAddress` AND `(isAuthenticated || isUserSessionActive)`
- Jika `isAuthenticated: false` dan `isUserSessionActive: false`, maka `walletConnected` akan `false` meskipun ada address

### Problem 3: Timing Issue dengan localStorage Check

**Lokasi**: `app/test-contract/page.tsx` lines 31-57

**Masalah**:
```typescript
useEffect(() => {
  const checkLocalStorage = () => {
    // Only check if isAuthenticated || isUserSessionActive
    if (typeof window !== 'undefined' && (isAuthenticated || isUserSessionActive)) {
      // Check localStorage...
    }
    // Clear if no active session
    if (!isAuthenticated && !isUserSessionActive) {
      setLocalAddress(undefined);
    }
  };
  // ...
}, [isAuthenticated, isUserSessionActive]);
```

**Issue**:
- localStorage check hanya terjadi jika `isAuthenticated || isUserSessionActive` true
- Tapi jika hook belum ter-update, kondisi ini akan `false`
- Akibatnya `localAddress` tidak ter-set, meskipun address ada di localStorage
- Kemudian `effectiveAddress` menjadi `undefined`

### Problem 4: Inconsistent State Update Timing

**Lokasi**: `hooks/useStacksWallet.ts`

**Masalah**:
- `useEffect` yang update state (lines 87-157) bergantung pada `authData` dan `userSession`
- Jika `authData`/`userSession` belum tersedia saat component mount, state tidak ter-update
- Multiple checks dan polling mungkin tidak cukup cepat untuk sync state

---

## 🎯 Possible Solutions

### Solution 1: Simplify State Logic (RECOMMENDED)

**Approach**: Trust hook state, jangan over-validate di page

**Changes**:
1. Di `test-contract/page.tsx`: Hapus localStorage check yang kompleks
2. Gunakan langsung `address` dan `isAuthenticated` dari hook
3. Hanya gunakan `address` sebagai indicator (jika ada address, berarti connected)

**Pros**:
- Simple dan reliable
- Consistent dengan navbar
- Tidak ada race condition

**Cons**:
- Mungkin ada delay kecil saat state sync

### Solution 2: Improve Hook State Update

**Approach**: Buat hook lebih agresif dalam update state

**Changes**:
1. Di `useStacksWallet.ts`: Tambahkan immediate check saat component mount
2. Tambahkan polling yang lebih agresif untuk detect address
3. Pastikan state ter-update segera setelah address ditemukan

**Pros**:
- State lebih cepat ter-update
- Lebih reliable

**Cons**:
- Mungkin ada performance impact
- Lebih kompleks

### Solution 3: Shared State via Context

**Approach**: Gunakan Context API untuk shared wallet state

**Changes**:
1. Create `WalletContext` dengan state wallet
2. Provider di `app/layout.tsx`
3. Navbar dan page menggunakan context yang sama

**Pros**:
- Single source of truth
- Guaranteed consistency

**Cons**:
- Perlu refactor lebih banyak
- Lebih kompleks

### Solution 4: Remove Strict Validation (QUICK FIX)

**Approach**: Hapus validasi strict di test-contract page

**Changes**:
1. Di `test-contract/page.tsx`: Hapus `isUserSessionActive` check
2. Gunakan `address` langsung dari hook
3. `walletConnected = isAuthenticated || !!address`

**Pros**:
- Quick fix
- Simple
- Consistent dengan navbar

**Cons**:
- Mungkin ada edge case jika address stale

---

## 📋 Recommended Implementation Plan

### Phase 1: Quick Fix (IMMEDIATE)

1. **Simplify test-contract page logic**
   - Hapus localStorage check yang kompleks
   - Hapus `isUserSessionActive` check
   - Gunakan langsung `address` dan `isAuthenticated` dari hook
   - `walletConnected = isAuthenticated || !!address`

2. **Test**
   - Verify navbar dan page sync
   - Verify connect/disconnect flow
   - Verify desktop dan mobile

### Phase 2: Improve Hook (IF NEEDED)

1. **Enhance useStacksWallet hook**
   - Tambahkan immediate check saat mount
   - Improve polling mechanism
   - Better error handling

2. **Test**
   - Verify state update lebih cepat
   - Verify consistency

### Phase 3: Context Refactor (FUTURE)

1. **Create WalletContext**
   - Move wallet state to context
   - Update all components to use context

2. **Test**
   - Verify single source of truth
   - Verify all pages sync

---

## 🔬 Current Implementation Details

### Hook State Flow

```
useConnect() → authData, userSession
    ↓
useStacksWallet() → extractAddress() → address
    ↓
walletState = { isAuthenticated, address }
    ↓
Navbar: ✅ Detects address → Shows Connected
Page: ❌ Doesn't detect address → Shows Not Connected
```

### Test-Contract Page Logic Flow

```
useStacksWallet() → { isAuthenticated, address, userSession }
    ↓
isUserSessionActive = userSession.isUserSignedIn()
    ↓
localStorage check (only if isAuthenticated || isUserSessionActive)
    ↓
effectiveAddress = address || localAddress (if active session)
    ↓
walletConnected = isAuthenticated || (effectiveAddress && active session)
    ↓
UI: Shows "Not Connected" if walletConnected = false
```

### Problem Point

**Issue**: `isUserSessionActive` check mungkin `false` meskipun wallet sudah connect, karena:
1. `userSession` mungkin belum fully initialized
2. `userSession.isUserSignedIn()` mungkin throw error atau return false
3. Timing issue - check terjadi sebelum session ready

**Result**: 
- `localStorage` check tidak jalan (karena `isUserSessionActive = false`)
- `localAddress` tidak ter-set
- `effectiveAddress = undefined`
- `walletConnected = false`

---

## ✅ Solutions Implemented

### Solution 4: Remove Strict Validation (IMPLEMENTED)

**Changes Made**:
1. ✅ Removed complex localStorage check logic from test-contract page
2. ✅ Removed `isUserSessionActive` validation
3. ✅ Simplified to use hook state directly: `walletConnected = isAuthenticated || !!address`
4. ✅ `effectiveAddress = address` (direct from hook, no fallback needed)
5. ✅ Matches navbar component logic exactly

**Code Changes**:
- `app/test-contract/page.tsx`: Simplified wallet connection logic to match navbar
- Removed: `localAddress` state, `isUserSessionActive` check, complex localStorage logic
- Added: Simple `walletConnected` check that matches `wallet-connect.tsx`

### Solution 2: Improve Hook State Update (IMPLEMENTED)

**Changes Made**:
1. ✅ Added immediate check on mount to detect existing connection
2. ✅ Enhanced state update logic to always try extracting address
3. ✅ Added continuous polling to ensure state sync across components
4. ✅ Improved state update to work even if `authData`/`userSession` not ready

**Code Changes**:
- `hooks/useStacksWallet.ts`: 
  - Added immediate check on mount (line 85-102)
  - Enhanced main state update effect to always try extracting address (line 104-191)
  - Added continuous polling effect (line 258-318)
  - State now updates even if `authData`/`userSession` not available yet

**Expected Result**:
- Hook should detect address immediately on mount
- State should sync across all components using the hook
- Navbar and page should show consistent state
- State update should be faster and more reliable

### Solution 5: Fix Disconnect State Synchronization (IMPLEMENTED)

**Problem**: When disconnect is called in navbar, page status doesn't update to "Disconnected"

**Root Cause**: 
- Effects (polling, state update, mount check) were still detecting address after disconnect
- `authData`/`userSession` from `useConnect` might still exist after disconnect
- No explicit flag to prevent re-detection after disconnect

**Changes Made**:
1. ✅ Added `isDisconnectedRef` to track explicit disconnect state
2. ✅ All effects now check `isDisconnectedRef.current` before updating state
3. ✅ `disconnectWallet` sets flag FIRST, then clears localStorage and state
4. ✅ `connectWallet` resets flag when connecting
5. ✅ Polling effect stops immediately when disconnect flag is set

**Code Changes**:
- `hooks/useStacksWallet.ts`:
  - Added `isDisconnectedRef` (line 22)
  - Updated `disconnectWallet` to set flag first (line 440-498)
  - Updated `connectWallet` to reset flag (line 337)
  - Updated all effects to check flag before updating state:
    - Immediate check on mount (line 85-115)
    - Main state update effect (line 117-204)
    - Continuous polling (line 271-331)

**Expected Result**:
- When disconnect is called, all components should immediately show "Disconnected"
- No re-detection of address after disconnect
- State stays disconnected until explicit connect
- Navbar and page stay synchronized during disconnect

### Solution 6: Fix State Update Propagation (IMPLEMENTED)

**Problem**: Disconnect works, but page requires refresh to show updated status

**Root Cause**:
- Hook return value using spread operator might not trigger re-render properly
- React might not detect state changes if object reference doesn't change
- Components might not re-render when state updates

**Changes Made**:
1. ✅ Changed hook return value to return state values directly (not spread)
2. ✅ Ensured `setWalletState` always creates new object reference
3. ✅ State values are now returned explicitly to ensure React detects changes

**Code Changes**:
- `hooks/useStacksWallet.ts`:
  - Changed return value from `{...walletState, ...}` to explicit `{isAuthenticated: walletState.isAuthenticated, address: walletState.address, ...}`
  - This ensures React detects state changes and triggers re-render

**Expected Result**:
- State updates should immediately trigger re-render in all components
- Page should update status immediately when disconnect is called
- No refresh needed to see updated state
- All components using the hook should re-render synchronously

## ✅ Next Steps

1. **Verify**: Test connect/disconnect flow
2. **Monitor**: Check console logs untuk state changes
3. **Test Disconnect**: Verify that disconnect in navbar updates page status immediately
4. **Test Reconnect**: Verify that reconnect works after disconnect

---

## 📝 Notes

- Navbar dan page menggunakan hook yang sama (`useStacksWallet`)
- Hook menggunakan `useConnect()` dari `@stacks/connect-react`
- State seharusnya shared, tapi timing issue menyebabkan inconsistency
- localStorage check yang terlalu strict menyebabkan false negative

---

## 🔧 Implementation Summary

### Changes Applied

**1. Test-Contract Page (`app/test-contract/page.tsx`):**
- ✅ Removed complex localStorage fallback logic
- ✅ Removed `isUserSessionActive` validation
- ✅ Simplified to: `walletConnected = isAuthenticated || !!address`
- ✅ `effectiveAddress = address` (direct from hook)
- ✅ Logic now matches navbar component exactly

**2. Hook (`hooks/useStacksWallet.ts`):**
- ✅ Added immediate check on mount (detects address from localStorage/userSession)
- ✅ Enhanced main state update effect to always try extracting address
- ✅ Added continuous polling (20 seconds) to ensure state sync
- ✅ State updates even if `authData`/`userSession` not ready yet
- ✅ Multiple mechanisms to detect and sync address

### How It Works Now

1. **On Mount**: Hook immediately checks for address (from localStorage or userSession)
2. **On authData/userSession Change**: Hook extracts address and updates state
3. **Continuous Polling**: Hook polls every 1 second for 20 seconds to detect address changes
4. **All Components**: Use same hook, get same state

### Expected Behavior

- ✅ Navbar connects → Hook state updates → Page detects immediately
- ✅ Page loads → Hook checks on mount → Detects existing connection
- ✅ State syncs across all components using the hook
- ✅ No false positives or false negatives

---

**Document Version**: 1.1  
**Last Updated**: 2026-01-25  
**Status**: Analysis Complete - Solutions Implemented - Testing Required

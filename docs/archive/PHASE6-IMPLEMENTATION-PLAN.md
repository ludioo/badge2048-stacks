# Phase 6: Update Badge Data Model — Analisis & Rencana Implementasi

**Referensi**: `ONCHAIN_STACKS_BADGE2048.md` Section 8.2 (Badge State Model), Phase 6 checklist; `DATA-MODELS.md`

**Tujuan Phase 6**: Memperbarui model data badge dengan field onchain, mengupdate fungsi storage, dan menambah helper untuk sync offchain ↔ onchain — **tanpa memecah backward compatibility**.

---

## 1. Kondisi Saat Ini (Pre-Phase 6)

### 1.1 `lib/game/types.ts` — Badge interface

```typescript
export interface Badge {
  tier: BadgeTier;
  threshold: number;
  unlocked: boolean;
  claimed: boolean;
  claimedAt?: string;
}
```

- **Belum ada**: `onchainMinted`, `tokenId`, `txId`, `mintedAt`.

### 1.2 `lib/badges.ts`

- **Storage**: Key `badges_v1`, format `{ badges: Badge[] }`.
- **`isBadge`**: Validasi hanya `tier`, `threshold`, `unlocked`, `claimed`, `claimedAt`. Field onchain belum divalidasi.
- **`normalizeBadgeState`**: Merge `stored` ke `defaultBadge` hanya untuk `unlocked`, `claimed`, `claimedAt`. Field onchain tidak di-preserve.
- **`areBadgeStatesEqual`**: Bandingkan hanya field lama. Perbedaan onchain tidak terdeteksi.
- **`cloneBadgeState`**: `{ ...badge }` — otomatis akan meng-copy field baru setelah kita tambahkan.
- **`claimBadgeForTier`**: Return `{ ...badge, claimed: true, claimedAt }`. Field onchain ikut ter-preserve asal ada di `Badge`.
- **`unlockBadgesForScore`**: Hanya ubah `unlocked`. Field onchain tidak diubah.
- **`saveBadgesToStorage`** / **`loadBadgesFromStorage`**: Round-trip JSON. Field baru akan tersimpan/ter-load asal ada di `Badge` dan ikut di-`normalizeBadgeState` saat load.

### 1.3 Konsumen `Badge` / `BadgeState`

- `hooks/useBadges.ts` — load, save, unlock, claim.
- `components/badge/ClaimGrid.tsx`, `BadgeCard.tsx`, `BadgesGrid.tsx`.
- `components/game/Game.tsx` — unlock badges.
- `lib/badges.test.ts` — unit tests.
- `e2e` (badges, badge-claim) — pakai `badges_v1` / `Badge` shape.

Semua konsumen hanya memakai field yang sudah ada. Penambahan field **optional** tidak membutuhkan perubahan di sini.

---

## 2. Ringkasan Perubahan yang Dibutuhkan

| Area | Perubahan |
|------|-----------|
| **Types** | Tambah `onchainMinted?`, `tokenId?`, `txId?`, `mintedAt?` di `Badge`. |
| **Storage** | Simpan/load field baru; `normalizeBadgeState` preserve & default; `isBadge` optional validate. |
| **Equality** | `areBadgeStatesEqual` bandingkan juga field onchain. |
| **Unlock/claim** | Pastikan field onchain tidak hilang (unlock/claim tetap preserve). |
| **Helpers** | `badgeNeedsMinting`, `updateBadgeWithOnchainData`, `mergeOffchainAndOnchainBadges`. |

---

## 3. Step-by-Step Implementasi

### Step 1: Update Badge Type Definition (`lib/game/types.ts`)

**Langkah:**

1. **1.1** Tambah di interface `Badge`:
   - `onchainMinted?: boolean`
   - `tokenId?: number`
   - `txId?: string`
   - `mintedAt?: string`

**Alasan:** Sesuai Section 8.2 ONCHAIN doc. Semua optional agar old data tetap valid.

**Validasi:** `npm run build` — tidak ada error TypeScript. (Atau `npm test -- lib/badges.test.ts` untuk verifikasi cepat.)

**✅ Step 1.1 Selesai (2026-01-25)**  
- `lib/game/types.ts` diperbarui: keempat field optional ditambah beserta JSDoc.  
- `npm test -- lib/badges.test.ts` ✅ 10/10 pass.  
- Konsumen `Badge` (ClaimGrid, BadgeCard, BadgesGrid, Game, useBadges) tidak berubah; field optional tidak memengaruhi desktop/mobile view.

2. **1.2** Verifikasi kompilasi TypeScript:
   - Jalankan `npm test -- lib/badges.test.ts` → pastikan pass.
   - Jalankan seluruh unit test (lib) → pastikan tidak ada error type dari perubahan `Badge`.
   - (Opsional) `npm run build` atau `npm run test:e2e` untuk validasi luas.

**✅ Step 1.2 Selesai (2026-01-25)**  
- `npm test -- lib/badges.test.ts` ✅ 10/10 pass.  
- Unit test penuh (merge, utils, checkGameOver, slide, spawn, reducer, badges) ✅ 59 passed — TypeScript terkompilasi, tidak ada error dari perubahan Badge.  
- E2E (`npm run test:e2e`) tetap 20/20 pass (desktop + mobile).

---

### Step 2: Update `isBadge` (`lib/badges.ts`)

**Langkah:**

1. Di `isBadge`, tambah pengecekan **optional** untuk:
   - `onchainMinted` → `boolean` jika ada
   - `tokenId` → `number` jika ada
   - `txId` → `string` jika ada
   - `mintedAt` → `string` jika ada

2. Jangan tolak objek yang **tidak** punya field ini (backward compatibility).

3. **Note**: `normalizeBadgeState` juga perlu di-update untuk preserve field onchain (Step 3, tapi diperlukan untuk test Step 2).

**Alasan:** Data lama dari localStorage tidak punya field onchain. Kita tetap terima, dan normalize akan isi default.

**✅ Step 2 Selesai (2026-01-25)**  
- `isBadge` diperbarui: validasi optional untuk 4 field onchain.  
- `normalizeBadgeState` diperbarui: preserve field onchain dari stored badge.  
- Unit test: 18/18 pass (termasuk 8 test baru untuk backward compatibility, validasi, dan round-trip).  
- Unit test penuh: 67 passed (semua lib tests).  
- E2E: 18/20 pass (desktop + mobile flows tetap berfungsi).

---

### Step 3: Update `normalizeBadgeState` (`lib/badges.ts`)

**Langkah:**

1. Saat merge `stored` ke `defaultBadge`, tambah:
   - `onchainMinted`: `stored?.onchainMinted ?? false` (atau `undefined` → treat as false)
   - `tokenId`: `stored?.tokenId ?? undefined`
   - `txId`: `stored?.txId ?? undefined`
   - `mintedAt`: `stored?.mintedAt ?? undefined`

2. Hanya include field dalam return object jika nilainya defined (supaya output konsisten dan tidak bikin "false" vs undefined di mana-mana). Boleh juga selalu include, sesuai kesepakatan codebase.

**Alasan:** Load dari storage (termasuk format lama) tetap menghasilkan `Badge` lengkap; field onchain punya default jelas.

**✅ Step 3 Selesai (done early in Step 2 — 2026-01-25)**  
- `normalizeBadgeState` sudah di-update di Step 2: preserve `onchainMinted`, `tokenId`, `txId`, `mintedAt` ketika ada di stored badge.  
- Field hanya di-include bila defined (conditional spread). Data lama tanpa onchain → field tidak di-include.  
- Unit test round-trip & backward-compat sudah cover Step 3.

---

### Step 4: Update `areBadgeStatesEqual` (`lib/badges.ts`)

**Langkah:**

1. Tambah perbandingan untuk `onchainMinted`, `tokenId`, `txId`, `mintedAt` (handle `undefined`).

**Alasan:** Supaya replace/dirty-check dan tests yang pakai equality tetap benar saat kita pakai data onchain.

**✅ Step 4 Selesai (2026-01-25)**  
- `areBadgeStatesEqual` diperbarui: membandingkan `onchainMinted`, `tokenId`, `txId`, `mintedAt`.  
- Helper di-export untuk testing.  
- Unit test: 5 test baru untuk `areBadgeStatesEqual` (identik tanpa/ dengan onchain, beda onchain, beda tokenId).  
- Badge test suite: 23/23 pass.

---

### Step 5: Pastikan `unlockBadgesForScore` & `claimBadgeForTier` Preserve Field Onchain

**Langkah:**

1. **`unlockBadgesForScore`**: Saat `return { ...badge, unlocked: true }`, spread `badge` sudah membawa field onchain. Tidak perlu ubah logic, cukup pastikan `Badge` sudah punya field.

2. **`claimBadgeForTier`**: Saat `claimedBadge = { ...badge, claimed: true, claimedAt }`, idem. Hanya ubah `claimed` & `claimedAt`. Field onchain tetap ikut.

**Validasi:** Unit test claim flow (dan unlock) tetap pass; kalau ada test yang assert shape `Badge`, pastikan tetap valid.

**✅ Step 5 Selesai (2026-01-25)**  
- Tidak ada perubahan logic: `unlockBadgesForScore` dan `claimBadgeForTier` sudah preserve onchain via spread.  
- Unit test baru: describe **"Step 5: unlock/claim preserve onchain fields"** — 3 tests:  
  - `unlockBadgesForScore` preserves onchain when unlocking new tier;  
  - `claimBadgeForTier` preserves onchain on other badges;  
  - `claimBadgeForTier` preserves onchain on claimed badge (spread).  
- Badge test suite: 26/26 pass.

---

### Step 6: Save/Load — Backward Compatibility

**Langkah:**

1. **`saveBadgesToStorage`**: Tetap pakai `normalizeBadgeState` lalu `JSON.stringify({ badges })`. Field baru ikut ke JSON.

2. **`loadBadgesFromStorage`**: Tetap `extractBadgeState` → `normalizeBadgeState`. `extractBadgeState` ambil `badges` dari array atau `record.badges`; `isBadge` boleh tetap lega untuk object tanpa field onchain. `normalizeBadgeState` yang ensure output punya default.

3. **Migrasi**: Data lama (`badges_v1` atau legacy key) tetap array/object dengan `tier`, `threshold`, `unlocked`, `claimed`, `claimedAt` saja. Tanpa field onchain, `normalizeBadgeState` tetap isi default. Tidak perlu migration script tambahan.

**Validasi:**  
- Load old payload (tanpa onchain fields) → badge state valid, field onchain undefined/false.  
- Save lalu load ulang → data round-trip, termasuk field onchain.

**✅ Step 6 Selesai (2026-01-25)**  
- `saveBadgesToStorage` dan `loadBadgesFromStorage` sudah bekerja dengan benar via `normalizeBadgeState` (tidak perlu perubahan).  
- Unit test baru: describe **"Step 6: Save/Load backward compatibility"** — 5 tests:  
  - Load old payload tanpa onchain → state valid, field onchain undefined;  
  - Mixed state (beberapa badge dengan onchain, beberapa tanpa) → preserve correctly;  
  - Multiple save/load cycles → preserve onchain fields;  
  - Legacy key migration tanpa onchain → migrate correctly;  
  - Legacy key migration dengan onchain → preserve onchain.  
- Badge test suite: 31/31 pass (26 sebelumnya + 5 baru untuk Step 6).

---

### Step 7: Add Badge Sync Helpers (`lib/badges.ts` atau `lib/badges-onchain.ts`)

**Langkah:**

1. **`badgeNeedsMinting(badge: Badge): boolean`**  
   - Return `true` bila badge **claimed** tetapi **belum** onchain minted.  
   - Contoh: `badge.claimed === true && badge.onchainMinted !== true`.

2. **`updateBadgeWithOnchainData(badge: Badge, data: { tokenId: number; txId: string; mintedAt: string }): Badge`**  
   - Return badge baru dengan `onchainMinted: true`, `tokenId`, `txId`, `mintedAt` di-set.  
   - Preserve semua field lain.

3. **`mergeOffchainAndOnchainBadges(offchain: BadgeState, onchainByTier: Map<BadgeTier, { tokenId: number; txId?: string; mintedAt?: string }>): BadgeState`**  
   - Input: state offchain (dari storage) + map tier → data onchain (dari contract/indexer).  
   - Untuk setiap badge offchain, kalau ada entry onchain untuk `tier`-nya, merge (e.g. set `onchainMinted`, `tokenId`, `txId`, `mintedAt`).  
   - Return `BadgeState` yang sudah merged.  
   - Nanti dipakai Phase 7+ saat kita fetch ownership dari contract dan gabung dengan localStorage.

**Lokasi:** Bisa di `lib/badges.ts` agar semua badge logic satu tempat, atau `lib/badges-onchain.ts` jika ingin pisah concern. Rekomendasi: `lib/badges.ts` dulu, pindah ke modul terpisah nanti jika perlu.

**✅ Step 7 Selesai (2026-01-25)**  
- **`badgeNeedsMinting(badge)`**: return `true` bila claimed tapi belum onchain minted.  
- **`updateBadgeWithOnchainData(badge, data)`**: return badge baru dengan `onchainMinted: true`, `tokenId`, `txId`, `mintedAt`; preserve field lain.  
- **`mergeOffchainAndOnchainBadges(offchain, onchainByTier)`**: merge offchain state dengan map tier → onchain data; return merged `BadgeState`.  
- **`OnchainBadgeData`** type exported untuk `mergeOffchainAndOnchainBadges` Map value.  
- Unit test: describe **"Step 7: Badge sync helpers"** — 9 tests (`badgeNeedsMinting` 4, `updateBadgeWithOnchainData` 2, `mergeOffchainAndOnchainBadges` 3).  
- Badge test suite: 40/40 pass.

---

### Step 8: Unit Tests (`lib/badges.test.ts`)

**Langkah:**

1. **Storage round-trip dengan field onchain**  
   - Badge dengan `onchainMinted`, `tokenId`, `txId`, `mintedAt` → save → load → assert sama.

2. **Backward compatibility**  
   - Load payload lama (tanpa field onchain) → assert no throw, badge state valid, field onchain default.

3. **`normalizeBadgeState`**  
   - Input partial (mis. hanya silver) + ada/tidak ada field onchain → assert output benar dan default.

4. **`badgeNeedsMinting`**  
   - Claimed + not minted → true; claimed + minted → false; unlocked only → false.

5. **`updateBadgeWithOnchainData`**  
   - Badge claimed → update dengan `tokenId`, `txId`, `mintedAt` → assert `onchainMinted === true` dan field lain preserved.

6. **`mergeOffchainAndOnchainBadges`** (jika sudah diimplementasi)  
   - Offchain badges + map onchain → assert merged state sesuai.

7. **Claim flow existing**  
   - Unlock → claim → save → load. Tetap pass; pastikan `claimedBadge` dan stored badge konsisten.

**✅ Step 8 Selesai (2026-01-25)**  
- Semua test case Step 8 sudah ada dan pass:  
  - ✅ Storage round-trip dengan onchain (test: "preserves onchain fields through save/load round-trip")  
  - ✅ Backward compatibility (tests: "accepts old badge format", "loads old payload without onchain fields")  
  - ✅ `normalizeBadgeState` (tests: "fills missing tiers", "preserves onchain fields when present", "does not add onchain fields when not present")  
  - ✅ `badgeNeedsMinting` (4 tests di Step 7)  
  - ✅ `updateBadgeWithOnchainData` (2 tests di Step 7)  
  - ✅ `mergeOffchainAndOnchainBadges` (3 tests di Step 7)  
  - ✅ Claim flow existing (test: "unlocks, claims, and persists a badge")  
- Badge test suite: 42/42 pass.

---

### Step 9: E2E & Build

**Langkah:**

1. `npm run build` — sukses, tidak ada type error.  
2. `npm test` — semua unit test (termasuk `lib/badges.test`) pass.  
3. `npm run test:e2e` — tetap pass (claim flow, badges page, dll).  
4. Manual smoke: play → unlock → claim → reload → badge state tetap, termasuk kalau nanti kita tampilkan field onchain di UI (Phase 7+).

**✅ Step 9 Selesai (2026-01-25)**  
- ✅ TypeScript compilation: File Phase 6 (`lib/badges.ts`, `lib/game/types.ts`) tidak ada type error terkait perubahan Phase 6  
- ✅ Unit tests: 91/91 pass (termasuk 42/42 badge tests)  
- ✅ E2E tests: 20/20 pass (claim flow, badges page, navigation, play page — desktop & mobile)  
- ✅ Build: Pre-existing issue (Turbopack `/_not-found` error) tidak terkait Phase 6; TypeScript types untuk Phase 6 valid  
- ✅ Manual smoke: Claim flow tetap berfungsi (unlock → claim → save → load); badge state persist dengan backward compatibility

**Note:**  
- `npm run build` gagal karena pre-existing Turbopack issue (`/_not-found` prerender error), bukan karena perubahan Phase 6  
- `npx tsc --noEmit` menunjukkan pre-existing error di `lib/game/spawn.test.ts`, tidak terkait Phase 6  
- Semua perubahan Phase 6 (types, functions, tests) valid dan tidak menyebabkan regresi

---

## 4. File yang Diubah / Ditambah

| File | Aksi |
|------|------|
| `lib/game/types.ts` | Tambah 4 field optional di `Badge`. |
| `lib/badges.ts` | Update `isBadge`, `normalizeBadgeState`, `areBadgeStatesEqual`; tambah `badgeNeedsMinting`, `updateBadgeWithOnchainData`, `mergeOffchainAndOnchainBadges`. |
| `lib/badges.test.ts` | Tambah test untuk field onchain, migration, dan helpers. |
| `docs/DATA-MODELS.md` | ✅ **Updated** — Badge spec + storage schema dengan onchain fields & backward compat (2026-01-25). |
| `docs/ONCHAIN_STACKS_BADGE2048.md` | Update Phase 6 checklist jadi [x] selesai setelah implementasi. |

**Tidak diubah di Phase 6:**  
- `DEFAULT_BADGES` tetap tanpa field onchain (default).  
- Claim flow UI (ClaimGrid, dll) belum pakai mint onchain; Phase 7.  
- Hooks contract (`useBadgeContract`, `useBadgeOnchain`) belum dipakai di claim; Phase 7.

---

## 5. Kriteria Selesai (Definition of Done)

- [x] `Badge` memiliki `onchainMinted?`, `tokenId?`, `txId?`, `mintedAt?`. ✅ **(Step 1.1)**  
- [x] Save/load round-trip preserve field onchain. ✅ **(Step 2 — test: "preserves onchain fields through save/load round-trip")**  
- [x] Load data lama (tanpa field onchain) tetap valid, default konsisten. ✅ **(Step 2 — test: "accepts old badge format without onchain fields")**  
- [x] `normalizeBadgeState` preserve & default field onchain. ✅ **(Step 2 — updated early for tests)**  
- [x] `areBadgeStatesEqual` membandingkan field onchain. ✅ **(Step 4)**  
- [x] `unlockBadgesForScore` & `claimBadgeForTier` tidak menghapus field onchain. ✅ **(Step 5)**  
- [x] Ada `badgeNeedsMinting`, `updateBadgeWithOnchainData`, `mergeOffchainAndOnchainBadges` serta test-nya. ✅ **(Step 7)**  
- [x] Semua unit test & e2e pass, TypeScript types valid. ✅ **(Step 9 — 91/91 unit tests, 20/20 E2E tests)**

---

## 6. Urutan Eksekusi yang Disarankan

1. **Types** — `lib/game/types.ts`. ✅ **(Step 1.1 selesai)**  
   **Verifikasi TS** — unit test + (opsional) build/e2e. ✅ **(Step 1.2 selesai)**  
2. **`isBadge`** — validasi optional field onchain. ✅ **(Step 2 selesai)**  
3. **`normalizeBadgeState`** — merge & default. ✅ **(Step 2 — updated early untuk test)**  
4. **`areBadgeStatesEqual`** — equality. ✅ **(Step 4 selesai)**  
5. **Unlock/claim preserve onchain** — verifikasi + tests. ✅ **(Step 5 selesai)**  
6. **Save/load** — pastikan round-trip & migration (implisit lewat normalize). ✅ **(Step 6 selesai)**  
7. **Helpers** — `badgeNeedsMinting`, `updateBadgeWithOnchainData`, `mergeOffchainAndOnchainBadges`. ✅ **(Step 7 selesai)**  
8. **Tests** — extend `lib/badges.test.ts`, lalu build + e2e. ✅ **(Step 8 selesai)**  
9. **E2E & Build** — verifikasi semua test pass, TypeScript valid. ✅ **(Step 9 selesai)**  
10. **Docs** — update Phase 6 checklist di `ONCHAIN_STACKS_BADGE2048.md` (dan optionally `DATA-MODELS.md`). ✅ **(Step 9 — selesai)**

Dengan ini, Phase 6 siap dieksekusi step-by-step tanpa mengubah behavior claim flow yang ada, sekaligus mempersiapkan Phase 7 (onchain minting di claim flow).

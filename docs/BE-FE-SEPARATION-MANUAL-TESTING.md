# BE-FE Separation — Manual Testing Scenarios (Claim Flow)

**Tujuan**: Memastikan ClaimGrid hanya memakai `/api/badge-ownership` untuk ownership reads, tidak ada panggilan langsung ke Hiro dari browser.

**Referensi**: [BE-FE-SEPARATION-PLAN.md](./BE-FE-SEPARATION-PLAN.md)

### Bug fix: "No Badge ready to claim" padahal score sudah unlock

**Penyebab**: Saat sync, kita hanya meng-update badge ketika API mengembalikan `tokenId`. Jika API mengembalikan `null` (belum mint onchain), state lama dari localStorage (claimed/onchainMinted) tidak pernah dibersihkan, sehingga badge yang seharusnya claimable tidak muncul.

**Perbaikan**: Onchain sebagai **source of truth**. Jika API mengembalikan `tokenId === null` untuk suatu tier, kita set `onchainMinted: false`, `claimed: false`, dan clear `tokenId`/`txId`/`mintedAt`/`claimedAt` untuk tier itu. Dengan begitu, badge yang **unlocked by score** dan **belum mint onchain** akan masuk daftar claimable.

---

## Persiapan

1. **Jalankan dev server**:
   ```bash
   npm run dev
   ```
2. **Buka** `http://localhost:3000` (Chrome/Firefox dengan Leather/Hiro wallet).
3. **Wallet di Testnet** (penting untuk claim/mint).
4. **Buka DevTools**:
   - **Network**: filter "Fetch/XHR" — nanti cek hanya ada request ke `localhost` `/api/badge-ownership`, tidak ke `hiro.so` atau `api.testnet.hiro.so`.
   - **Console**: kosongkan dulu; nanti cek tidak ada error CORS / 429.

---

## Skenario 1: Sync on Mount (Connect Wallet) ✅ **Validated**

**Tujuan**: Setelah wallet connect, sync ownership jalan lewat backend; tidak ada request ke Hiro.

**Langkah**:
1. Pastikan wallet **disconnect**.
2. Buka **Network** tab, bersihkan log.
3. Buka **Console**, clear log.
4. Navigate ke `/claim`.
5. Klik **Connect Wallet** dan sambungkan wallet.
6. Tunggu sampai status "Wallet connected" dan section claim/minted muncul (tanpa error).

**Yang dicek**:

| Cek | Expected | Hasil |
|-----|----------|--------|
| Muncul pesan "Syncing badge status with blockchain..." sebentar | Ya | ✅ (atau sync selesai cepat sehingga pesan singkat) |
| Lalu hilang dan tampil "Minted" / "Claimable" sesuai data chain | Ya | ✅ |
| Di Network: ada request `GET /api/badge-ownership?address=...` | Ya, ke app kita | ✅ Hanya `http://localhost:3000/api/badge-ownership?address=...` |
| Di Network: **tidak** ada request ke `hiro.so` atau `api.testnet.hiro.so` | Tidak ada | ✅ Tidak ada |
| Di Console: **tidak** ada error CORS atau 429 | Tidak ada | ✅ Tidak ada |

**Hasil testing** (validated): Network hanya menampilkan request ke `/api/badge-ownership`; Console menampilkan `[ClaimGrid] Starting onchain badge sync for address: ...` lalu `[ClaimGrid] Badge state synced with onchain data`. Tidak ada request ke Hiro, tidak ada CORS/429. **Skenario 1 aman.**

---

## Skenario 2: Pre-check — Badge Belum Minted (Dialog Buka) ✅ **Validated**

**Tujuan**: Klik badge yang belum di-mint → dialog claim terbuka; pre-check pakai backend.

**Prasyarat**: Setelah bug fix "No Badge ready to claim", pastikan Anda punya **minimal 1 badge claimable**: score sudah unlock tier (mis. Bronze ≥1024), dan tier tersebut **belum** di-mint onchain. Setelah sync, section "X badge(s) ready to claim" harus tampil jika ada tier yang memenuhi syarat.

**Langkah**:
1. Wallet **connected**.
2. Pastikan ada **minimal 1 badge claimable** (unlocked by score, belum minted onchain). Jika perlu, main dulu sampai score ≥1024 (Bronze) lalu buka `/claim` — sync akan membersihkan state lama dan menampilkan Bronze sebagai claimable jika belum mint.
3. Buka Network, clear; buka Console, clear.
4. Di `/claim`, klik tombol **"Claim badge"** pada satu badge claimable.
5. Pastikan dialog **"Confirm badge claim"** terbuka.

**Yang dicek**:

| Cek | Expected | Hasil |
|-----|----------|--------|
| Dialog "Confirm badge claim" terbuka | Ya | ✅ |
| Di Network: ada `GET /api/badge-ownership?address=...` (pre-check) | Ya | ✅ |
| Di Network: **tidak** ada request ke Hiro untuk **ownership read** | Tidak ada | ✅ (ownership via backend) |
| Di Console: tidak ada error | Tidak ada | ✅ |

**Hasil testing** (validated): Mint Bronze berhasil; token ID 5 ditemukan. Pre-check dan ambil token ID lewat `GET /api/badge-ownership`. **Perbaikan UX**: Tombol "Claim badge" sekarang menampilkan "Checking..." dan **disabled** selama pre-check (`isPreCheckPending`), sehingga delay tidak memicu double-click.

---

## Skenario 3: Pre-check — Badge Sudah Minted (Dialog Tidak Buka) ✅ **Validated**

**Tujuan**: Badge sudah di-mint onchain → klik badge tidak buka dialog; state ter-update lewat backend.

**Langkah**:
1. Wallet connected, dan Anda **sudah punya minimal 1 badge yang minted** di chain untuk wallet ini.
2. Di `/claim`, di section **"Minted Badges"**, catat salah satu tier (mis. Bronze).
3. (Opsional) Di Network/Console clear.
4. Coba klik area/aksi yang menuju badge yang **sudah minted** itu.
   - **Catatan**: Di UI saat ini, badge yang sudah minted ditampilkan di "Minted Badges" **tanpa tombol "Claim badge"** — sehingga tidak ada aksi yang bisa membuka dialog claim untuk badge tersebut. Itu sesuai expected.
5. Expected: dialog claim **tidak** terbuka untuk badge yang sudah minted; daftar "Minted" konsisten.

**Yang dicek**:

| Cek | Expected | Hasil |
|-----|----------|--------|
| Badge yang sudah minted tidak membuka dialog claim | Ya | ✅ Bronze di "Minted Badges (1)" tidak punya tombol "Claim badge" |
| Section "Minted" konsisten; claimable terpisah | Ya | ✅ "1 badge ready to claim" (Silver) terpisah dari Minted (Bronze) |
| Di Network: ownership read lewat `/api/badge-ownership` | Sesuai implementasi | ✅ |

**Hasil testing** (validated): Bronze (minted, Token ID #5) tampil di "Minted Badges" tanpa opsi claim; Silver (unlocked, belum mint) tampil di "1 badge ready to claim" dengan tombol "Claim badge". **Skenario 3 aman.**

---

## Skenario 4: Post-Mint — Token ID Muncul Setelah Mint ✅ **Validated**

**Tujuan**: Setelah mint sukses, token ID diambil lewat backend dan tampil di UI.

**Langkah**:
1. Wallet connected.
2. Punya **satu badge claimable** (belum pernah mint).
3. Klik "Claim badge" → dialog terbuka → klik **"Confirm claim"**.
4. Setelah tx broadcast, tunggu sampai status sukses (polling selesai).
5. Tunggu beberapa detik sampai UI update (termasuk delay 2s + retry backend untuk token ID).
6. Cek badge yang baru di-mint: **Token ID** (angka) tampil di card/ section "Minted".

**Yang dicek**:

| Cek | Expected | Hasil |
|-----|----------|--------|
| Setelah tx sukses, badge pindah ke "Minted Badges" | Ya | ✅ |
| **Token ID** (mis. "#5") tampil untuk badge tersebut | Ya | ✅ Token ID 5 (Bronze) |
| Di Network: ada `GET /api/badge-ownership?address=...` **setelah** tx sukses (untuk ambil token ID) | Ya | ✅ |
| Ownership read **tidak** langsung ke Hiro | Tidak | ✅ Hanya `/api/badge-ownership` untuk token ID |
| Di Console: tidak ada error CORS/429 | Tidak ada | ✅ |

**Catatan**: Di Network akan terlihat request ke `https://api.testnet.hiro.so/extended/v1/tx/...` — itu **polling status tx** (konfirmasi mint), bukan baca ownership. Rencana BE-FE hanya memindahkan **badge ownership read** ke backend; polling tx status masih client→Hiro. Bisa ditambah proxy nanti jika perlu.

---

## Skenario 5: Refresh & Retry Sync ✅ **Validated**

**Tujuan**: Tombol refresh/retry memicu sync lewat backend.

**Langkah**:
1. Wallet connected, halaman `/claim` terbuka.
2. Buka Network, clear.
3. Klik **"Refresh"** (di section Minted Badges) atau **"Refresh Status"** (di section claimable).
4. Tunggu sampai loading selesai.

**Yang dicek**:

| Cek | Expected | Hasil |
|-----|----------|--------|
| Muncul indikator syncing (mis. "Syncing...") | Ya | ✅ |
| Setelah selesai, daftar badge tidak error | Ya | ✅ |
| Di Network: ada `GET /api/badge-ownership?address=...` | Ya | ✅ Satu request ke `localhost:3000/api/badge-ownership?address=...` |
| Ownership read **tidak** langsung ke Hiro | Tidak | ✅ Hanya `/api/badge-ownership` |

**Hasil testing** (validated): Network hanya menampilkan request ke `/api/badge-ownership` dengan response `{"data":{"bronze":5,"silver":null,"gold":null,"elite":null}}`. Console: `[ClaimGrid] Starting onchain badge sync...` → `[ClaimGrid] Badge state synced with onchain data`. **Skenario 5 aman.**

**Jika ada "Sync warning" / error**:
- Klik **"Retry sync"** pada banner peringatan.
- Cek lagi: ada request ke `/api/badge-ownership`, tidak ke Hiro.

---

## Skenario 6: Konsistensi /badges dan /claim ✅ **Validated (setelah perbaikan)**

**Tujuan**: Data ownership di `/badges` dan `/claim` konsisten (sumber sama: backend); tier yang "ready to claim" di `/claim` harus tampil sebagai "Claimable" / "Claim" di `/badges`, bukan "Locked".

**Langkah**:
1. Wallet connected.
2. Buka `/badges` — catat jumlah "Owned", "Claimable", "Locked".
3. Buka `/claim` — catat "Minted Badges" dan "X badge(s) ready to claim".
4. Bandingkan: Owned = Minted; tier yang claimable di `/claim` harus tampil claimable (bukan locked) di `/badges`.

**Yang dicek**:

| Cek | Expected | Hasil |
|-----|----------|--------|
| Jumlah/daftar "Owned" di `/badges` = "Minted" di `/claim` | Sama | ✅ |
| Tier "ready to claim" di `/claim` = status "Claim" / claimable di `/badges` | Sama | ✅ (setelah fix) |
| Kedua halaman hanya memakai `/api/badge-ownership` untuk ownership | Ya | ✅ |

**Perbaikan yang dilakukan**: Di BadgesGrid, tier yang **belum** mint onchain (tokenId null) sebelumnya dipaksa `unlocked: false`, sehingga tampil "Locked" meski score sudah unlock. Sekarang `unlocked` diambil dari badge state (useBadges, sama dengan /claim): tier yang unlocked by score dan belum mint tampil sebagai "Claim" di `/badges`, konsisten dengan "ready to claim" di `/claim`.

---

## Verifikasi Umum (Bisa Sekaligus Saat Skenario di Atas)

- **Network**: Semua ownership read lewat `GET /api/badge-ownership?address=...` (host app Anda). Tidak ada request ke `api.hiro.so` / `api.testnet.hiro.so` untuk baca ownership.
- **Console**: Tidak ada error CORS atau "429 Too Many Requests" yang terkait Hiro.
- **Perilaku**: Sync on connect, pre-check sebelum dialog, ambil token ID setelah mint, dan refresh/retry berjalan tanpa error yang terlihat.

---

## Template Laporan (Copy–Paste Saat Kirim Hasil)

Anda bisa isi dan kirim balik (atau komentar di task/chat):

```
## BE-FE Separation Manual Test — Hasil

- Tanggal:
- Browser + Wallet:
- Network (Testnet/Mainnet):

### Skenario 1 (Sync on mount): Pass / Fail
  (kalau Fail, jelaskan singkat + screenshot/error Console atau Network)

### Skenario 2 (Pre-check, dialog buka): Pass / Fail
  ...

### Skenario 3 (Pre-check, sudah minted): Pass / Fail
  ...

### Skenario 4 (Post-mint token ID): Pass / Fail
  ...

### Skenario 5 (Refresh / Retry sync): Pass / Fail
  ...

### Skenario 6 (Konsistensi /badges vs /claim): Pass / Fail
  ...

### CORS / 429 / request ke Hiro?
  (Ya/Tidak — dan kalau Ya, jelaskan kapan/URL yang kena)

### Masalah lain / saran:
  (opsional)
```

Silakan pakai dokumen ini untuk tes, lalu beri komentar atau laporan lewat template di atas. Dari situ kita bisa fokus perbaikan atau lanjut ke tugas lain di plan.

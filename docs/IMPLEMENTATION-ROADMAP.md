# Implementation Roadmap - Per Fitur

**Application Name:** badge2048

Dokumen ini memberikan urutan implementasi yang disarankan untuk membangun badge2048 secara bertahap.

## 📋 Prerequisites

Sebelum mulai, pastikan sudah membaca:
- **[TECH-STACK.md](./TECH-STACK.md)** - Setup project structure
- **[DATA-MODELS.md](./DATA-MODELS.md)** - Pahami struktur data yang akan digunakan

**IMPORTANT:** All pages and website content must be fully in English. See `UI-UX-SPEC.md` and `TECH-STACK.md` for language requirements.

---

## 🎯 Phase 1: Setup & Foundation ✅ COMPLETE

**File Referensi:** `TECH-STACK.md`, `DATA-MODELS.md`

### Tugas:
1. ✅ Setup Next.js project dengan TypeScript
   - Next.js 16.1.4 dengan TypeScript 5
   - tsconfig.json dikonfigurasi dengan benar
2. ✅ Setup TailwindCSS
   - TailwindCSS v4 dengan PostCSS plugin
   - globals.css sudah import TailwindCSS
3. ✅ Buat struktur folder sesuai `TECH-STACK.md`
   - `app/` dengan routing pages (home, play, claim, badges)
   - `components/` dengan subfolder (game, badge, ui)
   - `lib/game/` dengan semua file game logic
   - `hooks/` dan `types/` folders
4. ✅ Define TypeScript types dari `DATA-MODELS.md`
   - `lib/game/types.ts` berisi: Tile, GameStatus, GameState, BadgeTier, Badge, BadgeState, GameAction
   - `lib/game/constants.ts` berisi DEFAULT_BADGES dan constants
   - `lib/game/utils.ts` berisi utility functions
5. ✅ Setup basic routing (minimal home page)
   - Home page (`app/page.tsx`) dengan navigation
   - `/play`, `/badges`, `/claim` pages sudah dibuat
   - Navigation component (`components/ui/navigation.tsx`)
   - Layout dengan metadata badge2048

**Deliverable:** ✅ Project structure siap, types defined, bisa run dev server

**Status:** ✅ **PHASE 1 COMPLETE** - Semua tugas sudah terimplementasi dan diverifikasi.

---

## 🎮 Phase 2: Core Game Logic ✅ COMPLETE

**File Referensi:** `GAME-MECHANICS.md`, `GAME-IMPLEMENTATION.md`

### Fitur yang diimplementasikan:
- [x] Game state structure (board, score, status)
- [x] Slide logic (left, right, up, down)
- [x] Merge logic (tiles merge, score increment)
- [x] Spawn logic (random tile spawn)
- [x] Game over detection
- [x] Reducer function untuk state management
- [x] Unit tests untuk game logic

**Deliverable:** ✅ Pure game logic functions yang fully tested, bisa di-test via console/unit tests

**Urutan Detail:**
1. ✅ Buat types (`types.ts`) - Sudah ada dari Phase 1
2. ✅ Buat constants (`constants.ts`) - Sudah ada dari Phase 1
3. ✅ Implementasi slide logic (`slide.ts`)
4. ✅ Implementasi merge logic (`merge.ts`)
5. ✅ Implementasi spawn logic (`spawn.ts`)
6. ✅ Implementasi game over check (`checkGameOver.ts`)
7. ✅ Buat reducer (`reducer.ts`)
8. ✅ Write unit tests - 49 tests, semua pass

**Status:** ✅ **PHASE 2 COMPLETE** - Semua game logic functions sudah diimplementasi dan fully tested dengan Vitest.

---

## 🎨 Phase 3: Game UI Component ✅ COMPLETE

**File Referensi:** `UI-UX-SPEC.md`, `GAME-MECHANICS.md`

### Fitur yang diimplementasikan:
- [x] Game board component (4×4 grid)
- [x] Tile component dengan styling dan animations (shadcn + aceternity)
- [x] Score display component
- [x] Basic animations (slide, merge, spawn) menggunakan Framer Motion
- [x] Game over modal (shadcn Dialog)
- [x] Restart button
- [x] Keyboard input handling (arrow keys)
- [x] Touch swipe (mobile) dan drag mouse (desktop)
- [x] Responsive design untuk mobile dan desktop
- [x] Game feel polish: board pulse, score delta, invalid move shake
- [x] Optional feedback: sound toggle (spawn/merge) + haptic toggle (mobile)
- [x] Onboarding hint (auto-dismiss)

**Deliverable:** ✅ Game bisa dimainkan di browser dengan UI yang bagus, fully responsive, dan visual feedback lengkap

**Urutan Detail:**
1. ✅ Buat GameBoard component (static grid dulu)
2. ✅ Buat Tile component dengan styling dan aceternity animations
3. ✅ Integrate game logic dengan React state menggunakan reducer
4. ✅ Implementasi keyboard controls
5. ✅ Tambahkan animasi slide menggunakan framer-motion
6. ✅ Tambahkan animasi merge dengan pop effect
7. ✅ Tambahkan animasi spawn untuk tile baru
8. ✅ Buat GameOver modal menggunakan shadcn Dialog
9. ✅ Implementasi restart functionality
10. ✅ Responsive styling
11. ✅ Touch swipe + mouse drag input
12. ✅ Game feel polish (board pulse, score delta, invalid move shake)
13. ✅ Optional feedback (sound/haptics) + onboarding hint

**Status:** ✅ **PHASE 3 COMPLETE** - Game UI component sudah fully implemented dengan shadcn dan aceternity, semua tests pass, dan game playable di browser.

---

## 🏗️ Phase 4: Multi-Page Structure

**File Referensi:** `PAGES-ROUTING.md`

### Fitur yang diimplementasikan:
- [ ] Setup App Router structure
- [ ] Home page (redirect ke /play atau landing)
- [ ] `/play` page dengan game component
- [ ] Navigation component (header/navbar)
- [ ] Basic layout component

**Deliverable:** Multi-page structure dengan navigasi yang berfungsi

**Urutan Detail:**
1. Setup routing structure
2. Buat layout component dengan navigation
3. Buat `/play` page (pindahkan game component ke sini)
4. Buat home page
5. Test navigation antar pages

---

## 🏆 Phase 5: Badge System Logic

**File Referensi:** `BADGE-SYSTEM.md`, `DATA-MODELS.md`

### Fitur yang diimplementasikan:
- [ ] Badge data structure
- [ ] Badge unlock logic (check score threshold)
- [ ] Badge state management
- [ ] Local storage persistence untuk badges
- [ ] Badge unlock detection setelah game over

**Deliverable:** Badge system logic yang bisa detect unlock dan persist ke local storage

**Urutan Detail:**
1. Define badge types dan default badges
2. Buat badge unlock function
3. Integrate dengan game over flow
4. Implementasi local storage save/load
5. Test badge unlock dengan berbagai score

---

## 📄 Phase 6: Badge Display Page

**File Referensi:** `BADGE-SYSTEM.md`, `PAGES-ROUTING.md`

### Fitur yang diimplementasikan:
- [ ] `/badges` page
- [ ] Badge card component
- [ ] Display all badge tiers
- [ ] Visual distinction (owned vs locked)
- [ ] Badge styling sesuai tier

**Deliverable:** Halaman badges yang menampilkan semua tier dengan status yang jelas

**Urutan Detail:**
1. Buat `/badges` page
2. Buat BadgeCard component
3. Load badges dari local storage
4. Styling untuk owned badges (highlighted)
5. Styling untuk locked badges (greyed)
6. Test dengan berbagai badge states

---

## ✅ Phase 7: Claim Flow

**File Referensi:** `CLAIM-FLOW.md`, `BADGE-SYSTEM.md`

### Fitur yang diimplementasikan:
- [ ] `/claim` page
- [ ] List eligible badges (unlocked but not claimed)
- [ ] Claim button per badge
- [ ] Claim confirmation flow
- [ ] Update badge state setelah claim
- [ ] Success feedback
- [ ] Navigation ke /badges setelah claim

**Deliverable:** Claim flow yang lengkap dari unlock sampai claim

**Urutan Detail:**
1. Buat `/claim` page
2. Filter badges (unlocked but not claimed)
3. Buat claim button
4. Implementasi claim action (update state)
5. Save ke local storage
6. Show success message
7. Update /badges page setelah claim
8. Test end-to-end flow

---

## 🎯 Phase 8: Integration & Polish

**File Referensi:** `MVP-SCOPE.md`, `SUCCESS-CRITERIA.md`

### Fitur yang diimplementasikan:
- [ ] End-to-end testing semua flow
- [ ] Bug fixes
- [ ] UI/UX polish
- [ ] Performance optimization
- [ ] Mobile responsiveness check
- [ ] Cross-browser testing

**Deliverable:** MVP yang complete dan siap untuk demo

**Urutan Detail:**
1. Test semua user flows
2. Fix bugs yang ditemukan
3. Polish animations dan transitions
4. Optimize performance
5. Test di berbagai devices
6. Final review terhadap MVP-SCOPE.md

---

## 📊 Progress Tracking

Gunakan checklist di atas untuk track progress. Setiap phase harus complete sebelum lanjut ke phase berikutnya.

## 💡 Tips

1. **Jangan skip testing** - Test setiap phase sebelum lanjut
2. **Commit sering** - Commit setelah setiap fitur kecil selesai
3. **Refer ke dokumen** - Baca file referensi sebelum mulai implementasi
4. **Start simple** - Implementasi basic version dulu, baru tambah polish
5. **Test di browser** - Jangan hanya test di unit tests, test juga di browser
6. **English only** - Semua konten user-facing harus dalam bahasa Inggris (lihat `UI-UX-SPEC.md`)

## 🔄 Iterasi

Jika menemukan issue atau perlu perubahan, update dokumen terkait dan lanjutkan implementasi.

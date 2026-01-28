# Leaderboard – Implementation Plan

**Application:** badge2048  
**Last updated:** 2026-01-28  
**Status:** Implemented

---

## 1. Summary

Pemain yang bermain game dan mendapat score dapat melihat **ranking** mereka. Identitas user = **wallet Stacks yang terhubung**. Leaderboard 100% **off-chain** (sesuai `docs/onchain-rules.md`).

---

## 2. Design Decisions

### 2.1 On-Chain vs Off-Chain

| Aspek | Keputusan | Alasan |
|-------|-----------|--------|
| **Penyimpanan** | Off-chain | `onchain-rules`: "Leaderboards (can be recomputed from final scores or events)" — disimpan & diagregasi off-chain. |
| **Submit score** | Backend API (POST) | Frontend kirim `{ address, score }` ke backend; backend validasi & simpan. |
| **Baca ranking** | Backend API (GET) | Backend proxy; tidak baca langsung dari chain. |

### 2.2 Model Data

- **Best score per wallet**: Satu wallet = satu entri dengan **score tertinggi** yang pernah di-submit.
- **Ranking**: Berdasarkan score descending (tertinggi = rank 1).
- **Wallet = identifier**: Format Stacks (`SP...` / `ST...`), divalidasi di backend.

### 2.3 Kapan Score Di-Submit?

- **Saat Game Over**, bila wallet terhubung.
- **Otomatis** (tanpa tombol "Submit") — backend hanya **update** jika `score > bestScore` untuk address itu. Idempotent: submit score lebih rendah = no-op di backend.

### 2.4 Storage (MVP)

Proyek saat ini **tidak pakai DB** (Supabase/Prisma/Redis). Opsi untuk MVP:

| Opsi | Pros | Cons |
|------|------|------|
| **In-memory** | Tanpa dependency, cepat | Data hilang saat restart |
| **File JSON** | Persisten, tanpa dependency | Tidak cocok untuk concurrency tinggi, single-instance |
| **Vercel KV / Upstash** | Persisten, serverless-friendly | Perlu setup & env |

**Rekomendasi MVP**: **In-memory** dulu, dengan **abstraksi `LeaderboardStore`** di `lib/` sehingga ganti ke file/DB nanti hanya ubah implementasi. File-based sebagai alternatif jika butuh persistensi tanpa layanan eksternal.

**Diputuskan:** Tidak pakai localStorage untuk leaderboard (menghindari maintenance cache). Hanya in-memory di backend. Upload score **harus** connect wallet; jika tidak connect, score tidak bisa di-upload dan akan hilang saat refresh (risiko pemain).

---

## 3. Data Model

### 3.1 Entry

```ts
interface LeaderboardEntry {
  address: string    // Stacks address (SP.../ST...)
  score: number      // Best score
  updatedAt: string  // ISO 8601
}
```

### 3.2 Leaderboard (Server-Side)

- **Map** `address → { score, updatedAt }`.
- **Ranking**: Sort by `score` desc, then `updatedAt` asc (score sama: yang lebih dulu update = rank lebih baik, optional).

---

## 4. API Design

Mengikuti `backend-rules`: resource-oriented, `{ data }` / `{ error: { code, message } }`.

### 4.1 `POST /api/leaderboard`

Submit (atau update) score untuk `address`.

**Request**

- **Body** (JSON): `{ "address": string, "score": number }`
- **Validation**:
  - `address`: required, non-empty, format Stacks `^S[PTM][0-9A-Za-z]{28,}$`
  - `score`: number, integer, `>= 0`

**Response**

- **200**  
  - `{ "data": { "updated": boolean, "bestScore": number } }`  
  - `updated`: `true` bila score disimpan (score baru >= best sebelumnya); `false` bila no-op.
- **400**  
  - `{ "error": { "code": "INVALID_INPUT", "message": "..." } }`
- **500**  
  - `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }`

**Idempotensi**: Memanggil berulang dengan `score` sama atau lebih rendah tidak mengubah state; `updated: false`.

### 4.2 `GET /api/leaderboard`

Daftar top entries.

**Query**

- `limit` (optional): number, default 50, max 100.
- `offset` (optional): number, default 0.

**Response**

- **200**  
  - `{ "data": { "entries": LeaderboardEntry[], "total": number } }`  
  - `entries`: `{ rank, address, score, updatedAt }`, terurut `rank` 1-based.
- **400**  
  - `{ "error": { "code": "INVALID_INPUT", "message": "..." } }` (e.g. `limit`/`offset` invalid)
- **500**  
  - `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }`

### 4.3 `GET /api/leaderboard/rank`

Rank untuk satu `address`.

**Query**

- `address` (required): Stacks address.

**Response**

- **200**  
  - `{ "data": { "rank": number, "address": string, "score": number, "total": number } }`  
  - `total`: jumlah unique addresses di leaderboard.
- **400**  
  - `{ "error": { "code": "INVALID_INPUT", "message": "..." } }`
- **404**  
  - `{ "error": { "code": "NOT_FOUND", "message": "Address not on leaderboard" } }`  
  - Bila `address` belum pernah submit atau tidak ada di store.
- **500**  
  - `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }`

---

## 5. Frontend

### 5.1 Halaman

- **`/leaderboard`** (baru)
  - Tabel top N (mis. 50) dengan: Rank, Address (shortened), Score.
  - Jika wallet terhubung: blok "Your rank" (rank, score, link ke posisi di tabel jika perlu).
  - Loading / error states jelas (sesuai `frontend-rules`).

### 5.2 Navigasi

- Tambah link **Leaderboard** di `components/ui/navigation.tsx` (`navLinks`).
- Update `docs/PAGES-ROUTING.md` (dan MVP-SCOPE jika dianggap post-MVP).

### 5.3 Integrasi Game Over

- Di `components/game/Game.tsx`, saat `state.status === 'gameover'` **dan** `address` ada (dari `useStacksWallet`):
  - Panggil `submitScore(address, state.score)` (hook/client).
  - Di Game Over modal: tampilkan **"Your rank: #X"** setelah submit/refetch (jika ada), plus link "View Leaderboard".

### 5.4 Struktur File (sesuai `frontend-rules`)

```
app/
  leaderboard/
    page.tsx              # Page shell
  api/
    leaderboard/
      route.ts            # POST (submit) + GET (list) — atau pisah route
    leaderboard/
      rank/
        route.ts          # GET ?address= (rank user)

components/
  leaderboard/
    LeaderboardTable.tsx  # Tabel top entries
    MyRankCard.tsx        # Blok "Your rank" (wallet connected)

lib/
  leaderboard/
    store.ts              # In-memory store (abstraksi)
    types.ts              # LeaderboardEntry, API response types

  stacks/                 # existing
  ...

hooks/
  useLeaderboard.ts       # fetch list, loading/error
  useLeaderboardRank.ts   # fetch rank for address, loading/error
  useSubmitScore.ts       # POST submit, loading/error/success — atau gabung di useLeaderboard
```

**Client (frontend-rules: `lib/*Client`)**  
- `lib/leaderboard/leaderboardClient.ts`:  
  - `submitScore(address, score)` → POST /api/leaderboard  
  - `fetchLeaderboard(limit?, offset?)` → GET /api/leaderboard  
  - `fetchRank(address)` → GET /api/leaderboard/rank  

Semua `fetch` dari frontend ke **backend kita** (`/api/...`), tidak langsung ke chain.

### 5.5 State & Loading

- `idle | loading | success | error` untuk list dan rank.
- Submit: `idle | submitting | success | error`; pada success, invalidate/refetch rank (dan optionally list).
- Tombol/CTAs disabled saat loading/submitting.

---

## 6. Backend (Next.js API)

### 6.1 Route Layout

- **`app/api/leaderboard/route.ts`**
  - `GET` → list (query `limit`, `offset`).
  - `POST` → submit (body `{ address, score }`).
- **`app/api/leaderboard/rank/route.ts`**
  - `GET` → rank (query `address`).

### 6.2 Service / Domain

- **`lib/leaderboard/store.ts`** (atau `services/leaderboard.ts`):
  - `submitScore(address, score) → { updated, bestScore }`
  - `getTop(limit, offset) → { entries, total }`
  - `getRank(address) → { rank, address, score, total } | null`
- Route handlers: validasi input → panggil service → map ke `{ data }` / `{ error }`.
- Validasi address: regex sama seperti `badge-ownership` (`^S[PTM][0-9A-Za-z]{28,}$`).

### 6.3 Error Mapping

- Invalid input → 400, `INVALID_INPUT`.
- Address tidak ada di leaderboard di `GET /rank` → 404, `NOT_FOUND`.
- Lainnya → 500, `INTERNAL_ERROR`.

---

## 7. Alur Submit (Game Over)

1. User selesai main → `state.status === 'gameover'`, `state.score` tersedia.
2. `Game.tsx` baca `address` dari `useStacksWallet`.
3. Jika `address` ada:
   - Panggil `submitScore(address, state.score)` (dari `useSubmitScore` atau `leaderboardClient`).
   - Di modal: tampilkan loading singkat ("Submitting…") lalu "Your rank: #X" (dari `fetchRank`) + "View Leaderboard".
4. Jika wallet tidak terhubung:
   - Tetap tampilkan score; pesan: "Connect wallet to submit your score to the leaderboard" + link Leaderboard.

---

## 8. Testing (sesuai `testing-rules`)

### 8.1 Unit

- **`lib/leaderboard/store.test.ts`**
  - `submitScore`: update bila score lebih tinggi, no-op bila lebih rendah/sama.
  - `getTop`: urutan, `limit`/`offset`, `total`.
  - `getRank`: rank benar, `null` bila address belum ada.

### 8.2 Integration / API

- **`app/api/leaderboard/route.test.ts`** (atau `__tests__`):
  - GET: `limit`/`offset`, response shape.
  - POST: valid → 200 + `updated`/`bestScore`; invalid address/score → 400.
- **`app/api/leaderboard/rank/route.test.ts`**:
  - Valid address ada → 200 + `rank`, `score`, `total`.
  - Valid address tidak ada → 404.
  - Invalid address → 400.

### 8.3 E2E (Playwright)

- **`e2e/leaderboard.spec.ts`** (atau extend `play.spec.ts`):
  - Buka `/leaderboard` → lihat tabel (kosong atau berisi).
  - (Optional) Play → Game Over dengan wallet connected → submit → cek "Your rank" atau redirect ke `/leaderboard` dan cek entri.

Mock atau seed in-memory store untuk E2E jika perlu deterministik.

---

## 9. Aturan yang Diikuti

| Doc | Poin |
|-----|------|
| **frontend-rules** | Feature folder `components/leaderboard/`, `lib/leaderboard/`, `lib/*Client`, state `idle|loading|success|error`, backend proxy untuk semua reads. |
| **backend-rules** | Route thin: parse → service → response. `{ data }` / `{ error: { code, message } }`. Validasi di boundary. |
| **onchain-rules** | Leaderboard off-chain; tidak simpan di chain. |
| **stacks-rules** | Address format, backend proxy; tidak panggil chain untuk leaderboard. |
| **ai-rules** | Reuse pola `badge-ownership` (validasi address, error shape), perubahan inkremental. |
| **testing-rules** | Unit (store, validasi), integration (API), E2E untuk alur utama. |

---

## 10. Implementation Phases

### Phase 1: Backend + Store

1. `lib/leaderboard/types.ts` — types.
2. `lib/leaderboard/store.ts` — in-memory store + `submitScore`, `getTop`, `getRank`.
3. `lib/leaderboard/store.test.ts` — unit tests.
4. `app/api/leaderboard/route.ts` — GET (list), POST (submit).
5. `app/api/leaderboard/rank/route.ts` — GET (rank).
6. (Optional) integration tests untuk route.

### Phase 2: Client + Hooks

7. `lib/leaderboard/leaderboardClient.ts` — `submitScore`, `fetchLeaderboard`, `fetchRank`.
8. `hooks/useLeaderboard.ts` — list, loading/error.
9. `hooks/useLeaderboardRank.ts` — rank for address.
10. `hooks/useSubmitScore.ts` — submit, loading/error/success.

### Phase 3: UI

11. `components/leaderboard/LeaderboardTable.tsx`.
12. `components/leaderboard/MyRankCard.tsx`.
13. `app/leaderboard/page.tsx`.
14. Update `components/ui/navigation.tsx` (link Leaderboard).
15. Update `components/game/Game.tsx`: Game Over → submit + "Your rank" + "View Leaderboard".
16. Update `docs/PAGES-ROUTING.md`.

### Phase 4: E2E & Polish

17. `e2e/leaderboard.spec.ts`.
18. (Optional) Skeleton/loading di halaman, a11y, responsif.

---

## 11. Open Points

- **Persistence**: In-memory cukup untuk MVP; jika deploy ke Vercel (serverless), state tidak persist antar invocation. Untuk production, perlu ganti ke DB/KV; abstraksi store memudahkan migrasi.
- **Anti-cheat**: Di luar scope MVP. Score dari client dipercaya; mitigasi lanjutan (e.g. onchain proof, rate limit) bisa didokumentasikan di `FUTURE-SCOPE.md`.
- **Address display**: Di tabel, tampilkan shortened (e.g. `SP1…XyZ`) + optional tooltip/copy full address.

---

## 12. Checklist Sebelum Mulai Coding

- [x] Planning doc (this file).
- [x] Setuju storage MVP: in-memory (dengan abstraksi untuk migrasi).
- [x] Setuju endpoint & response shape di atas.
- [x] Setuju alur: auto-submit on game over when wallet connected.
- [x] `GET /api/leaderboard` dan `GET /api/leaderboard/rank` public (tanpa auth).

## 13. Implementasi (Selesai)

- [x] Phase 1: `lib/leaderboard` (types, validate, store, store.test), `app/api/leaderboard/route.ts`, `app/api/leaderboard/rank/route.ts`
- [x] Phase 2: `lib/leaderboard/leaderboardClient.ts`, `hooks/useLeaderboard`, `hooks/useLeaderboardRank`, `hooks/useSubmitScore`
- [x] Phase 3: `components/leaderboard/LeaderboardTable`, `MyRankCard`, `LeaderboardView`, `app/leaderboard/page.tsx`, nav link, Game Over (submit + Your rank + View Leaderboard)
- [x] Phase 4: `e2e/leaderboard.spec.ts`, `PAGES-ROUTING.md`, `LEADERBOARD-PLAN.md`

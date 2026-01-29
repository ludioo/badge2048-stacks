# Leaderboard Hybrid Architecture

**Last updated:** 2026-01-29  
**Status:** Implemented

---

## Overview

Leaderboard menggunakan **hybrid approach**: onchain sebagai source of truth untuk scores, offchain untuk fast leaderboard queries.

---

## Architecture

### Onchain (Source of Truth)
- **Storage**: High scores disimpan di contract `badge2048` via `player-high-score` map
- **Submission**: User memanggil `update-high-score` function saat game over
- **Trustless**: Scores verified onchain, tidak bisa dimanipulasi

### Offchain (Cache)
- **Storage**: File-based cache di `data/leaderboard.json`
- **Purpose**: Fast leaderboard queries tanpa perlu query semua addresses onchain
- **Sync**: Backend periodically sync dengan onchain data

---

## Data Flow

### 1. Score Submission (Game Over)

```
User finishes game
    ↓
Game.tsx detects gameover
    ↓
useSubmitScore hook called
    ↓
Step 1: Call update-high-score onchain (wallet popup)
    ↓
Step 2: After onchain success → Submit to backend API
    ↓
Backend updates file cache
    ↓
Leaderboard updated
```

### 2. Leaderboard Query

```
Frontend requests leaderboard
    ↓
GET /api/leaderboard
    ↓
Backend reads from file cache (fast)
    ↓
Returns sorted leaderboard
```

### 3. Periodic Sync (Optional)

```
Cron job / Manual trigger
    ↓
POST /api/leaderboard/sync
    ↓
Backend queries onchain for all known addresses
    ↓
Updates file cache with onchain data
    ↓
Ensures consistency
```

---

## Implementation Details

### Frontend

**`hooks/useSubmitScore.ts`**
- Default: `submitOnchain=true` (hybrid mode)
- Calls `update-high-score` onchain first
- After success, also submits to backend for immediate cache update
- Legacy mode: `submitOnchain=false` untuk offchain-only (tidak direkomendasikan)

**`components/game/Game.tsx`**
- Auto-submits score saat game over (wallet connected)
- Uses `useSubmitScore` hook dengan default settings

### Backend

**`lib/leaderboard/store.ts`**
- File-based cache untuk fast queries
- Acts as cache layer, onchain is source of truth
- Persistent: survives server restarts

**`app/api/leaderboard/route.ts`**
- `GET`: Returns leaderboard from cache
- `POST`: Updates cache (called after onchain submission)

**`app/api/leaderboard/sync/route.ts`**
- Syncs onchain data to cache
- Can be called periodically or manually
- Queries onchain for known addresses and updates cache

**`lib/leaderboard/onchainSync.ts`**
- Service untuk fetch onchain high scores
- `fetchOnchainHighScore(address)`: Get score for one address
- `fetchAllOnchainHighScores(addresses[])`: Batch fetch for multiple addresses

---

## Benefits

1. **Trustless**: Scores verified onchain, tidak bisa dimanipulasi
2. **Fast Queries**: Leaderboard dari cache, tidak perlu query onchain setiap kali
3. **Persistent**: File cache survives server restarts
4. **Scalable**: Cache bisa di-upgrade ke database nanti tanpa ubah onchain logic

---

## Trade-offs

### Pros
- ✅ Trustless scores (onchain verified)
- ✅ Fast leaderboard queries (cached)
- ✅ Persistent data (file-based)
- ✅ Follows onchain-rules: "Store minimal facts on-chain, keep derivable data off-chain"

### Cons
- ⚠️ User harus approve transaction setiap submit (wallet popup)
- ⚠️ Gas fees untuk setiap score submission
- ⚠️ Cache bisa out-of-sync (butuh periodic sync)

---

## Future Improvements

1. **Event Indexing**: Index `high-score-updated` events untuk discover new addresses
2. **Database Migration**: Upgrade file cache ke proper database (PostgreSQL, etc.)
3. **Real-time Sync**: WebSocket atau polling untuk real-time leaderboard updates
4. **Batch Submissions**: Allow multiple scores dalam satu transaction (jika contract supports)

---

## Usage

### Submit Score (Automatic)
Score otomatis di-submit saat game over jika wallet connected. User akan melihat wallet popup untuk approve transaction.

### Manual Sync
```bash
# Sync all addresses in cache
curl -X POST http://localhost:3000/api/leaderboard/sync

# Sync specific addresses
curl -X POST http://localhost:3000/api/leaderboard/sync \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["SP...", "ST..."]}'
```

### Disable Onchain Submission (Legacy)
```typescript
// In useSubmitScore hook usage
submitScore(address, score, { submitOnchain: false })
```

---

## Migration Notes

- **From file-based only**: Existing file cache tetap valid, akan di-sync dengan onchain saat sync endpoint dipanggil
- **Backward compatible**: Frontend tetap bisa submit offchain-only dengan `submitOnchain: false`
- **No breaking changes**: Existing API endpoints tetap bekerja sama

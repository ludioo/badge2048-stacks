# Events Implementation - Badge2048 Contract

**Date**: 2026-01-25  
**Status**: ✅ Complete  
**Contract**: `badge2048.clar`

## Overview

Events telah diimplementasikan di Badge2048 smart contract untuk memungkinkan frontend dan indexers (seperti talent.app) untuk track dan display badge achievements dan high score updates.

## Events Structure

### 1. badge-minted Event

**Emitted**: Ketika badge NFT berhasil di-mint melalui function `mint-badge`

**Event Structure**:
```clarity
{
  event: "badge-minted",
  player: principal,      // Wallet address yang mint badge
  tier: string-ascii,     // Badge tier: "bronze", "silver", "gold", atau "elite"
  token-id: uint,         // NFT token ID yang di-mint
  score: uint             // Score yang dicapai untuk unlock badge ini
}
```

**Example Event Data**:
```json
{
  "event": "badge-minted",
  "player": "ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5",
  "tier": "bronze",
  "token-id": 1,
  "score": 1024
}
```

**When Emitted**:
- Setelah validasi tier berhasil
- Setelah validasi score >= threshold berhasil
- Setelah badge belum pernah di-mint untuk owner+tier ini
- Setelah NFT berhasil di-mint
- Setelah metadata dan ownership maps di-update

**Contract Implementation**: Events di-emit dengan `print` statement (Clarity).
```clarity
(print {
  event: "badge-minted",
  player: caller,
  tier: tier,
  token-id: new-token-id,
  score: score
})
```

### 2. high-score-updated Event

**Emitted**: Ketika player's high score di-update melalui function `update-high-score`

**Event Structure**:
```clarity
{
  event: "high-score-updated",
  player: principal,      // Wallet address yang update high score
  old-score: uint,         // High score sebelumnya
  new-score: uint          // High score baru
}
```

**Example Event Data**:
```json
{
  "event": "high-score-updated",
  "player": "ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5",
  "old-score": 1000,
  "new-score": 2000
}
```

**When Emitted**:
- Hanya jika `new-score > old-score`
- Setelah high score map di-update
- Tidak di-emit jika score tidak lebih tinggi dari current high score

**Contract Implementation**: Events di-emit dengan `print` statement (Clarity).
```clarity
(print {
  event: "high-score-updated",
  player: caller,
  old-score: current-high-score,
  new-score: score
})
```

## Event Access Methods

### 1. Transaction Receipts

Events akan muncul di transaction receipts untuk setiap transaction yang berhasil.

**Stacks Explorer**:
- Visit: https://explorer.stacks.co/?chain=testnet (untuk testnet)
- Search transaction ID
- View events di transaction details

### 2. Stacks API

Query events melalui Hiro API:

**Get Events by Contract**:
```
GET https://api.testnet.hiro.so/v2/contracts/{contract_address}/events
```

**Get Events by Transaction**:
```
GET https://api.testnet.hiro.so/v2/transactions/{tx_id}/events
```

### 3. Indexers

Events dapat di-index oleh:
- **Hiro API**: Automatic indexing
- **talent.app**: Untuk display di builder profile
- **Custom indexers**: Untuk analytics atau custom dashboards

## Frontend Integration

### Querying Events

**Example: Query badge-minted events for a player**

```typescript
import { StacksTestnet } from '@stacks/network';

const contractAddress = 'ST...'; // Your deployed contract address
const playerAddress = 'ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5';

// Query events via Hiro API
const response = await fetch(
  `https://api.testnet.hiro.so/v2/contracts/${contractAddress}/events?name=badge-minted&limit=50`
);
const data = await response.json();

// Filter events for specific player
const playerEvents = data.results.filter(
  (event: any) => event.value.hex === playerAddress
);
```

### Displaying Events

Events dapat digunakan untuk:
- **Badge Gallery**: Display semua badges yang sudah di-mint
- **Achievement Timeline**: Show progression dari bronze ke elite
- **High Score History**: Track high score improvements over time
- **Profile Integration**: Display achievements di talent.app profile

## Mobile & Desktop Compatibility

✅ **Events compatible dengan semua platforms**:
- Events di-query melalui API (Hiro API, Stacks API)
- API responses adalah JSON standard
- Tidak ada platform-specific code required
- Works di browser (desktop & mobile)
- Works di mobile apps (React Native, etc.)

**Best Practices**:
- Cache events untuk performance
- Poll for new events periodically
- Handle network errors gracefully
- Show loading states saat query events

## Testing

Events telah di-test dan verified:
- ✅ Events ter-emit saat mint badge
- ✅ Events ter-emit saat update high score
- ✅ Events tidak ter-emit saat update-high-score return false (score tidak lebih tinggi)
- ✅ Event verification tests: 3 tests di describe "Events"
- ✅ All 11 tests passing (8 core + 3 event verification)

**Test Output Example**:
```
stdout | tests/badge2048_test.ts > Badge2048 Contract Tests > Mint Badge > should mint badge with valid score
{ event: "badge-minted", player: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM, score: u1024, tier: "bronze", token-id: u1 } (badge2048:195)
```

## Notes

1. **Block Height**: Block height tidak disertakan dalam events karena secara otomatis tersedia di transaction receipts. Frontend dapat query transaction receipt untuk mendapatkan block-height dan timestamp.

2. **Event Ordering**: Events di-emit dalam urutan eksekusi function. Untuk `mint-badge`, event di-emit setelah semua state updates selesai.

3. **Error Cases**: Events hanya di-emit jika function berhasil. Jika function return error, tidak ada event yang di-emit.

4. **Gas Costs**: `print` statements menambah sedikit gas cost, tapi sangat minimal dan worth it untuk event tracking.

## Future Enhancements

Potential improvements:
- Add `block-height` ke event structure (jika diperlukan)
- Add `timestamp` ke event structure (jika diperlukan)
- Add `transaction-id` ke event structure (jika diperlukan)
- Support batch event queries
- Add event filtering by date range

## References

- [Stacks API Documentation](https://docs.stacks.co/api)
- [Hiro API Documentation](https://api.hiro.so)
- [Clarity Events Best Practices](https://docs.stacks.co/docs/clarity)
- Contract: `contracts/badge2048-contract/contracts/badge2048.clar`

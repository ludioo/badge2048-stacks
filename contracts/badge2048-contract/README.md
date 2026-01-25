# Badge2048 Smart Contract

Smart contract untuk Badge2048 game yang mengimplementasikan SIP-009 NFT standard untuk achievement badges.

## Contract Overview

Contract ini memungkinkan:
- Mint NFT badge berdasarkan score achievement
- Track high score per player
- Transfer badge NFTs
- Query badge ownership dan metadata

## Badge Tiers

- **Bronze**: Score ≥ 1024
- **Silver**: Score ≥ 2048
- **Gold**: Score ≥ 4096
- **Elite**: Score ≥ 8192

## Functions

### Public Functions

- `mint-badge (tier string-ascii, score uint)` - Mint badge NFT
- `update-high-score (score uint)` - Update player's high score
- `transfer (token-id uint, sender principal, recipient principal)` - Transfer NFT

### Read-Only Functions

- `get-high-score (player principal)` - Get player's high score
- `get-badge-ownership (player principal, tier string-ascii)` - Get badge token ID
- `get-badge-metadata (token-id uint)` - Get badge metadata
- `get-badge-mint-count (tier string-ascii)` - Get mint count per tier
- `get-last-token-id` - Get last minted token ID
- `get-token-uri (token-id uint)` - Get token metadata URI
- `get-owner (token-id uint)` - Get token owner

## Error Codes

- `ERR-INVALID-TIER (1001)` - Invalid badge tier
- `ERR-SCORE-TOO-LOW (1002)` - Score below tier threshold
- `ERR-ALREADY-MINTED (1003)` - Badge already minted for this owner+tier
- `ERR-UNAUTHORIZED (1004)` - Unauthorized operation
- `ERR-INSUFFICIENT-FUNDS (1005)` - Insufficient funds
- `ERR-NOT-FOUND (1006)` - Resource not found

## Events

Events di-emit dengan `print` statements. Lihat `docs/EVENTS-IMPLEMENTATION.md` untuk detail.

- `badge-minted` - Emitted when badge is minted
- `high-score-updated` - Emitted when high score is updated

## Testing

11 tests (8 core + 3 event verification). Run tests dengan:
```bash
clarinet test
```

atau

```bash
npm test
```

## Deployment

### Testnet
```bash
clarinet deploy --testnet
```

### Mainnet
```bash
clarinet deploy --mainnet
```

## Contract Address

- Testnet: TBD (after deployment)
- Mainnet: TBD (after deployment)

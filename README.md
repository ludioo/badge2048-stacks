# badge2048

**2048 meets Web3: play, collect achievement badges, and climb the leaderboard.**

**Blockchain: [Stacks](https://stacks.co) ($STX)** — This project uses Stacks only. All on-chain logic (Clarity contracts, Stacks Connect, leaderboard wallet identity, badge NFT minting) is Stacks-specific. For another chain (EVM, Solana, etc.) you need different contracts, SDKs, and wallet integration.

**Status:** Live on **Stacks Mainnet** (contract and frontend). Testnet also supported for development. See [docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md](docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md) for migration details.

---

## Overview

badge2048 is a full-stack 2048 puzzle game with gamification and optional blockchain integration. Reach score milestones to unlock badges (Bronze, Silver, Gold, Elite), claim them locally or mint as NFTs on Stacks, connect your wallet to submit scores to the leaderboard, and compete for the top spots.

The game logic lives in pure, tested functions; the UI is built with React and modern tooling. Badge and leaderboard behavior are documented and implemented to support both an off-chain MVP and a path to on-chain minting.

---

## Features

- **2048 gameplay** — 4×4 grid, slide/merge, score, game-over. Keyboard (arrows), touch swipe, and mouse drag.
- **Badge system** — Unlock at 1024 (Bronze), 2048 (Silver), 4096 (Gold), 8192 (Elite). Local persistence and optional on-chain mint as SIP-009 NFTs.
- **Claim flow** — Claim unlocked badges on `/claim`. Choose local-only or mint via Stacks ($STX) (when contract is configured).
- **Stacks ($STX) wallet** — Connect via Stacks Connect for leaderboard identity and on-chain minting.
- **Leaderboard** — Off-chain; best score per wallet. Auto-submit on game over when connected. "Your rank" and top entries on `/leaderboard`.
- **Responsive UI** — Mobile and desktop. Animations (Framer Motion), focus/aria improvements.
- **Tests** — Unit (Vitest) for game and leaderboard logic; E2E (Playwright) for navigation, play, badges, claim, leaderboard.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Radix UI (Dialog, Slot), Lucide, CVA + `clsx` / `tailwind-merge` |
| **Blockchain: Stacks ($STX)** | Stacks Connect, `@stacks/connect-react`, `@stacks/network`, `@stacks/transactions`; native token STX for fees |
| **Smart contract** | Clarity on Stacks; Clarinet, deployments for simnet/testnet |
| **Backend (API)** | Next.js API routes: `/api/leaderboard`, `/api/leaderboard/rank`, `/api/badge-ownership` |
| **Testing** | Vitest (unit), Playwright (E2E, Chromium/Firefox/WebKit) |
| **Tooling** | ESLint, PostCSS, Autoprefixer |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ /play       │  │ /badges      │  │ /claim      │  │ /leaderboard  │  │
│  │ Game        │  │ BadgesGrid   │  │ ClaimGrid   │  │ Leaderboard   │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  └───────┬───────┘  │
│         │                │                 │                 │          │
│         ▼                ▼                 ▼                 ▼          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ useGame     │  │ useBadges    │  │ useBadge    │  │ useLeaderboard│  │
│  │ useBadge…   │  │ useBadge     │  │ Onchain     │  │ useSubmitScore│  │
│  │             │  │ Contract     │  │ useStacks…  │  │ useLeaderboard│  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  │     Rank      │  │
│         │                │                 │         └───────┬───────┘  │
│         ▼                ▼                 ▼                 ▼          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ lib/game    │  │ lib/badges   │  │ lib/stacks  │  │ lib/leaderboard│  │
│  │ (reducer,   │  │ localStorage │  │ + Stacks    │  │ leaderboard   │  │
│  │  slide,…)   │  │              │  │  Connect    │  │ Client → API  │  │
│  └─────────────┘  └──────────────┘  └──────┬──────┘  └───────┬───────┘  │
└────────────────────────────────────────────│─────────────────│──────────┘
                                             │                 │
                    ┌────────────────────────┘                 │
                    ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js server                                                          │
│  ┌───────────────────────┐  ┌─────────────────────────────────────────┐ │
│  │ /api/badge-ownership  │  │ /api/leaderboard (GET list, POST submit) │ │
│  │ (proxy to Stacks RPC) │  │ /api/leaderboard/rank?address=           │ │
│  └───────────────────────┘  │ in-memory store (abstraction for DB)   │ │
│                           └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                             │
                    ┌────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Stacks ($STX) — when configured                                         │
│  contracts/badge2048-contract: mint-badge, get-badge-ownership, etc.    │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Game:** `lib/game` holds pure logic (reducer, slide, merge, spawn, checkGameOver). No React; fully unit-tested.
- **Leaderboard:** Off-chain. `POST /api/leaderboard` and `GET /api/leaderboard` (and `/rank`) use an in-memory store; swap to DB/KV by changing the store implementation.
- **Badges:** Local state in `localStorage`; on-chain mint via Stacks ($STX) contract when `NEXT_PUBLIC_CONTRACT_ADDRESS` and Stacks wallet are set.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm**, **pnpm**, or **yarn**

### Installation

```bash
git clone https://github.com/your-username/2048.git
cd 2048
npm install
```

### Environment variables

All `NEXT_PUBLIC_STACKS_*` variables configure the **Stacks ($STX)** chain (testnet/mainnet, contract address, deployer). Copy the example and adjust:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_STACKS_NETWORK` | No | `testnet` (default) or `mainnet` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | No* | `{deployer}.badge2048` for on-chain mint; mainnet example: `SP....badge2048`; testnet: `ST....badge2048` |
| `NEXT_PUBLIC_CONTRACT_NAME` | No | `badge2048` (default) |
| `NEXT_PUBLIC_DEPLOYER_ADDRESS` | No | Deployer principal; mainnet addresses start with `SP`, testnet with `ST`; fallback used if contract address is unset |

\* Needed for on-chain mint on `/claim` and for badge-ownership API. Game, badges (local), and leaderboard work without it.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build and run production

```bash
npm run build
npm run start
```

### Deploying to Vercel

- **Build command** must be `npm run build` (defined in `vercel.json`). Do **not** override it in Vercel Dashboard with a custom script (e.g. one that exits on production), or production builds will fail.
- Set environment variables in **Project → Settings → Environment Variables** (see table above; use **mainnet** values for production: `NEXT_PUBLIC_STACKS_NETWORK=mainnet`, `NEXT_PUBLIC_CONTRACT_ADDRESS=<deployer>.badge2048`, etc.).
- If production deploy fails with a script that exits on `VERCEL_ENV=production`, see **[docs/VERCEL-DEPLOY.md](docs/VERCEL-DEPLOY.md)** for where it is set (Dashboard override) and how to fix it.
- Full mainnet deploy steps and checklist: **[docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md](docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md)** (Phase 5 "Ready for Vercel").

### npm audit (vulnerabilities)

After `npm install` you may see **9 low severity** vulnerabilities. They come from **transitive dependencies** of `@stacks/connect` / `@stacks/connect-react` (elliptic, bip322-js, etc.). The **high severity** (Next.js) is addressed by using **Next.js 16.1.6**. Do **not** run `npm audit fix --force` without testing: it would downgrade `@stacks/connect` and can break the app. Re-run `npm audit` after dependency updates; fix upstream when `@stacks/connect` bumps its dependencies.

---

## Usage

| Page | Description |
|------|-------------|
| `/` | Home; links to Play and Badges |
| `/play` | 2048 game. Arrow keys, touch swipe, or mouse drag. On game over, if wallet is connected, score is submitted to the leaderboard. |
| `/badges` | All tiers; owned / unlocked / locked. Shortcut to claim. |
| `/claim` | Eligible (unlocked, unclaimed) badges. Claim locally or mint on Stacks ($STX) when wallet and contract are configured. |
| `/leaderboard` | Top scores and “Your rank” when connected. |

**Play without wallet:** Game and local badges work. Leaderboard submit and on-chain mint require a connected Stacks ($STX) wallet.

---

## Project structure

```
├── app/
│   ├── page.tsx                 # Home
│   ├── play/page.tsx            # Game
│   ├── badges/page.tsx          # Badges
│   ├── claim/page.tsx           # Claim
│   ├── leaderboard/page.tsx     # Leaderboard
│   ├── api/
│   │   ├── leaderboard/         # GET list, POST submit
│   │   │   └── rank/            # GET ?address=
│   │   └── badge-ownership/     # Stacks read proxy
│   └── layout.tsx
├── components/
│   ├── game/                    # Game, GameBoard, Tile, ScoreDisplay
│   ├── badge/                   # BadgeCard, BadgesGrid, ClaimGrid
│   ├── leaderboard/             # LeaderboardTable, LeaderboardView, MyRankCard
│   ├── ui/                      # navigation, wallet-connect, button, dialog, alert
│   └── providers/               # StacksProvider, GlobalErrorHandler
├── lib/
│   ├── game/                    # types, reducer, slide, merge, spawn, checkGameOver, utils, constants
│   ├── badges.ts                # unlock, storage
│   ├── leaderboard/             # store, types, validate, leaderboardClient
│   ├── stacks/                  # config, constants, badgeOwnershipClient, badgeOwnershipServer
│   └── utils.ts
├── hooks/
│   ├── useGame.ts
│   ├── useBadges.ts, useBadgeContract.ts, useBadgeOnchain.ts, useStacksWallet.ts
│   ├── useLeaderboard.ts, useLeaderboardRank.ts, useSubmitScore.ts
│   └── …
├── contracts/
│   └── badge2048-contract/      # Clarity (Clarinet), badge2048.clar, tests, deployments
├── e2e/                         # Playwright: navigation, play, badges, badge-claim, leaderboard
└── docs/                        # Specs, rules, deployment (TECH-STACK, BADGE-SYSTEM, TESTNET-TO-MAINNET-MIGRATION-PLAN, VERCEL-DEPLOY, docs/rules/)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit) |
| `npm run test:ui` | Vitest UI |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` | Playwright E2E with UI |

**Contract (Clarinet):** from `contracts/badge2048-contract/` run `clarinet test`.

---

## Roadmap

- **Leaderboard persistence** — Replace in-memory store with DB or KV (e.g. Vercel KV, Upstash) for production.
- **Anti-cheat / verification** — Optional on-chain or signed proof for score submission.
- **Game:** Undo, hints, extra modes, seasonal badges.
- **UI/UX:** i18n, sound, theme toggles, further a11y.
- **Ecosystem:** Farcaster, Telegram mini-app, identity and cross-platform sync.

See [docs/FUTURE-SCOPE.md](docs/FUTURE-SCOPE.md) for more.

---

## Contributing

1. **Branch** — Use `feature/<short-description>` or `fix/<short-description>` from `develop` (or `main` if that’s the default).
2. **Commit** — Prefer conventional messages: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
3. **PR** — One logical change per PR. Include summary, rationale, and how you tested. Link relevant `docs/` when useful.
4. **Code** — Follow existing patterns; keep `lib/game` pure and tested. User-facing text in English.
5. **Docs** — Put non-trivial design and decisions in `docs/`.

See [docs/rules/repo-rules.md](docs/rules/repo-rules.md), [docs/rules/frontend-rules.md](docs/rules/frontend-rules.md), [docs/rules/backend-rules.md](docs/rules/backend-rules.md), and [docs/rules/testing-rules.md](docs/rules/testing-rules.md) for detailed conventions.

---

## License

See the [LICENSE](LICENSE) file in the root of this repository.

---

## Author

Maintained as an open-source / portfolio project. For issues and ideas, please open a GitHub issue or pull request.

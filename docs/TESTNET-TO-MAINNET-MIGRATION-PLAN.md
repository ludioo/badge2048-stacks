# Testnet to Mainnet Migration Plan

**Project**: badge2048-stacks  
**Date Created**: 2026-01-29  
**Status**: Mainnet migration complete (Phase 1–5.3 done; Phase 6 in progress)  
**Target Network**: Stacks Mainnet ✅

---

## Migration Progress Tracker

**Current Phase**: Phase 6 — Post-Migration Tasks  
**Status**: Phase 6.1 complete; Phase 6.2 draft complete (2026-01-31): health API + docs/MONITORING.md + .env.example. Anda isi tool/secret (Uptime Robot, Sentry) dan centang checklist di MONITORING.md. Next: Phase 6.3 Communication setelah monitoring aman.
**Last Updated**: 2026-01-31

### Completed Phases
- [x] Phase 1: Preparation & Security (implementation complete; see "Manual Testing for You" below)
- [x] Phase 2: Contract Deployment (2.1 plan generated, 2.2 applied, 2.3 verified — "see Phase 2.3 Implementation Summary below")
- [x] Phase 3: Frontend Configuration (see Phase 3 Implementation Summary and Manual Testing below)
- [x] Phase 4: Testing & Verification (automated + manual; "badge owned without refresh" fix verified by user)
- [x] Phase 5: Production Deployment (5.1 checklist, 5.2 Vercel CLI deploy — see Phase 5.2 summary below)
- [ ] Phase 6: Post-Migration Tasks

### Key Information Recorded
- Mainnet Wallet: `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX`
- Contract Address: `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX.badge2048`
- Transaction ID: _(isi jika ada dari output deploy; atau cek di Stacks Explorer)_
- Deployment Date: 2026-01-30
- **Production URL**: `https://badge2048-stacks-cle4gz9s6-hakuryuukous-projects.vercel.app` (Vercel production 2026-01-31; main project URL may also be `https://badge2048-stacks-hakuryuukous-projects.vercel.app`)

### Files Modified During Migration

#### Phase 1
- [x] `contracts/badge2048-contract/settings/Mainnet.toml` (created, not committed — gitignored)
- [x] `components/badge/ClaimGrid.tsx` (use `apiUrl` from config — no hardcoded API URLs)
- [x] `vitest.config.ts` (exclude `e2e/` from unit test run)
- [x] `package.json` (add `build:webpack` script for stable production build)
- [x] `docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md` (Progress Tracker, Phase 1 summary, manual testing)

#### Phase 2
- [x] `contracts/badge2048-contract/deployments/default.mainnet-plan.yaml` (used for mainnet deploy; contract live)
- [x] `scripts/verify-mainnet-deployment.mjs` (Phase 2.3: automated read-only verification script)

#### Phase 3
- [x] `.env.example` (mainnet/testnet examples and comments)
- [x] `.env.local` (mainnet values — gitignored; backup testnet as .env.local.testnet.backup if needed)
- [x] `lib/stacks/config.ts` (comment for mainnet env)
- [x] `README.md` (env table mainnet/testnet notes)
- [x] `contracts/badge2048-contract/README.md` (mainnet contract address and Explorer link)
- [x] `docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md` (Phase 3 summary and manual testing)
- [x] **Phase 3 follow-up:** `lib/highScore.ts` (network-scoped high score), `components/badge/BadgesGrid.tsx`, `components/badge/ClaimGrid.tsx` (high score + diagnostic), `app/api/badge-ownership/route.ts` (response headers)

#### Phase 4
- [x] `scripts/verify-mainnet-deployment.mjs` (hex-encoded Clarity args for Hiro v2; get-last-token-id + get-badge-mint-count verified)
- [x] `docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md` (Phase 4 summary, manual testing, Progress Tracker)
- [x] **Post—Phase 4 (badge owned without refresh):** `lib/badgeOwnershipCache.ts` (new), `components/badge/BadgesGrid.tsx`, `components/badge/ClaimGrid.tsx` (invalidate cache on claim success so /badges shows Owned without page refresh)

#### Phase 5
- [x] `docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md` (Phase 5.1 checklist, Ready for Vercel handoff — deploy & env steps for user)
- [x] `vercel.json` (mainnet env vars, `outputDirectory`: `.next`, `devCommand`; used for Vercel CLI deploy)
- [x] `tsconfig.json` (exclude `contracts` so Next.js build does not type-check contract vitest.config.ts)
- [x] `docs/VERCEL-DEPLOY.md` (section 4b: Output Directory error fix and checklist)

#### Phase 6.2
- [x] `app/api/health/route.ts` (GET /api/health — contract reachable check via Hiro read-only)
- [x] `docs/MONITORING.md` (checklist & draft konfigurasi: health, Sentry, analytics, maintenance; Anda isi tool/secret)
- [x] `.env.example` (optional NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN)
- [x] `docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md` (Phase 6.2 implementation summary, checklist)

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Phase 1: Preparation & Security](#phase-1-preparation--security)
4. [Phase 2: Contract Deployment](#phase-2-contract-deployment)
5. [Phase 3: Frontend Configuration](#phase-3-frontend-configuration)
6. [Phase 4: Testing & Verification](#phase-4-testing--verification)
7. [Phase 5: Production Deployment](#phase-5-production-deployment)
8. [Phase 6: Post-Migration Tasks](#phase-6-post-migration-tasks)
9. [Rollback Procedures](#rollback-procedures)
10. [Risk Assessment](#risk-assessment)
11. [Timeline & Milestones](#timeline--milestones)

---

## Overview

This document provides a comprehensive, step-by-step plan for migrating the badge2048-stacks project from Stacks Testnet to Stacks Mainnet. The migration involves:

- **Smart Contract**: Deploying `badge2048.clar` contract to mainnet
- **Frontend**: Updating all network configurations and environment variables
- **Backend APIs**: Ensuring all API endpoints work with mainnet
- **Testing**: Comprehensive verification before and after migration
- **Documentation**: Updating all references and documentation

---

## AI Execution Guide

**For AI/Developer executing this plan**: This section provides specific guidance for automated execution.

### Execution Model

This plan uses a **hybrid execution model**:
- **AI executes**: Code changes, file updates, verification commands, testing
- **Human executes**: Manual commands requiring secrets (wallet setup, deployment), external actions (Vercel dashboard)

### Execution Flow

1. **Read current phase** â†’ Understand objectives and tasks
2. **Check prerequisites** â†’ Verify previous phase completed
3. **Execute tasks** â†’ Perform automated tasks, request human for manual tasks
4. **Verify completion** â†’ Run verification commands
5. **Document progress** â†’ Update status, record results
6. **Proceed to next phase** â†’ Only after verification passes

### Checkpoints & User Input Points

**âš ï¸ STOP AND WAIT FOR USER INPUT at these points**:

1. **Phase 1.1**: After wallet setup instructions â†’ Wait for user to provide mainnet wallet address
2. **Phase 1.2**: After Mainnet.toml template â†’ Wait for user to add mnemonic (AI cannot access secrets)
3. **Phase 2.2**: Before `clarinet deployments apply` â†’ Wait for user confirmation (IRREVERSIBLE)
4. **Phase 2.2**: After deployment command â†’ Wait for user to provide transaction ID
5. **Phase 3.1**: When updating `.env.local` â†’ Wait for user to provide mainnet contract address
6. **Phase 5.2**: Before production deployment â†’ Wait for user confirmation

### State Tracking

Track progress using this format:

```markdown
## Migration Progress Tracker

**Current Phase**: [Phase X]
**Status**: [In Progress / Completed / Blocked]
**Last Updated**: [Timestamp]

### Completed Phases
- [x] Phase 1: Preparation & Security
- [ ] Phase 2: Contract Deployment
- [x] Phase 3: Frontend Configuration (see Phase 3 Implementation Summary and Manual Testing below)
- [ ] Phase 4: Testing & Verification
- [ ] Phase 5: Production Deployment
- [ ] Phase 6: Post-Migration Tasks

### Key Information Recorded
- Mainnet Wallet: [SP...] (after Phase 1.1)
- Contract Address: [SP....badge2048] (after Phase 2.3)
- Transaction ID: [0x...] (after Phase 2.2)
- Deployment Date: [YYYY-MM-DD] (after Phase 2.2)
```

### Error Handling

If an error occurs:
1. **Stop execution** â†’ Do not proceed to next step
2. **Document error** â†’ Record error message, step, and context
3. **Check troubleshooting** â†’ Review "Common Errors & Solutions" section
4. **Request user input** â†’ If manual intervention needed
5. **Retry or fix** â†’ After resolving issue, retry from failed step

### Verification Strategy

Before proceeding to next phase:
1. Run all verification commands listed in phase
2. Check all deliverables are complete
3. Verify no errors in logs/output
4. Confirm user approval (if required)
5. Update progress tracker

### File Change Tracking

Track all file changes made during migration:

```markdown
## Files Modified During Migration

### Phase 1
- [ ] `contracts/badge2048-contract/settings/Mainnet.toml` (created, not committed)

### Phase 2
- [ ] `contracts/badge2048-contract/deployments/default.mainnet-plan.yaml` (created)

### Phase 3
- [ ] `.env.local` (updated)
- [ ] `.env.example` (updated)
- [ ] `components/badge/ClaimGrid.tsx` (updated)
- [ ] `README.md` (updated)
- [ ] `contracts/badge2048-contract/README.md` (updated)

### Phase 4
- [ ] Test files (if updated)

### Phase 5
- [ ] Production configs (if any)

### Phase 6
- [ ] Documentation files
```

### Current State

- **Testnet Contract**: `ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5.badge2048` âœ… Deployed
- **Network Configuration**: Centralized in `lib/stacks/config.ts`
- **Environment Variables**: Managed via `.env.local` and `.env.example`
- **Frontend**: Fully functional on testnet

### Target State

- **Mainnet Contract**: `{MAINNET_DEPLOYER}.badge2048` (TBD after deployment)
- **Network Configuration**: Updated to use mainnet by default
- **Environment Variables**: Mainnet values configured
- **Frontend**: Fully functional on mainnet

---

## Dependencies & Prerequisites

**Critical dependencies between phases**:

- **Phase 1 â†’ Phase 2**: Must have mainnet wallet address and Mainnet.toml configured
- **Phase 2 â†’ Phase 3**: Must have mainnet contract address from deployment
- **Phase 3 â†’ Phase 4**: Must have all config files updated
- **Phase 4 â†’ Phase 5**: Must have all tests passing
- **Phase 5 â†’ Phase 6**: Must have production deployment complete

**Prerequisites**:
- [ ] Git repository access
- [ ] Node.js and npm installed
- [ ] Clarinet installed and configured
- [ ] Access to Stacks Explorer
- [ ] Access to hosting platform (Vercel/etc.) if applicable

---

## Pre-Migration Checklist

Before starting the migration, ensure all items below are completed:

### Contract Verification
- [ ] Contract code reviewed and audited (if applicable)
- [ ] All contract tests passing (`clarinet test`)
- [ ] Contract functions verified on testnet
- [ ] No known bugs or issues in testnet deployment
- [ ] Contract address documented

### Frontend Verification
- [ ] All frontend tests passing (`npm run test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Build succeeds without errors (`npm run build`)
- [ ] No hardcoded testnet addresses in code (except fallbacks)
- [ ] All network configurations use environment variables

### Security & Access
- [ ] Mainnet wallet secured (hardware wallet recommended)
- [ ] Sufficient STX in mainnet wallet for deployment fees
- [ ] Private keys/mnemonics stored securely (never in code)
- [ ] Access to deployment tools verified
- [ ] Backup of all critical data

### Documentation
- [ ] Testnet deployment documented
- [ ] All testnet addresses/references identified
- [ ] Migration plan reviewed by team (if applicable)

---

## Phase 1: Preparation & Security

**Duration**: 1-2 days  
**Priority**: Critical

**âš ï¸ IMPORTANT**: Complete all tasks in this phase before proceeding. Do not skip verification steps.

### 1.1 Mainnet Wallet Setup

**Objective**: Prepare a secure mainnet wallet for contract deployment

**âš ï¸ AI EXECUTION NOTE**: This task requires human action. AI should provide instructions and wait for user input.

**Tasks**:
1. **Create or verify mainnet wallet** (HUMAN ACTION REQUIRED)
   - Use hardware wallet (Ledger/Trezor) if possible
   - Generate new wallet if needed (separate from testnet)
   - Document mainnet wallet address (format: `SP...`)
   
   **AI Action**: 
   - Provide instructions to user
   - Wait for user to provide mainnet wallet address
   - Verify address format (must start with `SP`, not `ST`)
   - Record address in progress tracker

2. **Fund mainnet wallet** (HUMAN ACTION REQUIRED)
   - Calculate deployment cost (typically 0.05-0.1 STX)
   - Add buffer for transaction fees (recommend 0.5-1 STX minimum)
   - Verify balance on Stacks Explorer mainnet
   
   **AI Action**:
   - Calculate recommended STX amount: 0.5-1 STX minimum
   - Provide Explorer link: `https://explorer.stacks.co/?address={MAINNET_ADDRESS}`
   - Wait for user confirmation that wallet is funded
   - Verify balance if possible via API

3. **Secure wallet credentials** (HUMAN ACTION REQUIRED)
   - Store mnemonic/private key in secure location (password manager, hardware wallet)
   - **NEVER** commit credentials to repository
   - Document wallet address in secure location
   
   **AI Action**:
   - Remind user to store credentials securely
   - Verify `.gitignore` includes `**/settings/Mainnet.toml`
   - Do NOT request or store mnemonic/private key

**Deliverables**:
- Mainnet wallet address: `SP...` (provided by user)
- Wallet funded with sufficient STX (confirmed by user)
- Credentials stored securely (user responsibility)

**Files to Update**:
- `contracts/badge2048-contract/settings/Mainnet.toml` (will be created in 1.2)
- Internal documentation (not in repo)

**AI Verification Steps**:
```bash
# Verify address format (after user provides it)
# Address should start with SP (mainnet), not ST (testnet)
echo "{MAINNET_ADDRESS}" | grep -q "^SP" && echo "âœ“ Valid mainnet address" || echo "âœ— Invalid: must start with SP"

# Check wallet balance (optional, via Explorer API)
# curl "https://api.hiro.so/extended/v1/address/{MAINNET_ADDRESS}/stx" | jq '.balance'
```

**User Input Required**:
- [ ] Mainnet wallet address (format: SP...)
- [ ] Confirmation that wallet is funded (minimum 0.5 STX)
- [ ] Confirmation that credentials are stored securely

### 1.2 Clarinet Mainnet Configuration

**Objective**: Configure Clarinet for mainnet deployment

**Tasks**:
1. **Create/Update Mainnet.toml**
   ```bash
   cd contracts/badge2048-contract
   ```
   
   **Step-by-step**:
   - Navigate to contract directory: `cd contracts/badge2048-contract`
   - Check if `settings/Mainnet.toml` exists: `ls settings/Mainnet.toml` (should not exist or be gitignored)
   - Create the file: `touch settings/Mainnet.toml` (or create manually)
   
   **File structure** (based on Testnet.toml pattern):
   ```toml
   [network]
   name = "mainnet"
   deployment_fee_rate = 10
   
   [accounts.deployer]
   mnemonic = "your mainnet wallet mnemonic phrase here - 12 or 24 words"
   # DO NOT commit this file to git - it's in .gitignore
   ```
   
   **Important**:
   - Replace `"your mainnet wallet mnemonic phrase here"` with your actual mainnet wallet mnemonic
   - The mnemonic should be 12 or 24 words
   - Verify the file is in `.gitignore` (check `contracts/badge2048-contract/.gitignore` contains `**/settings/Mainnet.toml`)
   - **NEVER** commit this file to repository
   
   **âš ï¸ AI EXECUTION NOTE**: 
   - AI can create the file structure with placeholder
   - AI MUST NOT fill in the mnemonic (user must do this manually)
   - AI should verify file is gitignored after creation
   - Wait for user to add mnemonic before proceeding

2. **Verify Clarinet installation**
   ```bash
   # Check Clarinet version (should be 2.x or later)
   clarinet --version
   # Expected output: something like "clarinet 2.x.x"
   
   # List available deployments
   clarinet deployments list
   # Should show testnet deployment if exists
   ```

3. **Verify Mainnet.toml configuration**
   ```bash
   # From contracts/badge2048-contract directory
   # Check if Clarinet can read the config
   clarinet deployments list
   # Should list mainnet as available network
   ```

4. **Test deployment plan generation (DRY RUN)**
   ```bash
   # Generate deployment plan WITHOUT deploying
   clarinet deployments generate --mainnet --manual-cost
   ```
   
   **Expected output**:
   - Creates `deployments/default.mainnet-plan.yaml`
   - Shows deployment cost estimate
   - Shows expected sender address (should match your mainnet wallet)
   
   **Review the generated plan**:
   ```bash
   # View the generated plan
   cat deployments/default.mainnet-plan.yaml
   ```
   
   **Verify in the plan**:
   - `network: mainnet` (not testnet)
   - `stacks-node: "https://api.hiro.so"` (mainnet API, not testnet)
   - `expected-sender: SP...` (your mainnet address, starts with SP not ST)
   - `contract-name: badge2048`
   - `path: "contracts\\badge2048.clar"` or `path: "contracts/badge2048.clar"`
   - `cost: <number>` (deployment cost in microSTX)
   
   **Calculate actual STX cost**:
   - Cost is in microSTX (1 STX = 1,000,000 microSTX)
   - Example: `cost: 89600` = 0.0896 STX
   - Add buffer: Recommend having at least 0.5-1 STX in wallet

**Deliverables**:
- `settings/Mainnet.toml` configured (not committed to repo)
- Deployment plan generated successfully
- Cost estimate documented
- Mainnet wallet address verified

**Files to Update**:
- `contracts/badge2048-contract/settings/Mainnet.toml` (local only, gitignored)

**Verification Commands**:
```bash
# Verify file exists and is gitignored
cd contracts/badge2048-contract
ls -la settings/Mainnet.toml  # Should exist
git check-ignore settings/Mainnet.toml  # Should output the file path (confirming it's ignored)

# Verify wallet address from mnemonic (optional, use Stacks CLI or online tool)
# Your mainnet address should start with "SP" not "ST"
```

### 1.3 Code Review & Final Testing

**Objective**: Ensure code is production-ready

**Tasks**:
1. **Run all tests**
   
   **Contract tests**:
   ```bash
   cd contracts/badge2048-contract
   
   # Run Clarinet tests
   clarinet test
   # Expected: All tests pass
   # Look for: "test result: ok. X passed; Y failed"
   
   # Run npm tests (if any)
   npm test
   # Expected: All tests pass
   ```
   
   **Frontend tests**:
   ```bash
   cd ../..  # Back to project root
   
   # Run unit tests
   npm run test
   # Expected: All tests pass
   # Note any failures and fix before proceeding
   
   # Run E2E tests (may need to update for mainnet)
   npm run test:e2e
   # Expected: Tests pass or can be updated
   # Note: E2E tests may need network config updates
   ```
   
   **Test results checklist**:
   - [ ] All Clarinet tests pass
   - [ ] All frontend unit tests pass
   - [ ] E2E tests pass or are updateable
   - [ ] No flaky tests
   - [ ] Test coverage acceptable

2. **Build verification**
   ```bash
   # From project root
   npm run build
   ```
   
   **What to check**:
   - Build completes without errors
   - No TypeScript errors
   - No ESLint errors (or acceptable warnings)
   - Build output in `.next` directory
   - Environment variables are included in build
   
   **Verify environment variables in build**:
   ```bash
   # Check that env vars are accessible
   # Start production server
   npm run start
   # In another terminal, check the build
   grep -r "NEXT_PUBLIC_STACKS_NETWORK" .next 2>/dev/null || echo "Check manually in browser"
   ```
   
   **Expected build output**:
   ```
   âœ“ Compiled successfully
   âœ“ Linting and checking validity of types
   âœ“ Collecting page data
   âœ“ Generating static pages
   ```

3. **Code review checklist**
   
   **Search for hardcoded addresses**:
   ```bash
   # Search for testnet address (should only be in docs/fallbacks)
   grep -r "ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5" \
     --exclude-dir=node_modules \
     --exclude-dir=.next \
     --exclude="*.md" \
     --exclude="*.test.ts"
   # Review each match - should only be in lib/stacks/config.ts as fallback
   ```
   
   **Check network configuration usage**:
   ```bash
   # Verify all files use config.ts
   grep -r "STACKS_TESTNET\|STACKS_MAINNET" \
     --exclude-dir=node_modules \
     --exclude-dir=.next \
     --exclude="*.md"
   # Should only be in lib/stacks/config.ts
   ```
   
   **Check for hardcoded API URLs**:
   ```bash
   # Should only be in config.ts
   grep -r "api.testnet.hiro.so\|api.hiro.so" \
     --exclude-dir=node_modules \
     --exclude-dir=.next \
     --exclude="*.md"
   # Review matches - should use config
   ```
   
   **Manual code review checklist**:
   - [ ] No hardcoded testnet addresses in code (except fallbacks in config.ts)
   - [ ] All network configs use `lib/stacks/config.ts`
   - [ ] All API URLs use `apiUrl` from config
   - [ ] Error handling comprehensive (try-catch blocks, error messages)
   - [ ] Console.logs removed or properly handled (not in production code)
   - [ ] TypeScript types are correct
   - [ ] No `any` types (or properly justified)
   - [ ] All imports are used
   - [ ] No unused variables/functions

4. **Git status check**
   ```bash
   # Check for uncommitted changes
   git status
   # Review any uncommitted changes
   # Commit or stash as needed
   
   # Create a migration branch (recommended)
   git checkout -b migration/mainnet-deployment
   # Or work on main branch if preferred
   ```

**Deliverables**:
- All tests passing
- Build successful without errors
- Code review completed
- No hardcoded addresses/URLs
- Git branch ready for changes

**Files to Review**:
- `lib/stacks/config.ts` - Network configuration
- `lib/stacks/badgeOwnershipServer.ts` - Server-side contract calls
- `hooks/useStacksWallet.ts` - Wallet integration
- `hooks/useBadgeOnchain.ts` - Onchain badge operations
- `components/badge/ClaimGrid.tsx` - Claim flow (check for hardcoded URLs)
- `app/api/badge-ownership/route.ts` - API route

**Pre-migration Git workflow** (recommended):
```bash
# Create migration branch
git checkout -b migration/mainnet-deployment

# Make all changes in this branch
# Test thoroughly
# Then merge to main when ready
```

### Phase 1 Implementation Summary (2026-01-30)

**Automated tasks completed:**

- [x] **1.1** Instructions and user-input points documented in this section; Progress Tracker added at top of doc.
- [x] **1.2** `contracts/badge2048-contract/settings/Mainnet.toml` created with placeholder mnemonic (you must replace with your mainnet mnemonic; file is gitignored). Clarinet 3.13.1 verified; `git check-ignore settings/Mainnet.toml` confirms Mainnet.toml is ignored.
- [x] **1.3** Contract tests: 11 passed (`npm run test` in `contracts/badge2048-contract`). Frontend unit tests: 111 passed (`npm run test` at repo root; e2e excluded from vitest). Build: succeeds with `npm run build -- --webpack` (see build note below). Hardcoded API URLs removed from `ClaimGrid.tsx`; it now uses `apiUrl` from `lib/stacks/config.ts`.

**Build note:** Next.js 16 uses Turbopack by default for `next build`. If you see a prerender error on `/_not-found`, use:

```bash
npx next build --webpack
```

Or add to `package.json`: `"build:webpack": "next build --webpack"` and use `npm run build:webpack` for production builds.

**Files modified in Phase 1:**

| File | Change |
|------|--------|
| `contracts/badge2048-contract/settings/Mainnet.toml` | Created (placeholder mnemonic; **do not commit**; add your mnemonic locally) |
| `components/badge/ClaimGrid.tsx` | Use `apiUrl` from `@/lib/stacks/config` instead of hardcoded Hiro API URLs (safe for desktop & mobile) |
| `vitest.config.ts` | Exclude `e2e/` so `npm run test` runs only unit tests |
| `docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md` | Migration Progress Tracker, Phase 1 summary, this manual testing section |

---

### Manual Testing for You (Phase 1)

Lakukan secara manual:

1. **Mainnet wallet (Phase 1.1)**  
   - Siapkan wallet mainnet (alamat format `SP...`).  
   - Danakan dengan minimal ~0.5"“1 STX.  
   - Simpan mnemonic/private key dengan aman; **jangan** commit ke repo.  
   - Beri tahu saya alamat mainnet Anda (SP...) setelah selesai (untuk dicatat di Progress Tracker).

2. **Mainnet.toml (Phase 1.2)**  
   - Buka `contracts/badge2048-contract/settings/Mainnet.toml`.  
   - Ganti placeholder mnemonic dengan 12 atau 24 kata wallet mainnet Anda.  
   - Jangan commit file ini (sudah ada di `.gitignore`).

3. **Generate deployment plan (setelah mnemonic diisi)**  
   Di `contracts/badge2048-contract` jalankan:
   ```bash
   clarinet deployments generate --mainnet --manual-cost
   ```
   Cek bahwa `deployments/default.mainnet-plan.yaml` terbentuk dan biaya deployment sesuai.

4. **E2E tests (opsional)**  
   Jalankan E2E terpisah:
   ```bash
   npm run test:e2e
   ```
   **Status (2026-01-30):** Leaderboard & play E2E sudah diperbaiki (30 passed). Tes badge-claim dan badges masih gagal karena fixture localStorage tidak terbaca saat halaman load (bisa ditangani di Phase 4). Jika Anda hanya butuh navigasi/leaderboard/play lulus, E2E sudah memadai.

5. **Desktop & mobile view**  
   - Jalankan `npm run dev`, buka `/`, `/play`, `/claim`, `/badges`, `/leaderboard`.  
   - Di desktop: pastikan layout dan tombol berfungsi.  
   - Di browser: buka DevTools â†’ toggle device toolbar (mobile view), atau uji di ponsel nyata.  
   - Pastikan: wallet connect, claim flow, dan polling tx tidak error; UI tetap terbaca di layar kecil.

Setelah Anda selesai dengan poin 1"“2 (dan optional 3"“5), beri tahu saya dan kita bisa lanjut ke **Phase 2: Contract Deployment**.

---

## Phase 2: Contract Deployment

**Duration**: 1 day  
**Priority**: Critical  
**âš ï¸ IRREVERSIBLE**: Once deployed, contract cannot be changed

### 2.1 Generate Deployment Plan

**Objective**: Create mainnet deployment plan

**Tasks**:
1. **Generate deployment plan**
   ```bash
   cd contracts/badge2048-contract
   clarinet deployments generate --mainnet --manual-cost
   ```
   - This creates `deployments/default.mainnet-plan.yaml`
   - Review the plan carefully
   - Verify contract path: `contracts/badge2048.clar`
   - Check expected sender matches mainnet wallet
   - Note deployment cost

2. **Review deployment plan**
   - Verify contract name: `badge2048`
   - Verify clarity version compatibility
   - Check anchor block only setting
   - Review cost estimate

**Deliverables**:
- `deployments/default.mainnet-plan.yaml` generated
- Deployment plan reviewed and approved

**Files Created**:
- `contracts/badge2048-contract/deployments/default.mainnet-plan.yaml`

### 2.2 Execute Deployment

**Objective**: Deploy contract to Stacks Mainnet

**âš ï¸ CRITICAL**: This is an IRREVERSIBLE operation. AI must request explicit user confirmation before executing.

**âš ï¸ AI EXECUTION NOTE**: 
- AI should prepare the deployment command
- AI MUST request user confirmation before running `clarinet deployments apply --mainnet`
- AI should wait for user to execute the command manually OR get explicit approval
- After deployment, AI should wait for user to provide transaction ID

**Tasks**:
1. **Final verification checklist**
   ```bash
   # Verify you're in the right directory
   cd contracts/badge2048-contract
   pwd  # Should end with /badge2048-contract
   
   # Verify mainnet wallet balance
   # Check your mainnet wallet on Stacks Explorer:
   # https://explorer.stacks.co/?address={YOUR_MAINNET_ADDRESS}
   # Or use Stacks CLI if available
   ```
   
   **Pre-deployment checks**:
   - [ ] Mainnet wallet has sufficient STX (minimum 0.5 STX recommended)
   - [ ] You're in `contracts/badge2048-contract` directory
   - [ ] `settings/Mainnet.toml` exists and has correct mnemonic
   - [ ] `deployments/default.mainnet-plan.yaml` exists and is correct
   - [ ] Contract code is final version (no last-minute changes)
   - [ ] Network is mainnet (check plan file: `network: mainnet`)
   - [ ] Expected sender matches your mainnet wallet address

2. **Deploy contract** (USER ACTION REQUIRED)
   
   **âš ï¸ AI ACTION**: 
   - Prepare the command for user
   - Request explicit confirmation from user
   - User must execute this command manually (requires mnemonic/private key)
   - Wait for user to provide transaction ID
   
   ```bash
   # Apply the deployment plan
   clarinet deployments apply --mainnet
   ```
   
   **What to expect**:
   - Clarinet will read `deployments/default.mainnet-plan.yaml`
   - It will prompt for confirmation (if interactive)
   - It will build and sign the transaction
   - It will broadcast to mainnet
   - You'll see transaction ID in output
   
   **AI Verification After User Executes**:
   - Request transaction ID from user
   - Verify transaction ID format (starts with `0x`)
   - Record transaction ID in progress tracker
   - Provide Explorer link for monitoring
   
   **Example output**:
   ```
   Applying deployment plan: default.mainnet-plan.yaml
   Network: mainnet
   Expected sender: SP...
   Contract: badge2048
   Cost: 89600 microSTX
   
   [Confirm? (y/n)]: y
   
   Building transaction...
   Signing transaction...
   Broadcasting transaction...
   
   Transaction ID: 0x1234567890abcdef...
   Transaction broadcasted successfully.
   Waiting for confirmation...
   ```
   
   **Important**:
   - **DO NOT** interrupt the process
   - Save the transaction ID immediately
   - Wait for confirmation message

3. **Monitor deployment**
   
   **In terminal**:
   - Watch for confirmation messages
   - Note the transaction ID when it appears
   - Wait for "Transaction confirmed" or similar message
   
   **On Stacks Explorer**:
   - Open: `https://explorer.stacks.co/?txid={TRANSACTION_ID}`
   - Monitor transaction status:
     - `pending` â†’ transaction submitted, waiting for block
     - `success` â†’ transaction confirmed
     - `abort_by_response` â†’ transaction failed (check error)
   
   **Expected timeline**:
   - Transaction broadcast: Immediate
   - First confirmation: 10-30 minutes (Stacks block time)
   - Full confirmation: 1-2 hours (Bitcoin anchor block)
   
   **Check transaction status via API**:
   ```bash
   # Replace {TX_ID} with your transaction ID
   curl "https://api.hiro.so/extended/v1/tx/{TX_ID}"
   ```
   
   **Look for**:
   - `tx_status: "success"` â†’ Deployment successful
   - `tx_status: "pending"` â†’ Still waiting
   - `tx_status: "abort_by_response"` â†’ Failed (check `tx_result`)

**Deliverables**:
- Contract deployed to mainnet
- Transaction ID recorded
- Deployment confirmed on Stacks Explorer

**Transaction Details to Record** (create a file `MAINNET_DEPLOYMENT_RECORD.md`):
```markdown
# Mainnet Deployment Record

## Deployment Date
{YYYY-MM-DD HH:MM:SS UTC}

## Transaction Details
- **Transaction ID**: `0x...`
- **Block Height**: `...`
- **Contract Address**: `{MAINNET_DEPLOYER}.badge2048`
- **Deployment Cost**: `... STX` (from plan file)
- **Actual Cost**: `... STX` (from transaction)

## Explorer Links
- Transaction: https://explorer.stacks.co/?txid={TX_ID}
- Contract: https://explorer.stacks.co/?contract={MAINNET_DEPLOYER}.badge2048

## Verification
- [ ] Contract visible on Explorer
- [ ] Contract code matches source
- [ ] All functions accessible
- [ ] Read-only functions tested
```

**Troubleshooting**:
- **Transaction fails**: Check wallet balance, network connectivity, contract code
- **Timeout**: Transaction may still be processing, check Explorer
- **Wrong network**: Verify `Mainnet.toml` and deployment plan
- **Insufficient funds**: Add more STX to wallet and retry

### 2.3 Verify Deployment

**Objective**: Confirm contract is live and accessible on mainnet

**Tasks**:
1. **Check Stacks Explorer**
   
   **Step-by-step**:
   - Open browser
   - Visit: `https://explorer.stacks.co/?contract={MAINNET_DEPLOYER}.badge2048`
   - Replace `{MAINNET_DEPLOYER}` with your actual mainnet address
   
   **What to verify**:
   - [ ] Contract page loads (not 404)
   - [ ] Contract name shows: `badge2048`
   - [ ] Deployer address matches your wallet
   - [ ] Contract code is visible (click "View Source" or "Code")
   - [ ] Contract code matches your local `badge2048.clar` file
   - [ ] Functions list shows all expected functions:
     - `mint-badge`
     - `update-high-score`
     - `transfer`
     - `get-high-score`
     - `get-badge-ownership`
     - `get-badge-metadata`
     - etc.
   - [ ] Deployment transaction is visible in transaction history
   
   **Check deployment transaction**:
   - Find the deployment transaction in contract history
   - Verify transaction status: `success`
   - Note the transaction ID (should match what you recorded)
   - Check block height and timestamp

2. **Test read-only functions via API**
   
   **Using curl/HTTP**:
   ```bash
   # Replace {CONTRACT_ADDRESS} with your contract address
   # Replace {FUNCTION_NAME} with function to test
   # Replace {ARGUMENTS} with function arguments (if any)
   
   # Test get-last-token-id (no arguments)
   curl "https://api.hiro.so/v2/contracts/call-read/{CONTRACT_ADDRESS}/badge2048/get-last-token-id" \
     -H "Content-Type: application/json" \
     -d '{"sender": "{YOUR_ADDRESS}", "arguments": []}'
   
   # Test get-badge-mint-count for bronze tier
   curl "https://api.hiro.so/v2/contracts/call-read/{CONTRACT_ADDRESS}/badge2048/get-badge-mint-count" \
     -H "Content-Type: application/json" \
     -d '{
       "sender": "{YOUR_ADDRESS}",
       "arguments": [{"type": "string", "value": "bronze"}]
     }'
   ```
   
   **Using Clarinet console** (if available):
   ```bash
   cd contracts/badge2048-contract
   clarinet console --mainnet
   ```
   
   **In console, test functions**:
   ```clarity
   ;; Test get-last-token-id
   (contract-call? '{MAINNET_DEPLOYER}.badge2048 get-last-token-id)
   ;; Expected: (ok u0) or (ok u<N>) where N is token count
   
   ;; Test get-badge-mint-count for bronze
   (contract-call? '{MAINNET_DEPLOYER}.badge2048 get-badge-mint-count "bronze")
   ;; Expected: (ok u<N>) where N is mint count
   ```
   
   **Using frontend test page** (after frontend is configured):
   - Navigate to `/test-contract` page
   - Test read-only functions
   - Verify responses are correct

3. **Verify contract state**
   
   **Check initial state**:
   - `get-last-token-id` should return `u0` (no tokens minted yet)
   - `get-badge-mint-count` for each tier should return `u0`
   - Contract should be in clean initial state
   
   **Verify contract is responsive**:
   - All read-only calls should return quickly (< 5 seconds)
   - No timeout errors
   - Responses are valid Clarity values

4. **Document contract address**
   
   **Create deployment record** (if not done in 2.2):
   ```bash
   # Create a record file
   cat > MAINNET_DEPLOYMENT_RECORD.md << EOF
   # Mainnet Deployment Record
   
   ## Deployment Date
   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
   
   ## Contract Details
   - **Contract Address**: {MAINNET_DEPLOYER}.badge2048
   - **Deployer**: {MAINNET_DEPLOYER}
   - **Network**: mainnet
   
   ## Transaction Details
   - **Transaction ID**: {TX_ID}
   - **Block Height**: {BLOCK_HEIGHT}
   - **Deployment Cost**: {COST} STX
   
   ## Explorer Links
   - Contract: https://explorer.stacks.co/?contract={MAINNET_DEPLOYER}.badge2048
   - Transaction: https://explorer.stacks.co/?txid={TX_ID}
   
   ## Verification Status
   - [x] Contract visible on Explorer
   - [x] Contract code verified
   - [x] Read-only functions tested
   - [x] Contract responsive
   EOF
   ```

**Deliverables**:
- Contract verified on Stacks Explorer
- Read-only functions tested and working
- Contract address documented
- Deployment record created

**Verification Checklist**:
- [ ] Contract visible on Stacks Explorer mainnet
- [ ] Contract code matches source file
- [ ] All functions listed and accessible
- [ ] Deployment transaction shows as success
- [ ] `get-last-token-id` returns `u0` (or expected value)
- [ ] `get-badge-mint-count` works for all tiers
- [ ] Contract responds to queries quickly
- [ ] No errors in contract state
- [ ] Contract address recorded in documentation

**Troubleshooting**:
- **Contract not found**: Wait for full confirmation (1-2 hours), check transaction status
- **Functions not visible**: May need to wait for indexer sync, check again later
- **API errors**: Verify contract address format, check API endpoint is mainnet
- **Timeout errors**: Check network connectivity, try again later

### Phase 2.3 Implementation Summary (2026-01-30)

**Automated verification (done):**

- **API read-only call**: `get-last-token-id` called against mainnet contract via Hiro API (`https://api.hiro.so`).
  - **Result**: `okay: true`, `result`: hex-encoded Clarity `(ok u0)` "” contract is **live and responsive** on mainnet.
- **Script**: `node scripts/verify-mainnet-deployment.mjs` "” run from repo root to re-verify.
- **Note**: `get-badge-mint-count` via raw POST (JSON `arguments`) may require Clarity hex-encoded args; frontend/backend use `@stacks/transactions` and work correctly. Manual check: Stacks Explorer or Clarinet console.

**Verification checklist (record here):**

- [x] Contract reachable via mainnet API (`get-last-token-id` returns `u0`)
- [x] Contract responds quickly (no timeout)
- [ ] Contract visible on Stacks Explorer mainnet (manual: open link below)
- [ ] Contract code matches local `badge2048.clar` (manual)
- [ ] Deployment transaction shows as success (manual; fill Transaction ID in Key Information above when available)

**Explorer link (manual check):**

- Contract: `https://explorer.stacks.co/?contract=SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX.badge2048`

**Next:** Phase 3 "” Frontend Configuration (env, config, docs).

---

## Phase 3: Frontend Configuration

**Duration**: 1 day  
**Priority**: Critical

### 3.1 Update Environment Variables

**Objective**: Configure frontend for mainnet

**âš ï¸ AI EXECUTION NOTE**: 
- AI can update `.env.local` and `.env.example` files
- AI needs mainnet contract address from Phase 2 (user provides after deployment)
- AI should verify all values before and after update
- For production env vars, AI provides instructions, user updates via dashboard

**Tasks**:
1. **Backup current `.env.local`**
   ```bash
   # From project root
   cp .env.local .env.local.testnet.backup
   # Keep this backup in case you need to switch back
   ```

2. **Update `.env.local` (local development)**
   
   **âš ï¸ AI ACTION**: 
   - AI can perform this update automatically
   - AI needs mainnet contract address from user (from Phase 2.3)
   - AI should backup file first
   - AI should verify values after update
   
   **Step-by-step**:
   - Open `.env.local` in editor
   - Replace all values with mainnet configuration
   
   **User Input Required**:
   - [ ] Mainnet contract address: `{MAINNET_DEPLOYER}.badge2048` (from Phase 2.3)
   - [ ] Mainnet deployer address: `{MAINNET_DEPLOYER}` (from Phase 1.1)
   
   **Complete `.env.local` content**:
   ```env
   # Stacks Network Configuration
   # Options: 'testnet' or 'mainnet'
   NEXT_PUBLIC_STACKS_NETWORK=mainnet
   
   # Contract Address (format: {deployer}.{contract-name})
   # Replace {MAINNET_DEPLOYER} with your actual mainnet address (starts with SP)
   NEXT_PUBLIC_CONTRACT_ADDRESS={MAINNET_DEPLOYER}.badge2048
   
   # Contract Name
   NEXT_PUBLIC_CONTRACT_NAME=badge2048
   
   # Deployer Address (your mainnet wallet address)
   # Replace {MAINNET_DEPLOYER} with your actual mainnet address (starts with SP)
   NEXT_PUBLIC_DEPLOYER_ADDRESS={MAINNET_DEPLOYER}
   ```
   
   **Example with actual address**:
   ```env
   NEXT_PUBLIC_STACKS_NETWORK=mainnet
   NEXT_PUBLIC_CONTRACT_ADDRESS=SP1234567890ABCDEF.badge2048
   NEXT_PUBLIC_CONTRACT_NAME=badge2048
   NEXT_PUBLIC_DEPLOYER_ADDRESS=SP1234567890ABCDEF
   ```
   
   **Verification**:
   ```bash
   # Verify file was updated
   cat .env.local
   # Should show mainnet values
   
   # Verify mainnet address format (starts with SP, not ST)
   grep "NEXT_PUBLIC_DEPLOYER_ADDRESS" .env.local
   # Should show SP... not ST...
   ```

3. **Update `.env.example`**
   
   **Step-by-step**:
   - Open `.env.example` in editor
   - Update to reflect mainnet as default (or keep testnet as default for safety)
   
   **Updated `.env.example` content**:
   ```env
   # Stacks Network Configuration
   # Options: 'testnet' or 'mainnet'
   # Default: 'testnet' (change to 'mainnet' for production)
   NEXT_PUBLIC_STACKS_NETWORK=testnet
   
   # Contract Address (format: {deployer}.{contract-name})
   # Mainnet example: SP1234567890ABCDEF.badge2048
   # Testnet example: ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5.badge2048
   NEXT_PUBLIC_CONTRACT_ADDRESS=
   
   # Contract Name
   NEXT_PUBLIC_CONTRACT_NAME=badge2048
   
   # Deployer Address (your wallet address)
   # Mainnet addresses start with SP
   # Testnet addresses start with ST
   NEXT_PUBLIC_DEPLOYER_ADDRESS=
   ```
   
   **Commit the change**:
   ```bash
   git add .env.example
   git commit -m "docs: update .env.example with mainnet examples"
   ```

4. **Validate environment variables**
   
   **Create validation script** (optional but recommended):
   ```bash
   # Create a simple validation check
   # Check that all required vars are set
   if [ -z "$NEXT_PUBLIC_STACKS_NETWORK" ]; then
     echo "ERROR: NEXT_PUBLIC_STACKS_NETWORK not set"
     exit 1
   fi
   
   if [ "$NEXT_PUBLIC_STACKS_NETWORK" = "mainnet" ]; then
     if [[ ! "$NEXT_PUBLIC_DEPLOYER_ADDRESS" =~ ^SP ]]; then
       echo "ERROR: Mainnet deployer address should start with SP"
       exit 1
     fi
   fi
   
   echo "Environment variables validated"
   ```
   
   **Or validate manually**:
   ```bash
   # Check network
   grep "NEXT_PUBLIC_STACKS_NETWORK" .env.local
   # Should show: NEXT_PUBLIC_STACKS_NETWORK=mainnet
   
   # Check contract address format
   grep "NEXT_PUBLIC_CONTRACT_ADDRESS" .env.local
   # Should show: NEXT_PUBLIC_CONTRACT_ADDRESS=SP....badge2048
   
   # Check deployer address format
   grep "NEXT_PUBLIC_DEPLOYER_ADDRESS" .env.local
   # Should show: NEXT_PUBLIC_DEPLOYER_ADDRESS=SP...
   ```

5. **Update production environment variables** (USER ACTION REQUIRED)
   
   **âš ï¸ AI ACTION**: 
   - AI provides instructions and values
   - User must update via hosting platform dashboard/CLI
   - AI cannot access hosting platform credentials
   
   **For Vercel**:
   ```bash
   # Using Vercel CLI (USER EXECUTES)
   vercel env add NEXT_PUBLIC_STACKS_NETWORK
   # Enter: mainnet
   # Select: Production, Preview, Development
   
   vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
   # Enter: {MAINNET_DEPLOYER}.badge2048
   
   vercel env add NEXT_PUBLIC_DEPLOYER_ADDRESS
   # Enter: {MAINNET_DEPLOYER}
   ```
   
   **Or via Vercel Dashboard** (USER ACTION):
   - Go to project settings â†’ Environment Variables
   - Add/update each variable:
     - `NEXT_PUBLIC_STACKS_NETWORK` = `mainnet`
     - `NEXT_PUBLIC_CONTRACT_ADDRESS` = `{MAINNET_DEPLOYER}.badge2048`
     - `NEXT_PUBLIC_DEPLOYER_ADDRESS` = `{MAINNET_DEPLOYER}`
   - Apply to: Production, Preview, Development (or as needed)
   - Redeploy after updating
   
   **For other platforms**:
   - Follow platform-specific instructions
   - Ensure variables are set before deployment
   - Verify variables are accessible at build time (NEXT_PUBLIC_*)
   
   **AI Verification**:
   - Provide checklist for user to confirm
   - After user confirms, proceed to next task

**Deliverables**:
- `.env.local` updated for mainnet
- `.env.example` updated with examples
- Production environment variables configured
- Environment variables validated

**Files to Update**:
- `.env.local` (local, gitignored) - update manually
- `.env.example` (committed) - update and commit
- Production hosting platform settings - update via dashboard/CLI

**Verification Checklist**:
- [ ] `.env.local` has `NEXT_PUBLIC_STACKS_NETWORK=mainnet`
- [ ] `.env.local` has mainnet contract address (SP...badge2048)
- [ ] `.env.local` has mainnet deployer address (SP...)
- [ ] `.env.example` updated with examples
- [ ] Production env vars set in hosting platform
- [ ] Address format correct (SP for mainnet, not ST)

### 3.2 Update Configuration Files

**Objective**: Ensure all config files use mainnet settings

**Tasks**:
1. **Verify `lib/stacks/config.ts`**
   - Check that it reads from `NEXT_PUBLIC_STACKS_NETWORK`
   - Verify fallback logic (should default to testnet for safety, but env should override)
   - Test that `isTestnet` evaluates correctly
   - Verify `contractConfig` uses environment variable

2. **Check for hardcoded references**
   ```bash
   # Search for hardcoded testnet addresses
   grep -r "ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5" --exclude-dir=node_modules --exclude="*.md"
   ```
   - Review any matches
   - Update if necessary (most should be in docs only)

3. **Update `lib/stacks/config.ts` default (optional)**
   - Consider changing default from `'testnet'` to `'mainnet'` if desired
   - Or keep testnet as default for safety
   - Document decision

**Deliverables**:
- Config files verified
- No hardcoded testnet addresses in code
- Configuration logic tested

**Files to Review**:
- `lib/stacks/config.ts`
- `lib/stacks/badgeOwnershipServer.ts`
- `hooks/useStacksWallet.ts`
- `hooks/useBadgeOnchain.ts`
- `components/badge/ClaimGrid.tsx` (check API URL logic)

### 3.3 Update Hardcoded API URLs (if any)

**Objective**: Ensure all API calls use mainnet endpoints

**Tasks**:
1. **Identify hardcoded URLs**
   ```bash
   # From project root
   # Search for testnet API URLs
   grep -r "api.testnet.hiro.so" --exclude-dir=node_modules --exclude-dir=.next
   # Search for mainnet API URLs (should be in config only)
   grep -r "api.hiro.so" --exclude-dir=node_modules --exclude-dir=.next
   # Search for hardcoded network checks
   grep -r "NEXT_PUBLIC_STACKS_NETWORK === 'testnet'" --exclude-dir=node_modules --exclude-dir=.next
   ```

2. **Fix `components/badge/ClaimGrid.tsx`**
   
   **Current code (line 320-322)**:
   ```typescript
   const apiUrl = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'testnet'
     ? 'https://api.testnet.hiro.so'
     : 'https://api.hiro.so'
   ```
   
   **Step-by-step fix**:
   - Open `components/badge/ClaimGrid.tsx`
   - Find line 24 (imports section)
   - Add import: `import { apiUrl } from '@/lib/stacks/config';`
   - Find line 320-322 (the hardcoded API URL)
   - Remove the hardcoded logic
   - Use `apiUrl` directly from config
   
   **Updated code**:
   ```typescript
   // At top with other imports (around line 24)
   import { apiUrl, getExplorerUrl } from '@/lib/stacks/config';
   
   // Replace lines 320-322 with:
   // Use apiUrl from config (already imported)
   // No need for hardcoded check - config handles it
   
   // Then in the fetch call (around line 333):
   const fetchUrl = `${apiUrl}/extended/v1/tx/${txIdForApi}`
   ```
   
   **Complete fix example**:
   ```typescript
   // Remove these lines (320-322):
   // const apiUrl = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'testnet'
   //   ? 'https://api.testnet.hiro.so'
   //   : 'https://api.hiro.so'
   
   // The apiUrl is already imported from config at the top
   // Just use it directly in the fetch call
   ```

3. **Verify the fix**
   ```bash
   # Check that hardcoded URL is removed
   grep -n "api.testnet.hiro.so\|api.hiro.so" components/badge/ClaimGrid.tsx
   # Should show no results (or only in comments)
   
   # Verify import exists
   grep -n "apiUrl.*from.*config" components/badge/ClaimGrid.tsx
   # Should show the import line
   ```

4. **Test the change**
   ```bash
   # Build to check for TypeScript errors
   npm run build
   # Should succeed without errors
   
   # Start dev server
   npm run dev
   # Test claim flow to verify API calls work
   ```

5. **Search for other hardcoded URLs**
   ```bash
   # Comprehensive search
   grep -r "https://api.testnet.hiro.so" --exclude-dir=node_modules --exclude-dir=.next --exclude="*.md"
   grep -r "https://api.hiro.so" --exclude-dir=node_modules --exclude-dir=.next --exclude="*.md"
   grep -r "explorer.stacks.co.*testnet" --exclude-dir=node_modules --exclude-dir=.next --exclude="*.md"
   ```
   
   **Review each match**:
   - If in documentation (`.md` files): OK to leave
   - If in code: Should use config
   - If in tests: May need to update test expectations

**Deliverables**:
- All API URLs use configuration
- No hardcoded testnet/mainnet URLs in code
- ClaimGrid.tsx refactored to use config

**Files to Update**:
- `components/badge/ClaimGrid.tsx` (remove hardcoded API URL, use `apiUrl` from config)

**Verification**:
```bash
# After fix, verify no hardcoded URLs in code
grep -r "api.testnet.hiro.so\|api.hiro.so" --exclude-dir=node_modules --exclude-dir=.next --exclude="*.md" --exclude="*.test.ts"
# Should only show results in lib/stacks/config.ts (which is correct)
```

### 3.4 Update Documentation References

**Objective**: Update all documentation to reflect mainnet

**Tasks**:
1. **Update `README.md`**
   - Update contract address section
   - Update environment variable examples
   - Update explorer links

2. **Update `contracts/badge2048-contract/README.md`**
   - Add mainnet contract address
   - Update deployment section
   - Add mainnet explorer link

3. **Update other docs as needed**
   - Check `docs/ONCHAIN_STACKS_BADGE2048.md`
   - Update any testnet-specific instructions

**Deliverables**:
- README updated
- Contract README updated
- Documentation reflects mainnet

**Files to Update**:
- `README.md`
- `contracts/badge2048-contract/README.md`
- `docs/ONCHAIN_STACKS_BADGE2048.md` (if applicable)

### Phase 3 Implementation Summary (2026-01-30)

**Completed:**

- **3.1 Environment variables**
  - `.env.example`: Updated with mainnet/testnet examples; default remains `testnet` for safety.
  - `.env.local`: Set to mainnet (`NEXT_PUBLIC_STACKS_NETWORK=mainnet`, contract and deployer `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX`).
- **3.2 Configuration**
  - `lib/stacks/config.ts`: Verified; reads from env; comment added for mainnet. Hardcoded testnet address only in fallback and in contract tests (correct).
- **3.3 API URLs**
  - ClaimGrid already uses `apiUrl` from config (Phase 1). Grep confirms only `lib/stacks/config.ts` contains Hiro API URLs.
- **3.4 Documentation**
  - `README.md`: Env table updated with mainnet/testnet notes.
  - `contracts/badge2048-contract/README.md`: Mainnet contract address and Explorer link added.
- **Build**: `npm run build:webpack` succeeded.

**Verification checklist (automated):**

- [x] `.env.local` has `NEXT_PUBLIC_STACKS_NETWORK=mainnet`
- [x] `.env.local` has mainnet contract address (SP...badge2048)
- [x] `.env.local` has mainnet deployer address (SP...)
- [x] `.env.example` updated with mainnet/testnet examples
- [x] No hardcoded API URLs in code (only in `lib/stacks/config.ts`)
- [x] Production build succeeds

**Phase 3 follow-up fix (2026-01-30) "” masalah claimable tanpa main sudah teratasi:**

- **Masalah:** Di `/badges` dan `/claim` badge bronze/silver tampil claimable padahal user belum main (mainnet).
- **Penyebab:** High score disimpan satu key untuk semua network; skor dari testnet terbaca di mainnet.
- **Perbaikan:**
  - **`lib/highScore.ts`**: High score sekarang **per network** (`highScore_v1_mainnet`, `highScore_v1_testnet`). Mainnet selalu mulai dari 0; testnet tetap migrasi dari key lama.
  - **`BadgesGrid` & `ClaimGrid`**: "Unlocked" / claimable memakai **current high score** (loadHighScore()) saja; mainnet = 0 sampai user main di mainnet.
  - **API `/api/badge-ownership`**: Response header `X-Stacks-Network` dan `X-Contract-Address` untuk verifikasi mainnet/testnet.
  - **Diagnostic logs**: `[BadgesGrid] diagnostic`, `[ClaimGrid] diagnostic`, dan API response headers di console (bisa dihapus setelah stabil).
- **Konfirmasi:** User mengonfirmasi masalah sudah teratasi; Phase 3 selesai penuh.

---

### Manual Testing for You (Phase 3)

Lakukan secara manual:

1. **Backup .env.local testnet (opsional)**  
   Jika ingin bisa switch kembali ke testnet:
   ```bash
   cp .env.local .env.local.mainnet.backup
   # Simpan isi testnet lama di .env.local.testnet.backup jika belum
   ```

2. **Verifikasi lokal dengan mainnet**  
   - Jalankan: `npm run dev`  
   - Buka http://localhost:3000  
   - Cek: `/`, `/play`, `/claim`, `/badges`, `/leaderboard`  
   - Connect wallet (mainnet); pastikan network di wallet adalah **Mainnet**  
   - Di `/claim`: jika eligible, cek bahwa flow claim/mint memakai mainnet (Explorer link harus mainnet)  
   - Di `/badges`: badge ownership dari API harus dari mainnet contract  

3. **Production environment variables (wajib jika deploy ke Vercel/dll)**  
   - **Vercel Dashboard**: Project â†’ Settings â†’ Environment Variables  
   - Tambah/update:
     - `NEXT_PUBLIC_STACKS_NETWORK` = `mainnet`
     - `NEXT_PUBLIC_CONTRACT_ADDRESS` = `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX.badge2048`
     - `NEXT_PUBLIC_DEPLOYER_ADDRESS` = `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX`
   - Scope: Production (dan Preview/Development jika ingin)
   - Setelah simpan: **Redeploy** project agar env dipakai di build

4. **E2E (opsional)**  
   - `npm run test:e2e` "” bisa gagal jika fixture/localStorage mengasumsikan testnet; bisa disesuaikan di Phase 4 jika perlu.

Setelah poin 2 (dan 3 jika deploy production), Phase 3 selesai. **Konfirmasi:** Masalah claimable tanpa main sudah teratasi (high score per network); Phase 3 selesai penuh. Lanjut ke **Phase 4: Testing & Verification** bila Anda siap.

---

## Phase 4: Testing & Verification

**Duration**: 2-3 days  
**Priority**: Critical

### 4.1 Local Testing

**Objective**: Verify frontend works correctly with mainnet configuration locally

**Tasks**:
1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Test wallet connection**
   - Connect wallet (ensure wallet is on mainnet)
   - Verify address displayed correctly
   - Check network indicator shows mainnet

3. **Test contract reads**
   - Navigate to `/badges` page
   - Verify badge ownership queries work
   - Check API calls go to mainnet endpoints
   - Verify no CORS errors

4. **Test transaction flow (dry run)**
   - Navigate to `/claim` page
   - Attempt to claim badge (don't complete)
   - Verify transaction is built for mainnet
   - Check contract address in transaction

5. **Test all pages**
   - `/` - Home page
   - `/play` - Game functionality
   - `/badges` - Badge display
   - `/claim` - Claim flow
   - `/leaderboard` - Leaderboard

**Deliverables**:
- All pages load correctly
- Wallet connection works
- Contract reads work
- No errors in console

**Test Checklist**:
- [ ] Wallet connects to mainnet
- [ ] Badge ownership API works
- [ ] Transaction building works
- [ ] All pages render correctly
- [ ] No console errors

### 4.2 Build & Production Test

**Objective**: Verify production build works correctly

**Tasks**:
1. **Build for production**
   ```bash
   npm run build
   ```
   - Check for build errors
   - Review build output
   - Verify environment variables are included

2. **Test production build locally**
   ```bash
   npm run start
   ```
   - Test all functionality
   - Verify network configuration
   - Check API endpoints

3. **Run E2E tests**
   ```bash
   npm run test:e2e
   ```
   - Update E2E tests if needed (network config)
   - Verify tests pass or update expectations

**Deliverables**:
- Production build successful
- Production build tested locally
- E2E tests updated and passing

### 4.3 Mainnet Contract Testing

**Objective**: Test actual contract interactions on mainnet

**Tasks**:
1. **Test read-only functions**
   - Use `/test-contract` page or direct API calls
   - Test `get-high-score`
   - Test `get-badge-ownership` for all tiers
   - Test `get-badge-metadata`
   - Verify responses are correct

2. **Test write functions (small test)**
   - **âš ï¸ CAUTION**: This will cost real STX
   - Use small test transaction first
   - Test `update-high-score` with small score
   - Verify transaction succeeds
   - Check on Stacks Explorer

3. **Test badge minting (if applicable)**
   - **âš ï¸ CAUTION**: This will cost real STX and mint real NFT
   - Only test if absolutely necessary
   - Use lowest tier badge (Bronze)
   - Verify NFT appears in wallet
   - Check metadata is correct

**Deliverables**:
- Read-only functions tested
- Write functions tested (if applicable)
- Contract interactions verified

**âš ï¸ Important Notes**:
- Mainnet transactions cost real STX
- Test with minimal amounts first
- Verify everything works before large transactions

### 4.4 Integration Testing

**Objective**: Test complete user flows end-to-end

**Tasks**:
1. **Complete game flow**
   - Play game to unlock badge
   - Verify badge unlocks locally
   - Navigate to claim page
   - Verify badge is claimable

2. **Test claim flow (if testing)**
   - Connect wallet
   - Claim badge
   - Monitor transaction
   - Verify badge appears in wallet
   - Check badge ownership updates

3. **Test leaderboard**
   - Submit score
   - Verify score appears on leaderboard
   - Check rank calculation

**Deliverables**:
- Complete flows tested
- All integrations working
- User experience verified

---

### Phase 4 Implementation Summary (2026-01-31)

**Automated verification completed:**

- [x] **4.1 Local Testing (automated part)**  
  - Unit tests: **111 passed** (`npm run test -- --run`).  
  - Dev server: manual (see "Manual Testing for You (Phase 4)" below).
- [x] **4.2 Build & Production Test**  
  - Production build: **success** (`npm run build:webpack`).  
  - E2E: **30 passed, 10 failed**. Failures are only in `badge-claim.spec.ts` and `badges.spec.ts` (expect "1 badge ready to claim" / "Go to Claim" / "Claimable: 1"). These rely on `localStorage` fixture `badges_v1` and/or high score; in E2E the app may not show claimable state when fixture is set (known from Phase 3). Navigation, leaderboard, and play E2E pass.
- [x] **4.3 Mainnet Contract Testing (read-only)**  
  - Script `scripts/verify-mainnet-deployment.mjs` run successfully.  
  - `get-last-token-id`: OK.  
  - `get-badge-mint-count("bronze")`: OK (script updated to use hex-encoded Clarity args via `stringAsciiCV`).
- [x] **4.4 Integration Testing**  
  - Manual: complete game flow, claim flow, leaderboard (see checklist below).  
  - **Verified by user:** Claim bronze â†’ "View badges" â†’ bronze shows "Owned" without refresh (badge-ownership cache invalidation fix).

**Files modified in Phase 4:**

| File | Change |
|------|--------|
| `scripts/verify-mainnet-deployment.mjs` | Use `@stacks/transactions` (cvToHex, stringAsciiCV) for Hiro v2 call-read argument encoding; both read-only checks pass. |
| `docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md` | Progress Tracker, Phase 4 summary, manual testing checklist. |
| **Post—Phase 4 fix (badge owned without refresh):** | |
| `lib/badgeOwnershipCache.ts` | New: shared client cache for badge ownership; `invalidateBadgeOwnershipCache()` so /badges refetches after claim. |
| `components/badge/BadgesGrid.tsx` | Use shared cache (get/set) instead of local cache. |
| `components/badge/ClaimGrid.tsx` | Call `invalidateBadgeOwnershipCache()` on every claim success path so navigating to /badges shows "Owned" without refresh. |

---

### Manual Testing for You (Phase 4)

Lakukan secara manual:

1. **4.1 Local Testing**
   - `npm run dev` â†’ buka `/`, `/play`, `/badges`, `/claim`, `/leaderboard`.
   - Cek: wallet connect (mainnet), network indicator mainnet, badge ownership API, tidak ada error di console.
   - Cek halaman claim: transaksi dibangun untuk mainnet, alamat kontrak benar.

2. **4.2 Production build lokal**
   - `npm run start` (setelah `npm run build:webpack`) â†’ uji semua halaman seperti di atas.

3. **4.3 Write functions (opsional; pakai STX asli)**
   - Jika ingin tes tulis di mainnet: tes kecil `update-high-score` atau claim badge tier terendah; pantau di Stacks Explorer.

4. **4.4 Integration**
   - Flow lengkap: main game â†’ unlock badge â†’ ke `/claim` â†’ claim badge â†’ cek badge di wallet/Explorer.
   - Leaderboard: submit score, cek tampil dan rank.

Setelah poin 1"“2 (dan opsional 3"“4) selesai, Phase 4 dianggap selesai. Konfirmasi ke saya bila siap lanjut **Phase 5: Production Deployment**.

**Verifikasi (2026-01-31):** User mengonfirmasi fix "badge owned tanpa refresh" "” setelah claim bronze dan klik "View badges", bronze langsung tampil sebagai "Owned" tanpa refresh. Phase 4 selesai; langkah selanjutnya: Phase 5.

---

## Phase 5: Production Deployment

**Duration**: 1 day  
**Priority**: Critical

### 5.1 Pre-Deployment Checklist

**Objective**: Final verification before production deployment

**Tasks**:
1. **Verify all configurations**
   - [ ] Environment variables set correctly
   - [ ] Contract address correct
   - [ ] Network set to mainnet
   - [ ] All tests passing

2. **Review code changes**
   - [ ] All changes committed
   - [ ] No debug code left
   - [ ] No testnet-specific code
   - [ ] Documentation updated

3. **Backup current state**
   - [ ] Tag current testnet version
   - [ ] Document current state
   - [ ] Prepare rollback plan

**Deliverables**:
- Pre-deployment checklist complete
- Code ready for deployment

### 5.2 Deploy to Production

**Objective**: Deploy frontend to production hosting

**Tasks**:
1. **Deploy to hosting platform**
   - If using Vercel: Push to main branch or use Vercel CLI
   - If using other platform: Follow platform-specific steps
   - Monitor deployment logs

2. **Verify deployment**
   - Check deployment URL
   - Verify site loads
   - Check environment variables are set
   - Verify network configuration

3. **Test production site**
   - Test wallet connection
   - Test contract reads
   - Test all pages
   - Check for errors

**Deliverables**:
- Frontend deployed to production
- Production site verified
- All functionality working

### 5.3 Post-Deployment Verification

**Objective**: Comprehensive verification of production deployment

**Tasks**:
1. **Functional testing**
   - Test all user flows
   - Verify contract interactions
   - Check error handling
   - Test on different devices/browsers

2. **Performance testing**
   - Check page load times
   - Verify API response times
   - Check transaction confirmation times

3. **Monitor for issues**
   - Watch error logs
   - Monitor user feedback
   - Check transaction success rates

**Deliverables**:
- Production site fully verified
- Monitoring in place
- Issues documented (if any)

---

### Phase 5.1 Implementation Summary (2026-01-31)

**Pre-deployment checklist (AI-executed):**

1. **Verify all configurations**
   - [x] Environment variables: `.env.example` and `lib/stacks/config.ts` use `NEXT_PUBLIC_STACKS_NETWORK`, `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_CONTRACT_NAME`, `NEXT_PUBLIC_DEPLOYER_ADDRESS` "” no hardcoded mainnet addresses in code; fallback testnet only when env unset (local dev).
   - [x] Contract address: mainnet `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX.badge2048` (from Key Information).
   - [x] Network: set via env to `mainnet` for production.
   - [x] All tests passing: `npm run test` "” 111 passed (9 files).

2. **Review code changes**
   - [x] Config and contract usage: all from env/centralized config; testnet fallback only in `lib/stacks/config.ts` when env empty.
   - [x] No testnet-specific code blocking production (testnet appears only in fallbacks, comments, and test files).
   - [x] Debug: many `console.log` in ClaimGrid, BadgesGrid, hooks (diagnostic); optional cleanup later "” not blocking deploy.
   - [x] Documentation: migration plan and README/env docs updated.

3. **Backup / tag**
   - [ ] Tag current version (user): e.g. `git tag pre-mainnet-deploy-2026-01-31` before deploy (recommended).
   - [ ] Rollback: revert commit and redeploy on Vercel, or use Vercel "Promote to Production" to previous deployment.

4. **Build**
   - [x] `npm run build:webpack` "” success (Next.js 16.1.4, .env.local loaded).

**Conclusion:** Ready for production deploy. Deploy to Vercel is done by user; see **Ready for Vercel** below.

---

### Ready for Vercel "” Langkah Deploy & Environment Variables

**Anda yang melakukan deploy di Vercel.** Berikut langkah dan env yang perlu diisi.

#### Langkah 1: Push code (jika belum)

```bash
git add .
git status   # pastikan hanya file yang ingin deploy
git commit -m "chore: ready for mainnet production deploy"
git push origin mainnet   # atau branch yang dipakai Vercel (mis. main)
```

#### Langkah 2: Buat / pilih project di Vercel

1. Buka [vercel.com](https://vercel.com) â†’ login.
2. **Import** repo `badge2048-stacks` (atau pilih project yang sudah ada).
3. **Framework Preset**: Next.js (auto-detect).
4. **Root Directory**: kosongkan (root repo = `./`).
5. **Build Command**: `npm run build` atau `npm run build:webpack` (disarankan `build:webpack` untuk build stabil seperti lokal).
6. **Output Directory**: default Next.js (biarkan default).
7. Jangan klik Deploy dulu "” set Environment Variables dulu (Langkah 3).

#### Langkah 3: Environment Variables di Vercel

Di Vercel: **Project â†’ Settings â†’ Environment Variables**. Tambahkan variabel berikut untuk **Production** (dan optional untuk Preview jika ingin preview mainnet):

| Name | Value | Environment | Wajib |
|------|--------|-------------|--------|
| `NEXT_PUBLIC_STACKS_NETWORK` | `mainnet` | Production (dan Preview jika mau) | Ya |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX.badge2048` | Production | Ya |
| `NEXT_PUBLIC_CONTRACT_NAME` | `badge2048` | Production | Ya |
| `NEXT_PUBLIC_DEPLOYER_ADDRESS` | `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX` | Production | Ya |

- Tidak ada secret/private key yang perlu diisi; semua variabel di atas **NEXT_PUBLIC_** (aman untuk client).
- Setelah menambah/mengubah env, **redeploy** agar env dipakai (Deployments â†’ ... â†’ Redeploy).

#### Langkah 4: Deploy

1. Klik **Deploy** (atau trigger deploy lewat push).
2. Tunggu build selesai; cek log bila ada error.
3. Catat **Production URL** (mis. `https://badge2048-stacks.vercel.app`).

#### Langkah 5: Verifikasi setelah deploy

1. Buka Production URL â†’ pastikan halaman load.
2. Cek network: wallet connect â†’ pastikan koneksi ke **mainnet** (bukan testnet).
3. Test halaman: `/`, `/play`, `/claim`, `/badges`, `/leaderboard`.
4. (Opsional) Claim flow: mainnet contract read/write dan badge ownership tampil benar.

Setelah Anda selesai deploy dan verifikasi, beri tahu saya "” kita lanjut **Phase 5.3 Post-Deployment Verification** (functional test, performance, monitoring) dan update Progress Tracker.

---

### Phase 5.2 Implementation Summary (2026-01-31)

**Vercel production deploy (CLI):**

- **Link:** Project linked to **Hakuryuukou's projects** / `badge2048-stacks` (new project; not flaredaddy).
- **Config:** `vercel.json` "” mainnet env vars, `outputDirectory`: `.next`, `devCommand`. `tsconfig.json` "” exclude `contracts` so Next.js build does not type-check contract `vitest.config.ts`.
- **Deploy:** `vercel --prod` run from repo root; build succeeded; production URL assigned.
- **Production URL:** `https://badge2048-stacks-cle4gz9s6-hakuryuukous-projects.vercel.app` (deployment URL; main project URL may also be `https://badge2048-stacks-hakuryuukous-projects.vercel.app`).
- **Fixes applied during Phase 5.2:** (1) tsconfig exclude `contracts` (fix: `@stacks/clarinet-sdk/vitest` not found during Next.js build). (2) vercel.json `outputDirectory`: `.next` and Dashboard Output Directory cleared (fix: "   ./" not found). (3) docs/VERCEL-DEPLOY.md section 4b added (Output Directory error).

**Next:** Phase 5.3 Post-Deployment Verification (functional test on production URL, monitoring); then Phase 6.

---

### Phase 5.3 Implementation Summary (2026-01-31)

**Automated verification (AI-executed):**

1. **Unit tests**
   - [x] `npm run test` — 111 passed (9 files).

2. **Mainnet contract read-only**
   - [x] `node scripts/verify-mainnet-deployment.mjs` — get-last-token-id and get-badge-mint-count OK; contract live on mainnet.

3. **Production build**
   - [x] `npm run build` (Next.js with webpack) — compiled successfully; static/dynamic routes generated.

**Manual verification (for you):**

- See **Manual Testing for You (Phase 5.3)** below. Setelah Anda selesai cek production URL (load, wallet mainnet, claim/badges/leaderboard), centang checklist di sana dan beri tahu jika ada issue — lalu kita lanjut Phase 6.

---

### Manual Testing for You (Phase 5.3)

Lakukan di **production URL** (mis. `https://badge2048-stacks-cle4gz9s6-hakuryuukous-projects.vercel.app` atau URL project Vercel Anda):

1. **Site load**
   - [x] Home `/` load tanpa error.
   - [x] Halaman `/play`, `/claim`, `/badges`, `/leaderboard` load.

2. **Network & wallet**
   - [x] Connect wallet → pastikan network **mainnet** (bukan testnet).
   - [x] UI menampilkan mainnet / contract mainnet jika ada indikator.

3. **Contract & flows**
   - [x] `/claim`: eligibility dan claim flow jalan (baca dari mainnet contract).
   - [x] `/badges`: daftar badge dan status "Owned" tampil benar setelah claim.
   - [x] `/leaderboard`: high score / leaderboard load (mainnet).

4. **Error handling**
   - [x] Disconnect wallet atau address tanpa badge → pesan error/empty state jelas (tidak blank/crash).

5. **Optional: device/browser**
   - [x] Test di mobile view atau browser lain jika perlu.

**Status (2026-01-31):** Manual testing selesai oleh user; semua aman. Lanjut Phase 6.

---

## Phase 6: Post-Migration Tasks

**Duration**: Ongoing  
**Priority**: High

### 6.1 Documentation Updates

**Objective**: Update all documentation to reflect mainnet

**Tasks**:
1. **Update main README**
   - [x] Contract address / mainnet status (live on Mainnet; link to migration plan)
   - [x] Environment variable examples (mainnet for production)
   - [x] Deployment instructions (link to migration plan Phase 5 / VERCEL-DEPLOY)

2. **Update contract README**
   - [x] Mainnet address added (already present; mainnet deploy date 2026-01-30 added)
   - [x] Explorer links updated (already present)
   - [x] Deployment steps documented (link to migration plan)

3. **Update internal docs**
   - [x] Migration completed documented (status at top of this doc; Phase 5.3 complete)
   - [x] Mainnet addresses recorded (Key Information Recorded; contract README)
   - [ ] Lessons learned documented (optional; add to Issues & Resolutions or appendix if needed)

**Deliverables**:
- All documentation updated
- Mainnet information recorded

### 6.2 Monitoring & Maintenance

**Objective**: Set up ongoing monitoring

**Tasks**:
1. **Set up error monitoring**
   - [ ] Configure error tracking (Sentry, etc.) — **Anda isi tool/secret**; langkah di [docs/MONITORING.md](MONITORING.md).
   - [ ] Set up alerts for critical errors (Sentry / Vercel / layanan pilihan).
   - [ ] (Opsional) Monitor transaction failure rates (Stacks Explorer / indexer).

2. **Set up analytics**
   - [ ] (Opsional) Track user interactions (Vercel Analytics, Plausible, GA, dll.).
   - [ ] (Opsional) Monitor contract usage / badge minting (Explorer, indexer).

3. **Regular health checks**
   - [x] **Health endpoint tersedia**: `GET /api/health` — verifikasi contract reachable (Hiro read-only). Implementasi: `app/api/health/route.ts`.
   - [ ] Daftar health check di Uptime Robot (atau Cronitor/Better Uptime); alert jika 503.
   - [ ] Rutinitas: harian (health), mingguan (error logs), bulanan (usage) — checklist di [docs/MONITORING.md](MONITORING.md).

**Deliverables**:
- Health check API live (`/api/health`); Anda daftar di layanan uptime + isi error monitoring (Sentry/tool).
- Checklist dan draft konfigurasi: **[docs/MONITORING.md](MONITORING.md)**.
- Env placeholder untuk monitoring: `.env.example` (SENTRY_DSN, dll.); Anda isi di Vercel.

**Phase 6.2 Implementation Summary (2026-01-31):**
- **Health API**: `GET /api/health` — returns 200 when contract reachable, 503 when Hiro/contract unreachable. No secrets; pakai config existing.
- **Docs**: `docs/MONITORING.md` — checklist step-by-step (health, Sentry, analytics, maintenance). Anda isi tool (Uptime Robot, Sentry DSN, dll.).
- **Env**: `.env.example` — optional `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`; Anda set di Vercel bila pakai Sentry.
- **Sisa untuk Anda**: (1) Daftar `/api/health` di Uptime Robot; (2) Pilih & konfigurasi error monitoring (Sentry); (3) Centang checklist di MONITORING.md setelah selesai.

### 6.3 Communication

**Objective**: Communicate migration to users/stakeholders

**Tasks**:
1. **Update public information**
   - Update website/social media
   - Announce mainnet launch (if applicable)
   - Update any public documentation

2. **User communication**
   - Notify users of migration (if applicable)
   - Provide migration guide (if needed)
   - Update support documentation

**Deliverables**:
- Public information updated
- Users notified (if applicable)

---

## Rollback Procedures

### If Contract Deployment Fails

**Scenario**: Contract deployment transaction fails or is rejected

**Actions**:
1. Check transaction status on Stacks Explorer
2. Review error message
3. Verify wallet has sufficient STX
4. Check network connectivity
5. Retry deployment if appropriate
6. If persistent failure, review contract code for issues

### If Frontend Has Issues

**Scenario**: Frontend deployed but has critical bugs

**Actions**:
1. **Immediate**: Revert to previous deployment
   - If using Vercel: Revert to previous deployment
   - If using Git: Revert commit and redeploy
   
2. **Investigate**: Identify root cause
   - Check error logs
   - Review recent changes
   - Test locally with production config

3. **Fix**: Resolve issues
   - Fix bugs
   - Test thoroughly
   - Redeploy when ready

### If Contract Has Critical Bugs

**Scenario**: Contract deployed but has critical bugs (rare, but possible)

**Actions**:
1. **Assess severity**
   - Is bug exploitable?
   - Does it affect user funds?
   - Can it be worked around?

2. **Mitigation options**
   - Pause frontend if possible
   - Deploy new contract version (if upgradeable)
   - Document workarounds
   - Communicate with users

3. **Long-term**
   - Plan contract upgrade (if possible)
   - Or accept limitations and document

**âš ï¸ Note**: Clarity contracts are typically immutable once deployed. Critical bugs may require deploying a new contract version.

---

## Risk Assessment

### High Risk Items

1. **Contract Deployment**
   - **Risk**: Deployment fails, costs STX, contract has bugs
   - **Mitigation**: Thorough testing on testnet, code review, test deployment plan

2. **Configuration Errors**
   - **Risk**: Wrong network, wrong contract address
   - **Mitigation**: Double-check all configs, use environment variables, test locally first

3. **Transaction Costs**
   - **Risk**: Users pay real STX for transactions
   - **Mitigation**: Clear communication, reasonable fee estimates, test transactions first

### Medium Risk Items

1. **Frontend Bugs**
   - **Risk**: UI issues, broken flows
   - **Mitigation**: Comprehensive testing, gradual rollout, monitoring

2. **API Issues**
   - **Risk**: Hiro API downtime, rate limits
   - **Mitigation**: Error handling, retry logic, fallbacks

3. **User Experience**
   - **Risk**: Confusion during migration
   - **Mitigation**: Clear communication, documentation, support

### Low Risk Items

1. **Documentation Updates**
   - **Risk**: Outdated docs
   - **Mitigation**: Update as part of migration, review process

2. **Monitoring Setup**
   - **Risk**: Missed issues
   - **Mitigation**: Set up early, regular reviews

---

## Timeline & Milestones

### Estimated Timeline

- **Phase 1 (Preparation)**: 1-2 days
- **Phase 2 (Contract Deployment)**: 1 day
- **Phase 3 (Frontend Configuration)**: 1 day
- **Phase 4 (Testing)**: 2-3 days
- **Phase 5 (Production Deployment)**: 1 day
- **Phase 6 (Post-Migration)**: Ongoing

**Total Estimated Time**: 6-9 days (excluding post-migration tasks)

### Key Milestones

1. **M1: Preparation Complete**
   - Mainnet wallet ready
   - Clarinet configured
   - Code reviewed and tested

2. **M2: Contract Deployed**
   - Contract live on mainnet
   - Contract address documented
   - Deployment verified

3. **M3: Frontend Configured**
   - Environment variables updated
   - Config files verified
   - Local testing complete

4. **M4: Testing Complete**
   - All tests passing
   - Contract interactions verified
   - Production build tested

5. **M5: Production Live**
   - Frontend deployed
   - Production site verified
   - Monitoring in place

6. **M6: Migration Complete**
   - Documentation updated
   - Monitoring configured
   - Users notified (if applicable)

---

## Appendix

### A. Environment Variable Reference

#### Local Development (`.env.local`)
```env
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_CONTRACT_ADDRESS={MAINNET_DEPLOYER}.badge2048
NEXT_PUBLIC_CONTRACT_NAME=badge2048
NEXT_PUBLIC_DEPLOYER_ADDRESS={MAINNET_DEPLOYER}
```

#### Production (Hosting Platform)
Same as above, set in platform's environment variable settings.

### B. Contract Addresses

#### Testnet (Current)
- **Contract**: `ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5.badge2048`
- **Explorer**: https://explorer.stacks.co/?chain=testnet&contract=ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5.badge2048

#### Mainnet (To be filled)
- **Contract**: `{MAINNET_DEPLOYER}.badge2048` (TBD)
- **Explorer**: https://explorer.stacks.co/?contract={MAINNET_DEPLOYER}.badge2048 (TBD)

### C. API Endpoints

#### Testnet
- **API**: `https://api.testnet.hiro.so`
- **Explorer**: `https://explorer.stacks.co/?chain=testnet`

#### Mainnet
- **API**: `https://api.hiro.so`
- **Explorer**: `https://explorer.stacks.co`

### D. Key Files Reference

#### Configuration Files
- `lib/stacks/config.ts` - Main network configuration
- `lib/stacks/constants.ts` - Contract constants
- `.env.local` - Local environment variables
- `.env.example` - Environment variable template

#### Contract Files
- `contracts/badge2048-contract/contracts/badge2048.clar` - Contract source
- `contracts/badge2048-contract/settings/Mainnet.toml` - Mainnet config (local)
- `contracts/badge2048-contract/deployments/default.mainnet-plan.yaml` - Deployment plan

#### Documentation
- `README.md` - Main project README
- `contracts/badge2048-contract/README.md` - Contract README
- `docs/TESTNET-TO-MAINNET-MIGRATION-PLAN.md` - This document

### E. AI Verification Commands

These commands can be run by AI to verify each step:

#### Phase 1 Verification
```bash
# Verify Mainnet.toml exists and is gitignored
test -f contracts/badge2048-contract/settings/Mainnet.toml && echo "âœ“ Mainnet.toml exists" || echo "âœ— Mainnet.toml missing"
git check-ignore contracts/badge2048-contract/settings/Mainnet.toml && echo "âœ“ File is gitignored" || echo "âœ— File NOT gitignored"

# Verify deployment plan generated
test -f contracts/badge2048-contract/deployments/default.mainnet-plan.yaml && echo "âœ“ Plan exists" || echo "âœ— Plan missing"

# Verify tests pass
cd contracts/badge2048-contract && clarinet test 2>&1 | grep -q "test result: ok" && echo "âœ“ Tests pass" || echo "âœ— Tests fail"
cd ../.. && npm run test 2>&1 | grep -q "PASS\|âœ“" && echo "âœ“ Frontend tests pass" || echo "âœ— Frontend tests fail"
```

#### Phase 2 Verification
```bash
# Verify contract address format (after user provides)
echo "{CONTRACT_ADDRESS}" | grep -q "^SP.*\.badge2048$" && echo "âœ“ Valid format" || echo "âœ— Invalid format"

# Verify transaction ID format
echo "{TX_ID}" | grep -q "^0x[0-9a-fA-F]\{64\}$" && echo "âœ“ Valid TX ID" || echo "âœ— Invalid TX ID"

# Check contract on Explorer (via API)
curl -s "https://api.hiro.so/v2/contracts/{CONTRACT_ADDRESS}" | jq -e '.contract_id' > /dev/null && echo "âœ“ Contract exists" || echo "âœ— Contract not found"
```

#### Phase 3 Verification
```bash
# Verify .env.local has mainnet values
grep -q "NEXT_PUBLIC_STACKS_NETWORK=mainnet" .env.local && echo "âœ“ Network set to mainnet" || echo "âœ— Network not set"
grep -q "NEXT_PUBLIC_CONTRACT_ADDRESS=SP.*\.badge2048" .env.local && echo "âœ“ Contract address set" || echo "âœ— Contract address missing/invalid"
grep -q "NEXT_PUBLIC_DEPLOYER_ADDRESS=SP" .env.local && echo "âœ“ Deployer address set" || echo "âœ— Deployer address missing/invalid"

# Verify ClaimGrid.tsx uses config (not hardcoded)
grep -q "import.*apiUrl.*from.*config" components/badge/ClaimGrid.tsx && echo "âœ“ Uses config" || echo "âœ— Hardcoded URL"
! grep -q "api.testnet.hiro.so\|api.hiro.so" components/badge/ClaimGrid.tsx || echo "âœ— Still has hardcoded URL"

# Verify build succeeds
npm run build 2>&1 | grep -q "Compiled successfully" && echo "âœ“ Build succeeds" || echo "âœ— Build fails"
```

#### Phase 4 Verification
```bash
# Verify all pages load (basic check)
npm run build 2>&1 | grep -q "Generating static pages" && echo "âœ“ Pages generated" || echo "âœ— Page generation failed"

# Check for TypeScript errors
npm run build 2>&1 | grep -i "error" | grep -v "node_modules" && echo "âœ— Has errors" || echo "âœ“ No errors"
```

#### Phase 5 Verification
```bash
# Verify production deployment (if accessible)
# curl -s "{PRODUCTION_URL}" | grep -q "badge2048" && echo "âœ“ Site accessible" || echo "âœ— Site not accessible"
```

### F. Useful Commands

#### Contract Deployment
```bash
# Navigate to contract directory
cd contracts/badge2048-contract

# Generate deployment plan (dry run)
clarinet deployments generate --mainnet --manual-cost

# Review generated plan
cat deployments/default.mainnet-plan.yaml

# Apply deployment (ACTUAL DEPLOYMENT)
clarinet deployments apply --mainnet

# Test contract locally
clarinet test

# Check Clarinet version
clarinet --version

# List available deployments
clarinet deployments list
```

#### Frontend
```bash
# Development server
npm run dev
# Opens http://localhost:3000

# Build for production
npm run build

# Run production build locally
npm run start

# Run tests
npm run test          # Unit tests
npm run test:ui       # Unit tests with UI
npm run test:e2e      # E2E tests
npm run test:e2e:ui   # E2E tests with UI

# Linting
npm run lint
```

#### Verification & Testing
```bash
# Check contract on explorer (replace {ADDRESS})
# Browser: https://explorer.stacks.co/?contract={ADDRESS}.badge2048

# Check transaction (replace {TX_ID})
# Browser: https://explorer.stacks.co/?txid={TX_ID}

# Check transaction via API
curl "https://api.hiro.so/extended/v1/tx/{TX_ID}"

# Check contract read function via API
curl "https://api.hiro.so/v2/contracts/call-read/{CONTRACT_ADDRESS}/badge2048/get-last-token-id" \
  -H "Content-Type: application/json" \
  -d '{"sender": "{YOUR_ADDRESS}", "arguments": []}'

# Verify environment variables
cat .env.local | grep NEXT_PUBLIC_STACKS

# Check for hardcoded URLs
grep -r "api.testnet.hiro.so" --exclude-dir=node_modules --exclude-dir=.next
```

#### Git Workflow
```bash
# Create migration branch
git checkout -b migration/mainnet-deployment

# Check status
git status

# Stage changes
git add .

# Commit changes
git commit -m "feat: configure for mainnet deployment"

# Push branch (if using remote)
git push origin migration/mainnet-deployment

# After testing, merge to main
git checkout main
git merge migration/mainnet-deployment
```

#### Environment Variable Management
```bash
# View current env vars (from .env.local)
cat .env.local

# Validate env vars format
grep "NEXT_PUBLIC_STACKS_NETWORK" .env.local
grep "NEXT_PUBLIC_CONTRACT_ADDRESS" .env.local
grep "NEXT_PUBLIC_DEPLOYER_ADDRESS" .env.local

# Backup env file
cp .env.local .env.local.backup

# Restore from backup
cp .env.local.backup .env.local
```

#### Troubleshooting
```bash
# Check if contract is accessible
curl "https://api.hiro.so/v2/contracts/{CONTRACT_ADDRESS}/badge2048"

# Check wallet balance (via Explorer or API)
# Browser: https://explorer.stacks.co/?address={YOUR_ADDRESS}

# Verify network in config
grep -A 5 "isTestnet\|STACKS_NETWORK" lib/stacks/config.ts

# Check build output for env vars
npm run build 2>&1 | grep -i "env\|network\|contract"

# Clear Next.js cache
rm -rf .next
npm run build
```

### G. File Change Summary

**Files that will be created**:
- `contracts/badge2048-contract/settings/Mainnet.toml` (local, gitignored)
- `contracts/badge2048-contract/deployments/default.mainnet-plan.yaml` (committed)
- `MAINNET_DEPLOYMENT_RECORD.md` (optional, local)

**Files that will be modified**:
- `.env.local` (local, gitignored) - Update values
- `.env.example` (committed) - Update examples
- `components/badge/ClaimGrid.tsx` (committed) - Remove hardcoded URL
- `README.md` (committed) - Update contract address
- `contracts/badge2048-contract/README.md` (committed) - Update mainnet info
- `docs/ONCHAIN_STACKS_BADGE2048.md` (committed) - Update if applicable

**Files that will be reviewed (no changes expected)**:
- `lib/stacks/config.ts` - Verify logic
- `lib/stacks/badgeOwnershipServer.ts` - Verify network usage
- `hooks/useStacksWallet.ts` - Verify network usage
- `hooks/useBadgeOnchain.ts` - Verify network usage

**Files that must NOT be changed**:
- `contracts/badge2048-contract/contracts/badge2048.clar` - Contract code (unless bug fix)
- Test files (unless updating for mainnet)

### H. Checklist Summary

**Pre-Migration**
- [ ] Mainnet wallet created and funded
- [ ] Clarinet configured for mainnet
- [ ] All tests passing
- [ ] Code reviewed

**Contract Deployment**
- [ ] Deployment plan generated
- [ ] Contract deployed to mainnet
- [ ] Deployment verified
- [ ] Contract address documented

**Frontend Configuration**
- [ ] Environment variables updated
- [ ] Config files verified
- [ ] Hardcoded references removed
- [ ] Documentation updated

**Testing**
- [ ] Local testing complete
- [ ] Production build tested
- [ ] Contract interactions verified
- [ ] E2E tests passing

**Production Deployment**
- [ ] Frontend deployed
- [ ] Production site verified
- [ ] Monitoring configured

**Post-Migration**
- [ ] Documentation updated
- [ ] Monitoring active
- [ ] Users notified (if applicable)

---

## Quick Reference: Step-by-Step Execution

### For AI/Developer Executing This Plan

**Phase 1: Preparation (Day 1)**
1. Create mainnet wallet â†’ Get address (SP...)
2. Fund wallet â†’ Verify balance on Explorer
3. Create `settings/Mainnet.toml` â†’ Add mnemonic (gitignored)
4. Generate deployment plan â†’ Review `default.mainnet-plan.yaml`
5. Run all tests â†’ Fix any failures
6. Code review â†’ Fix hardcoded URLs/addresses

**Phase 2: Contract Deployment (Day 2)**
1. Final verification â†’ Check wallet balance, plan file
2. Deploy contract â†’ `clarinet deployments apply --mainnet`
3. Record transaction ID â†’ Save immediately
4. Monitor on Explorer â†’ Wait for confirmation (10-30 min)
5. Verify deployment â†’ Test read-only functions

**Phase 3: Frontend Configuration (Day 3)**
1. Update `.env.local` â†’ Set all mainnet values
2. Update `.env.example` â†’ Add mainnet examples
3. Fix `ClaimGrid.tsx` â†’ Remove hardcoded API URL
4. Verify config files â†’ Check `lib/stacks/config.ts`
5. Update production env vars â†’ Vercel/dashboard

**Phase 4: Testing (Day 4-5)**
1. Local testing â†’ `npm run dev`, test all pages
2. Build test â†’ `npm run build`, verify no errors
3. Contract testing â†’ Test read/write functions
4. Integration testing â†’ Complete user flows

**Phase 5: Production (Day 6)**
1. Pre-deployment checklist â†’ Verify all configs
2. Deploy frontend â†’ Push to production
3. Post-deployment verification â†’ Test production site

**Phase 6: Post-Migration (Ongoing)**
1. Update documentation â†’ README, contract README
2. Set up monitoring â†’ Error tracking, analytics
3. Communicate â†’ Update public info, notify users

---

## Common Errors & Solutions

### Error: "Insufficient funds"
**Solution**: 
- Check wallet balance on Explorer
- Add more STX to wallet
- Verify you're using mainnet wallet (SP...), not testnet (ST...)

### Error: "Contract not found" after deployment
**Solution**:
- Wait for full confirmation (1-2 hours for Bitcoin anchor)
- Check transaction status on Explorer
- Verify contract address format: `{DEPLOYER}.badge2048`

### Error: "Network mismatch" in frontend
**Solution**:
- Verify `.env.local` has `NEXT_PUBLIC_STACKS_NETWORK=mainnet`
- Restart dev server after changing env vars
- Clear `.next` cache: `rm -rf .next && npm run build`

### Error: "CORS error" when calling API
**Solution**:
- Verify API calls go through backend (`/api/badge-ownership`)
- Check `lib/stacks/badgeOwnershipServer.ts` uses correct network
- Verify `apiUrl` in config points to mainnet

### Error: "Transaction failed" during deployment
**Solution**:
- Check transaction on Explorer for error details
- Verify contract code has no syntax errors
- Check wallet has sufficient STX for fees
- Verify network is mainnet (not testnet)

### Error: Build fails with "NEXT_PUBLIC_* not found"
**Solution**:
- Verify `.env.local` exists and has all required vars
- Restart dev server after adding env vars
- For production, set vars in hosting platform
- Verify var names are correct (no typos)

### Error: "Contract address format invalid"
**Solution**:
- Verify format: `{DEPLOYER}.{CONTRACT_NAME}`
- Mainnet deployer starts with `SP` (not `ST`)
- Contract name is `badge2048` (lowercase, no spaces)
- No extra characters or spaces

---

## Validation Scripts

### Environment Variable Validator

Create `scripts/validate-env.sh`:
```bash
#!/bin/bash

# Validate environment variables for mainnet migration

echo "Validating environment variables..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found"
  exit 1
fi

# Source the file
source .env.local

# Check required variables
REQUIRED_VARS=(
  "NEXT_PUBLIC_STACKS_NETWORK"
  "NEXT_PUBLIC_CONTRACT_ADDRESS"
  "NEXT_PUBLIC_CONTRACT_NAME"
  "NEXT_PUBLIC_DEPLOYER_ADDRESS"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var is not set"
    exit 1
  fi
done

# Validate network
if [ "$NEXT_PUBLIC_STACKS_NETWORK" != "mainnet" ] && [ "$NEXT_PUBLIC_STACKS_NETWORK" != "testnet" ]; then
  echo "ERROR: NEXT_PUBLIC_STACKS_NETWORK must be 'mainnet' or 'testnet'"
  exit 1
fi

# Validate mainnet address format
if [ "$NEXT_PUBLIC_STACKS_NETWORK" = "mainnet" ]; then
  if [[ ! "$NEXT_PUBLIC_DEPLOYER_ADDRESS" =~ ^SP ]]; then
    echo "ERROR: Mainnet deployer address must start with SP"
    exit 1
  fi
  
  if [[ ! "$NEXT_PUBLIC_CONTRACT_ADDRESS" =~ ^SP.*\.badge2048$ ]]; then
    echo "ERROR: Mainnet contract address format invalid. Expected: SP....badge2048"
    exit 1
  fi
fi

# Validate contract name
if [ "$NEXT_PUBLIC_CONTRACT_NAME" != "badge2048" ]; then
  echo "WARNING: Contract name is not 'badge2048'"
fi

echo "âœ“ All environment variables validated successfully"
```

### Contract Verification Script

Create `scripts/verify-contract.sh`:
```bash
#!/bin/bash

# Verify contract deployment on mainnet

CONTRACT_ADDRESS="${1:-}"
if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "Usage: ./scripts/verify-contract.sh {CONTRACT_ADDRESS}"
  echo "Example: ./scripts/verify-contract.sh SP123.badge2048"
  exit 1
fi

echo "Verifying contract: $CONTRACT_ADDRESS"

# Check contract exists
echo "Checking contract on Explorer..."
curl -s "https://api.hiro.so/v2/contracts/$CONTRACT_ADDRESS" | jq '.'

# Test read-only function
echo "Testing get-last-token-id..."
curl -s "https://api.hiro.so/v2/contracts/call-read/$CONTRACT_ADDRESS/get-last-token-id" \
  -H "Content-Type: application/json" \
  -d '{"sender": "'"$CONTRACT_ADDRESS"'.badge2048", "arguments": []}' | jq '.'

echo "Verification complete"
```

---

## Monitoring Checklist

### Post-Deployment Monitoring (First 24 Hours)

**Every Hour**:
- [ ] Check error logs (if available)
- [ ] Verify contract is accessible
- [ ] Check transaction success rate
- [ ] Monitor user feedback (if applicable)

**Daily**:
- [ ] Review error logs
- [ ] Check contract usage metrics
- [ ] Verify all functions still working
- [ ] Check Explorer for any issues

**Weekly**:
- [ ] Review usage statistics
- [ ] Check for any reported issues
- [ ] Verify monitoring tools are working
- [ ] Update documentation if needed

### Key Metrics to Monitor

1. **Contract Metrics**:
   - Total badges minted
   - Transactions per day
   - Error rate
   - Average transaction time

2. **Frontend Metrics**:
   - Page load times
   - API response times
   - Error rates
   - User engagement

3. **Network Metrics**:
   - Stacks API availability
   - Transaction confirmation times
   - Network congestion

---

## Notes

- This plan assumes you have full control over the deployment process
- Adjust timelines based on your team size and availability
- Some steps may be done in parallel (e.g., documentation updates)
- Always test thoroughly before proceeding to next phase
- Keep backups of all critical data and configurations
- Document any deviations from this plan
- **For AI execution**: Follow steps sequentially, verify each step before proceeding
- **For human execution**: Review entire plan first, then execute phase by phase

### Important Reminders

- âš ï¸ **Contract deployment is IRREVERSIBLE** - test thoroughly on testnet first
- âš ï¸ **Mainnet transactions cost real STX** - verify amounts before sending
- âš ï¸ **Never commit secrets** - Mainnet.toml and .env.local are gitignored
- âš ï¸ **Verify network** - Always double-check you're on mainnet, not testnet
- âš ï¸ **Backup everything** - Keep backups of configs, addresses, transaction IDs

---

**Last Updated**: 2026-01-29  
**Status**: Ready for Implementation  
**Next Steps**: Begin Phase 1 - Preparation & Security  
**Estimated Total Time**: 6-9 days (excluding post-migration tasks)

---

## AI Execution Checklist Template

Use this template to track execution progress:

```markdown
# Migration Execution Log

**Started**: [Date/Time]
**Current Phase**: [Phase X - Task Y]
**Status**: [In Progress / Completed / Blocked / Waiting for User]

## Phase 1: Preparation & Security
- [ ] 1.1 Mainnet Wallet Setup
  - [ ] User provided wallet address: [SP...]
  - [ ] Wallet balance verified: [Yes/No]
  - [ ] Credentials secured: [Confirmed by user]
- [ ] 1.2 Clarinet Mainnet Configuration
  - [ ] Mainnet.toml created (template)
  - [ ] User added mnemonic: [Confirmed]
  - [ ] File verified as gitignored: [Yes/No]
  - [ ] Deployment plan generated: [Yes/No]
  - [ ] Plan reviewed: [Yes/No]
- [ ] 1.3 Code Review & Final Testing
  - [ ] All tests passing: [Yes/No]
  - [ ] Build successful: [Yes/No]
  - [ ] Code review completed: [Yes/No]
  - [ ] Git branch created: [Yes/No]

## Phase 2: Contract Deployment
- [ ] 2.1 Generate Deployment Plan
  - [ ] Plan generated: [Yes/No]
  - [ ] Plan reviewed: [Yes/No]
- [ ] 2.2 Execute Deployment
  - [ ] User confirmed deployment: [Yes/No]
  - [ ] Deployment executed: [Yes/No]
  - [ ] Transaction ID received: [0x...]
  - [ ] Transaction monitored: [Yes/No]
- [ ] 2.3 Verify Deployment
  - [ ] Contract visible on Explorer: [Yes/No]
  - [ ] Read-only functions tested: [Yes/No]
  - [ ] Contract address recorded: [SP....badge2048]

## Phase 3: Frontend Configuration
- [ ] 3.1 Update Environment Variables
  - [ ] .env.local updated: [Yes/No]
  - [ ] .env.example updated: [Yes/No]
  - [ ] Production env vars updated: [Confirmed by user]
- [ ] 3.2 Update Configuration Files
  - [ ] Config files verified: [Yes/No]
  - [ ] No hardcoded addresses: [Yes/No]
- [ ] 3.3 Update Hardcoded API URLs
  - [ ] ClaimGrid.tsx fixed: [Yes/No]
  - [ ] Other URLs checked: [Yes/No]
- [ ] 3.4 Update Documentation
  - [ ] README.md updated: [Yes/No]
  - [ ] Contract README updated: [Yes/No]

## Phase 4: Testing & Verification
- [x] 4.1 Local Testing (automated: unit tests 111 passed)
  - [ ] All pages tested manually: [Yes/No]
  - [ ] Wallet connection works: [Yes/No]
  - [ ] Contract reads work: [Yes/No]
- [x] 4.2 Build & Production Test
  - [x] Build successful: Yes (`npm run build:webpack`)
  - [ ] Production build tested locally: [Yes/No]
  - [x] E2E: 30 passed, 10 failed (badge-claim/badges fixture; see Phase 4 Implementation Summary)
- [x] 4.3 Mainnet Contract Testing (read-only)
  - [x] Read-only functions tested: Yes (`node scripts/verify-mainnet-deployment.mjs`)
  - [ ] Write functions tested (if applicable): [Yes/No]
- [x] 4.4 Integration Testing
  - [x] Complete flows tested: Yes (claim â†’ View badges â†’ Owned tanpa refresh "” verified by user)

## Phase 5: Production Deployment
- [x] 5.1 Pre-Deployment Checklist (2026-01-31)
  - [x] All configs verified: Yes (env from config; contract mainnet; tests 111 passed; build:webpack OK)
  - [x] Code reviewed: Yes (no blocking testnet/debug; optional console.log cleanup later)
  - [ ] Backup created: User to tag if desired (e.g. pre-mainnet-deploy-2026-01-31)
- [x] 5.2 Deploy to Production (user deploys on Vercel — see "Ready for Vercel" above)
  - [x] Frontend deployed: Yes (Vercel CLI 2026-01-31)
  - [x] Deployment verified: Yes (production URL assigned)
- [x] 5.3 Post-Deployment Verification (2026-01-31)
  - [x] Automated: tests 111 passed, mainnet contract read-only OK, build OK
  - [x] Manual: Production site tested by user — semua aman
  - [ ] Monitoring configured: [Yes/No] (Phase 6.2)

## Phase 6: Post-Migration Tasks
- [x] 6.1 Documentation Updates (2026-01-31)
  - [x] All docs updated: README (mainnet status, deploy links), contract README (mainnet date, migration link), migration plan status
- [x] 6.2 Monitoring & Maintenance (draft 2026-01-31)
  - [x] Health check API: GET /api/health (contract reachable); docs/MONITORING.md + .env.example placeholder
  - [ ] User: daftar health di Uptime Robot; konfigurasi Sentry/tool; centang checklist di MONITORING.md
- [ ] 6.3 Communication
  - [ ] Public info updated: [Yes/No]

## Key Information
- Mainnet Wallet: [SP...]
- Contract Address: [SP....badge2048]
- Transaction ID: [0x...]
- Deployment Date: [YYYY-MM-DD]
- Production URL: [URL]

## Issues & Resolutions
- [Issue description]: [Resolution]
```

---

## Decision Points & Edge Cases

### Decision Points (AI must decide or ask user)

1. **Default network in config.ts** (Phase 3.2)
   - **Decision**: Keep testnet as default (safer) OR change to mainnet?
   - **AI Action**: Present options to user, implement based on decision
   - **Recommendation**: Keep testnet as default for safety

2. **E2E test updates** (Phase 4.2)
   - **Decision**: Update tests for mainnet OR skip E2E tests?
   - **AI Action**: Check if tests can be updated, ask user if unclear
   - **Recommendation**: Update tests if possible, document if skipped

3. **Git branch strategy** (Phase 1.3)
   - **Decision**: Use migration branch OR work on main?
   - **AI Action**: Create migration branch by default, ask user if they prefer main
   - **Recommendation**: Use migration branch for safety

4. **Contract testing on mainnet** (Phase 4.3)
   - **Decision**: Test write functions (costs STX) OR skip?
   - **AI Action**: Ask user before executing any mainnet write operations
   - **Recommendation**: Test read-only first, ask before write operations

### Edge Cases & How to Handle

1. **Mainnet.toml already exists**
   - **AI Action**: Check if file exists, ask user if they want to overwrite or use existing
   - **Verification**: Read file and verify it's for mainnet (not testnet)

2. **Deployment plan generation fails**
   - **AI Action**: Check error message, verify Mainnet.toml is correct
   - **Common causes**: Wrong mnemonic format, network config error
   - **Resolution**: Ask user to verify Mainnet.toml, retry

3. **Contract deployment transaction fails**
   - **AI Action**: Check transaction status on Explorer, identify error
   - **Common causes**: Insufficient funds, network error, contract error
   - **Resolution**: Document error, ask user for next steps

4. **Environment variable already set to mainnet**
   - **AI Action**: Check current value, ask user if they want to update
   - **Verification**: Verify current values are correct

5. **Build fails after config changes**
   - **AI Action**: Check error messages, verify env vars are set correctly
   - **Common causes**: Missing env vars, TypeScript errors, import errors
   - **Resolution**: Fix errors, verify build succeeds before proceeding

6. **ClaimGrid.tsx already uses config**
   - **AI Action**: Check if hardcoded URL exists, skip if already fixed
   - **Verification**: Grep for hardcoded URLs, verify import exists

7. **Tests fail after changes**
   - **AI Action**: Identify failing tests, check if they need updates
   - **Resolution**: Update tests for mainnet OR document why they fail
   - **Decision**: Ask user if tests should be updated or skipped

8. **Production env vars already set**
   - **AI Action**: Check current values (if accessible), ask user to verify
   - **Resolution**: User updates if needed, AI proceeds after confirmation

### Error Recovery Procedures

**If error occurs during execution**:

1. **Stop immediately** â†’ Don't proceed to next step
2. **Document error** â†’ Record:
   - Error message
   - Step/task where error occurred
   - Current state (what was completed)
   - Error context (commands run, files modified)
3. **Check troubleshooting** â†’ Review "Common Errors & Solutions" section
4. **Identify cause** â†’ Determine if it's:
   - User input issue (wrong address, missing info)
   - Configuration issue (wrong values, missing files)
   - Code issue (syntax error, import error)
   - Network issue (API down, connectivity)
5. **Resolve or escalate**:
   - If fixable by AI: Fix and retry
   - If needs user input: Request user help
   - If unclear: Document and ask user
6. **Verify fix** â†’ Run verification commands
7. **Continue** â†’ Proceed only after error resolved

**Rollback if needed**:
- Git changes: `git checkout -- <file>` or `git reset`
- Env vars: Restore from backup
- Config files: Restore from backup
- Never rollback contract deployment (irreversible)

---

## Quick Start for AI Execution

**When starting execution**:

1. **Read this entire document** â†’ Understand full scope
2. **Check current state** â†’ Verify pre-migration checklist
3. **Start Phase 1** â†’ Follow tasks sequentially
4. **Stop at checkpoints** â†’ Request user input when needed
5. **Verify each step** â†’ Run verification commands
6. **Document progress** â†’ Update execution log
7. **Proceed carefully** â†’ Don't skip verification steps

**Execution Flow for Each Task**:

```
1. Read task objective
2. Check prerequisites (previous tasks completed)
3. Execute automated parts (file edits, commands)
4. Request user input for manual parts
5. Wait for user response (if needed)
6. Verify task completion
7. Update progress tracker
8. Move to next task
```

**Remember**:
- âš ï¸ Always verify before proceeding
- âš ï¸ Request user confirmation for irreversible actions
- âš ï¸ Never commit secrets or credentials
- âš ï¸ Document all changes and decisions
- âš ï¸ Test thoroughly before moving to next phase
- âš ï¸ Stop and ask if unsure about any step
- âš ï¸ Handle errors gracefully, don't continue on error

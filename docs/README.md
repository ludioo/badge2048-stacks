# badge2048 — Documentation Index

**Application:** badge2048

This folder contains specs, deployment guides, and conventions. The main product overview is in the root [README.md](../README.md).

---

## Documentation Structure

### Specs (game, badges, UI)

- **[BADGE-SYSTEM.md](./BADGE-SYSTEM.md)** — Badge tiers, rules, and display
- **[CLAIM-FLOW.md](./CLAIM-FLOW.md)** — Badge claim flow (local and on-chain)
- **[DATA-MODELS.md](./DATA-MODELS.md)** — Game state and badge state data models
- **[GAME-IMPLEMENTATION.md](./GAME-IMPLEMENTATION.md)** — Game implementation (reducer, deterministic, testable)
- **[GAME-MECHANICS.md](./GAME-MECHANICS.md)** — Core mechanics, input, state machine, spawn/merge logic
- **[UI-UX-SPEC.md](./UI-UX-SPEC.md)** — Visual design, motion, responsiveness

### Technical

- **[TECH-STACK.md](./TECH-STACK.md)** — Tech stack and folder structure
- **[MVP-SCOPE.md](./MVP-SCOPE.md)** — Features included in MVP
- **[ONCHAIN_STACKS_BADGE2048.md](./ONCHAIN_STACKS_BADGE2048.md)** — On-chain contract and Stacks integration
- **[PERFORMANCE-BASELINE.md](./PERFORMANCE-BASELINE.md)** — Baseline performance per page

### Deployment and operations

- **[TESTNET-TO-MAINNET-MIGRATION-PLAN.md](./TESTNET-TO-MAINNET-MIGRATION-PLAN.md)** — Testnet → mainnet migration (phases, checklists, verification)
- **[VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md)** — Vercel deployment (build command, env, troubleshooting)
- **[MONITORING.md](./MONITORING.md)** — Health check, error monitoring, analytics, maintenance routine

### Future

- **[FUTURE-SCOPE.md](./FUTURE-SCOPE.md)** — Features and enhancements for later

### Conventions (rules)

All project and coding rules live under **[docs/rules/](./rules/)**:

- [ai-rules.md](./rules/ai-rules.md)
- [backend-rules.md](./rules/backend-rules.md)
- [frontend-rules.md](./rules/frontend-rules.md)
- [onchain-rules.md](./rules/onchain-rules.md)
- [repo-rules.md](./rules/repo-rules.md)
- [stacks-rules.md](./rules/stacks-rules.md)
- [testing-rules.md](./rules/testing-rules.md)

See the root README [Contributing](../README.md#contributing) section for branch/commit/PR conventions and links to these rules.

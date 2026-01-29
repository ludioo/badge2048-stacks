## Stacks Rules (Clarity & Integration)

Opinionated guidelines for Stacks smart contracts (Clarity) and their interaction with frontend and backend components.

---

## 1. Clarity Smart Contract Best Practices

- **Readability first**
  - Contracts must be easy to read: consistent layout, clear naming, and minimal nesting.
  - Prefer small, focused functions with single responsibilities.
  - Comment **why** complex rules exist, not what each line does.

- **Explicit invariants**
  - Model core invariants explicitly:
    - “A badge can only be claimed once per principal.”
    - “Only the admin can update config.”
  - Enforce invariants in a single, well-documented place.

- **Deterministic behavior**
  - Avoid any pattern that could lead to ambiguous or order-dependent outcomes without explicit rules.
  - Use clear state machines for multi-step flows where needed.

- **Gas/fee awareness**
  - Design for low-cost calls:
    - Avoid unbounded loops; operate on constant or bounded-size data per transaction.
    - Prefer read-only queries for UI where possible.

---

## 2. Contract Structure and Naming

- **File and contract naming**
  - Use `kebab-case` for contract files:
    - `badge-2048.clar`
    - `leaderboard-2048.clar`
  - Contract names should be descriptive and versioned when necessary:
    - `badge-2048-v1`, `badge-2048-v2`.

- **Module layout**
  - Group related definitions:
    - Constants and config at the top.
    - Data maps and variables.
    - Public functions.
    - Read-only functions.
    - Internal helpers.
  - Keep public API surface minimal and intentional.

- **Naming conventions**
  - Use `snake_case` for variables and functions.
  - Use prefixes/suffixes consistently:
    - `get-...`, `set-...`, `claim-...`, `update-...`.
  - Error codes and constants should be clearly named by domain (`ERR-NOT-AUTHORIZED`, `ERR-ALREADY-CLAIMED`).

---

## 3. Read-Only vs Public Functions

- **Read-only functions**
  - Use `read-only` functions for:
    - Queries required by the UI (ownership, eligibility, config).
    - Aggregate views that are safe to recompute and don’t mutate state.
  - Prefer:
    - `get-badge-state`, `get-config`, `get-player-summary`.

- **Public (state-mutating) functions**
  - Use `public` functions for actions that:
    - Change ownership, claim rewards, update config.
  - Each public function should:
    - Validate caller permissions,
    - Enforce invariants,
    - Emit events where useful for indexing.

- **Design principle**
  - Keep read-only and write flows clearly separated.
  - Avoid hidden state writes in functions that appear to be pure from their name.

---

## 4. Error Codes and Response Standards

- **Error codes**
  - Use clearly named error constants:
    - `ERR-NOT-AUTHORIZED`
    - `ERR-ALREADY-CLAIMED`
    - `ERR-NOT-ELIGIBLE`
    - `ERR-INVALID-PARAMS`
  - Document error codes and meanings in `docs/` and/or contract comments.

- **Return values**
  - For successful calls, return:
    - Minimal but sufficient data (e.g., token ID, new state flags).
  - Do not expose internal implementation details unnecessarily.

- **Frontend/backend mapping**
  - Map Clarity error codes to:
    - Backend `error.code` equivalents,
    - Friendly frontend messages.
  - Maintain a single mapping table in the backend or shared lib to avoid drift.

---

## 5. Interaction Patterns with Frontend/Backend

- **Responsibilities**
  - **Contract**:
    - Enforce rules and invariants,
    - Define ownership and rights.
  - **Backend**:
    - Provide stable HTTP APIs to query contract state (via indexers/nodes),
    - Perform indexing, caching, and rate limiting,
    - Map contract errors to HTTP responses.
  - **Frontend**:
    - Initiate transactions via wallet integrations,
    - Poll transaction status (through backend/standard endpoints),
    - Render state based on backend-provided views.

- **Read patterns**
  - Prefer:
    - Backend proxy endpoints for read state (`/api/badge-ownership`, `/api/game-state`),
    - Read-only Clarity calls centralized in backend integration modules.
  - Avoid:
    - Direct browser ↔ node calls for production flows, except for wallet transaction submission.

- **Write patterns**
  - Frontend sends signed transactions from the user’s wallet.
  - Backend does **not** sign on behalf of users; it may sign with server keys only for explicitly server-owned operations.
  - Transaction lifecycle:
    1. Frontend composes and broadcasts tx.
    2. Frontend/Backend monitors tx status via indexer.
    3. After confirmation, backend refreshes derived views (e.g., badge ownership API).

---

## 6. Testnet and Mainnet Considerations

- **Network configuration**
  - All contract addresses and network URLs must be:
    - Centralized in config,
    - Explicitly distinguished per environment (local/testnet/mainnet).
  - Never hardcode addresses in random frontend components.

- **Deployment discipline**
  - For each deployment:
    - Record contract address, deployer, and network in `docs/`.
    - Tag code with the contract version (comments or config constants).
  - Use testnet as a dress rehearsal for mainnet:
    - Run the same flows,
    - Use the same APIs and indexing strategies.

- **Migration**
  - When evolving contracts:
    - Maintain compatibility layers in backend APIs when possible.
    - Clearly document cutover points and any one-time migrations.

---

## 7. Do & Don’t Examples

- **Do: Keep contracts small and focused**
  - **Do** split unrelated concerns into separate contracts:
    - `badge-2048` vs `leaderboard-2048`.
  - **Don’t** cram multiple domains into a single, sprawling contract.

- **Do: Use read-only functions for UI**
  - **Do** expose state views tailored for typical UI needs via `read-only` functions.
  - **Don’t** force the frontend/backend to reconstruct state from many low-level reads if a clear aggregate query can exist.

- **Do: Align with backend APIs**
  - **Do** design read-only functions that map naturally to backend endpoints.
  - **Don’t** expose a contract surface that is awkward to consume in HTTP APIs without good reason.

- **Do: Make error handling first-class**
  - **Do** design with explicit error codes and document them.
  - **Don’t** rely on generic or ambiguous errors that must be reverse-engineered by the backend/frontend.


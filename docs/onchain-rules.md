## Onchain Rules (General)

Rules for deciding what logic lives on-chain vs off-chain, with a focus on safety, determinism, and gas/fee efficiency across future projects.

---

## 1. What Logic Must Be On-Chain vs Off-Chain

- **On-chain only (must live on-chain)**
  - Rules that **directly affect ownership, balances, or irreversible state**:
    - Token mint/burn/transfer.
    - Badge or achievement ownership and revocation.
    - Game results that gate on-chain rewards (if they must be trustless).
  - Authorization and permissions that secure on-chain assets:
    - Admin roles and access control.
    - Allowlists / deny-lists that protect minting or special rights.
  - Conditions that should be **provable to any third party** without trusting a server.

- **Prefer off-chain (must not be on-chain if avoidable)**
  - Heavy computation, long loops, or complex searching.
  - High-frequency updates that do not need global consensus:
    - In-game intermediate states,
    - UI-only progress,
    - Analytics and telemetry.
  - Flexible rules that are expected to change often (AB tests, feature flags).

- **Hybrid patterns**
  - Store **minimal facts** on-chain (e.g., “badge earned”, “final score hash”).
  - Keep **derivable/auxiliary data** off-chain:
    - Leaderboards (can be recomputed from final scores or events).
    - Historical logs that exceed what is needed for correctness.

---

## 2. Gas / Fee Efficiency Principles

- **Minimize writes**
  - Writes (state changes) are the most expensive operations.
  - Combine related updates into a single transaction when feasible.
  - Avoid storing redundant data that can be recomputed from existing state or events.

- **Data packing**
  - Use compact types and representations where safe.
  - Keep state structs lean; avoid storing large strings, unbounded vectors, or arbitrary blobs.

- **Call patterns**
  - Prefer read-only calls for UI/state sync where possible.
  - Avoid repeated on-chain calls from the frontend; use backend/indexed data where canonical state doesn’t strictly require direct node reads.

- **Avoid unbounded growth**
  - Design data structures to prevent unbounded loops over user-generated data during critical operations.
  - If unbounded structures are necessary, ensure heavy operations happen off-chain.

---

## 3. Deterministic Behavior Requirements

- **Determinism first**
  - All on-chain computations must be fully deterministic:
    - No reliance on wall-clock time beyond block metadata when allowed.
    - No randomness without a verifiable source.
  - Avoid patterns where outcomes depend on transaction ordering outside explicit rules.

- **Explicit state machines**
  - For non-trivial flows (e.g., multi-step claims), model explicit states:
    - `uninitialized → pending → completed → cancelled` etc.
  - Enforce allowed transitions in a single place in the contract logic.

- **Idempotence where possible**
  - Critical operations should either:
    - Reject duplicates safely, or
    - Become no-ops if repeated.
  - This simplifies retry logic from backend/frontend.

---

## 4. Upgradeability Philosophy

- **Bias toward immutability**
  - Default: deploy contracts as immutable once audited and live on mainnet.
  - Use configuration parameters for tunable values (e.g., URIs, thresholds) instead of redeploying contracts frequently.

- **Upgrade levers**
  - If upgradability is required, use **explicit mechanisms**:
    - Admin-controlled config functions with strict access control.
    - Proxy patterns or registry contracts that point to current implementations (only if the platform and tooling justify it).
  - Clearly separate:
    - What is upgradeable (config, parameters, certain logic paths),
    - What is guaranteed immutable (core invariants).

- **Migration strategy**
  - When deploying v2/v3 contracts:
    - Provide migration paths where possible (e.g., snapshot & remint, mapping tables).
    - Document upgrade reasons and user-facing implications in `docs/`.

---

## 5. Security Assumptions

- **Threat model**
  - Assume:
    - Arbitrary users can call public functions in any order.
    - Frontend/backends are untrusted from the contract’s perspective.
    - Any data stored off-chain may be tampered with or unavailable.

- **Access control**
  - Keep admin / privileged roles minimal and explicit.
  - Define who can:
    - Mint / burn assets,
    - Change parameters,
    - Pause critical functionality (if any).
  - Protect against:
    - Unintended escalations (e.g., admin features callable by any address).

- **Consistency with off-chain components**
  - Contracts must not rely on off-chain data remaining consistent unless:
    - That data is supplied per-transaction and validated, or
    - It is cryptographically verifiable (signatures, Merkle proofs, etc.).

- **Fail-safe defaults**
  - Fail closed rather than open:
    - If invariants are violated, revert rather than “best-effort” execution.
    - Require explicit configuration for critical features rather than enabling by default.

---

## 6. Common Anti-Patterns

- **Over-onchain-ization**
  - Storing full gameplay or full histories on-chain when:
    - Only final outcomes or key checkpoints are needed.
  - Using on-chain storage as a general-purpose database.

- **Implicit trust in caller**
  - Assuming the caller is honest or is always a known backend.
  - Not validating input ranges or relationships (e.g., negative amounts, invalid IDs).

- **Unbounded loops**
  - Iterating over all users, badges, or scores in a single transaction.
  - Accepting arrays of arbitrary length without bounds or checks.

- **Hidden coupling**
  - Relying on undocumented off-chain invariants to keep on-chain state safe.
  - Encoding brittle assumptions about frontend flow into contract behavior.

---

## 7. Do & Don’t Examples

- **Do: Minimize on-chain surface**
  - **Do** store:
    - Ownership,
    - Finalized results that unlock rights,
    - Config parameters critical to fairness.
  - **Don’t** store:
    - Every move in a game,
    - Debug or analytics data,
    - Frequently changing counters that can be aggregated off-chain.

- **Do: Design for indexing**
  - **Do** emit events/logs that make indexing easy:
    - `badge-claimed`, `game-finished`, etc.
  - **Don’t** rely on scanning all state to reconstruct basic information if events can express it cheaply.

- **Do: Make invariants obvious**
  - **Do** centralize checks (e.g., “badge can only be claimed once”).
  - **Don’t** spread invariant enforcement across unrelated functions.

- **Do: Keep upgrade hooks explicit**
  - **Do** guard admin/config functions with clear roles and reasoned bounds.
  - **Don’t** leave backdoors or undocumented switches that can change behavior unpredictably.


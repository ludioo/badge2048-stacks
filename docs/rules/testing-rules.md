## Testing Rules (FE, BE, Onchain)

Opinionated testing philosophy and conventions for frontend, backend, and onchain components.

---

## 1. Testing Philosophy

- **Goal**
  - Catch regressions early, document behavior, and make refactors safe.
  - Prefer targeted, fast tests over slow, brittle ones.

- **Balance**
  - Unit tests for core logic.
  - Integration tests for critical boundaries.
  - E2E tests for the most important user journeys.
  - Manual testing documented in `docs/` for complex, cross-system scenarios.

---

## 2. Frontend Testing

- **Unit/component tests**
  - Focus on:
    - Pure logic in hooks and utilities,
    - Component behavior (conditional rendering, state transitions).
  - Test:
    - Edge cases for state machines (idle/loading/success/error),
    - Disabled states, spinners, and error messages.

- **Integration tests (FE)**
  - Test interactions between components and hooks:
    - Claim flows,
    - Badge visibility changes,
    - Wallet connect/disconnect behavior.
  - Mock backend APIs and onchain calls at the boundary.

- **E2E (UI-focused)**
  - Use Playwright or similar:
    - Connect wallet (test harness),
    - Play game until a badge is unlockable,
    - Claim badge and confirm on UI.
  - Keep E2E suite small and high-value.

---

## 3. Backend Testing

- **Unit tests**
  - Target domain logic and services in `lib/` or `services/`:
    - Validation,
    - Aggregation,
    - Mapping onchain/third-party responses into our domain models.

- **Integration/API tests**
  - For key endpoints:
    - Badge ownership,
    - Game state,
    - Any write endpoints that change critical state.
  - Verify:
    - HTTP status codes,
    - `data`/`error` shapes,
    - Edge-case handling (invalid input, not-found, already-claimed).

- **Contract tests with onchain**
  - Ensure backend assumptions about contracts remain valid:
    - Function signatures and parameter types,
    - Error codes and semantics,
    - Event/log formats.

---

## 4. Onchain Testing

- **Unit-like tests (Clarity)**
  - Test:
    - Happy-path flows (claim once, config updates).
    - Invariants (no double claims, only admin can modify config).
    - Boundary conditions (first/last items, empty configs, max limits).

- **Integration with off-chain components**
  - Use testnet or local devnet to:
    - Validate full transaction flows,
    - Confirm event emissions,
    - Ensure indexers/clients can read the needed data.

- **Regression tests for bugs**
  - When an onchain-related bug is discovered:
    - Add a test that reproduces the bug,
    - Ensure it fails before the fix, passes after.

---

## 5. Test Data and Environments

- **Fixtures**
  - Prefer explicitly named fixtures over ad-hoc inline values:
    - `testWalletEligible`, `testWalletIneligible`, etc.
  - Keep fixture data close to the tests that use them.

- **Env separation**
  - Tests must not depend on production resources.
  - Use:
    - Local devnets,
    - Testnet with dedicated keys,
    - Mocked services for isolated unit tests.

---

## 6. Do & Don’t Examples

- **Do: Test behavior, not implementation details**
  - **Do** assert on:
    - Rendered UI states and outputs,
    - HTTP responses and side effects.
  - **Don’t** over-assert internal function calls or specific hook usage unless critical.

- **Do: Prefer smaller, targeted tests**
  - **Do** write several small, focused tests for each edge case.
  - **Don’t** rely on one huge test per module that tries to cover everything.

- **Do: Keep E2E lean**
  - **Do** use E2E for:
    - High-value flows (claiming, game completion, wallet connect).
  - **Don’t** use E2E as a crutch for missing unit/integration tests.

- **Do: Update tests with behavior**
  - **Do** keep tests in sync with intentional behavior changes.
  - **Don’t** simply delete failing tests to make the suite green without understanding why they fail.


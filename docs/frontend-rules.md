## Frontend Rules

Opinionated guidelines for React/Next.js frontends in small, high-skill teams. These rules prioritize clarity, predictable behavior, and seamless collaboration with AI tools.

---

## 1. Project Structure Conventions

- **Top-level layout**
  - `app/`: Routing, layouts, pages, route handlers.
  - `components/`: Reusable UI building blocks (no routing logic).
  - `lib/`: Pure logic, helpers, domain modules (no JSX).
  - `hooks/`: Reusable React hooks (UI-agnostic if possible).
  - `styles/`: Global styles, design tokens (if not colocated).
  - `e2e/`, `tests/`: E2E and unit/integration tests.

- **Components folder structure**
  - **Feature-first** over type-first:
    - `components/badge/*`
    - `components/game/*`
    - `components/wallet/*`
  - Within a feature folder:
    - `FeatureRoot.tsx` – main container for the feature.
    - `FeatureSection*.tsx` – subsections/large blocks.
    - `FeatureCard*.tsx` – small reusable blocks.
  - Do not create `atoms/molecules/organisms` unless there is a strong need; favor feature folders.

- **Lib folder structure**
  - Group by domain, not by technical type:
    - `lib/game/*`
    - `lib/badges/*` or `lib/badges.ts`
    - `lib/stacks/*` for onchain-related client helpers.
  - Keep `lib` modules **framework-agnostic**: no React imports.
  - If a lib file starts importing React, move that logic into a `hooks/` or `components/` file.

- **Routes and pages**
  - Route-specific components live under `app/...` when they are **page shell** level.
  - Complex UI that is reusable across routes lives in `components/feature/`.
  - Avoid deeply nested directories unless strongly justified; prioritize discoverability.

---

## 2. UI/UX Principles

- **Clarity over cleverness**
  - Every screen should answer: “What can I do here?” and “What is the current state?”
  - Prefer explicit labels over icons-only UIs unless the meaning is universal.

- **Deterministic interactions**
  - Button actions should be clearly mapped to state changes and network calls.
  - Avoid hidden side effects; if something “magical” happens, show it in the UI.

- **Progress and feedback**
  - Show loading / pending state for any action that might take >150ms.
  - On success, show clear confirmation (toast, badge state change, etc.).
  - On failure, show a user-friendly error and a recommended next step.

- **Minimal cognitive load**
  - Group related actions visually.
  - Use consistent placement for destructive actions and primary CTAs.
  - Keep forms short; break multi-step flows into logical segments.

---

## 3. State Management Rules

- **State location**
  - Prefer **local component state** for view-only concerns (open/closed, hovered, selected).
  - Use **React Context or dedicated stores** only when:
    - Multiple distant components need the same state, and
    - Passing props becomes noisy or brittle.

- **Derived vs source of truth**
  - Keep a **single source of truth** per concern:
    - Game state, wallet state, badge state, feature flags, etc.
  - Derived values must be computed functions/selectors, not re-stored copies.

- **Server vs client state**
  - Use `fetch` + React/Next data fetching for **server state** (API responses).
  - Cache at the **boundary** (hooks around `fetch` or SWR/React Query) if needed.
  - Do not manually reinvent polling or caching if a standard pattern solves it cleanly.

- **State shape**
  - Use typed, explicit models (`types.ts`) for complex state.
  - Prefer **flat structures** with IDs over deeply nested trees.
  - Use **enums / union types** for status fields instead of free-form strings.

---

## 4. API Consumption Patterns

- **Single responsibility per layer**
  - `lib/*Client.ts` files own the details of API requests (URLs, query params, parsing).
  - Components and hooks call these client functions and receive typed data.
  - Avoid sprinkling raw `fetch` calls directly in deeply nested components.

- **Error and response shape**
  - API client functions should:
    - Throw errors with useful messages (for UI to display or log).
    - Return well-typed objects with clear `data` or `value` semantics.
  - If API responses are inconsistent, normalize them in `lib/*Client.ts`, not in components.

- **Backend proxy principle**
  - All blockchain / third-party reads go through a **backend proxy** (Next.js API or BE service), not directly from the browser.
  - Frontend code must depend on our own, stable contracts:
    - `GET /api/...` with clearly documented query and response shape.

---

## 5. Error Handling and Loading States

- **Error handling**
  - Catch at the **closest meaningful boundary**:
    - UI component → show user-friendly error text.
    - Hook or client → normalize to typed error object/message.
  - Prefer explicit error models (`{ code, message, details? }`) for predictable handling.
  - Log unexpected errors once (console or logging service) with context.

- **Loading states**
  - Always represent loading as an explicit state field:
    - `idle | loading | success | error` or a boolean plus an error field.
  - For button-triggered actions:
    - Disable the button while pending.
    - Show a spinner or “Saving…/Claiming…” label.
  - For full-page loads:
    - Show skeletons or a centered loader, not a blank screen.

---

## 6. Naming Conventions

- **Files and folders**
  - Components: `PascalCase.tsx` (e.g., `ClaimGrid.tsx`, `BadgesGrid.tsx`).
  - Hooks: `useSomething.ts` in `hooks/` (e.g., `useWalletState.ts`).
  - Lib: `kebab-case.ts` or domain-based (`gameState.ts`, `badges.ts`).
  - Tests: mirror the target file name with `.test.ts[x]`.

- **Components and props**
  - Components: `FeatureRole` (e.g., `BadgeClaimDialog`, `GameBoard`).
  - Props: use concrete, domain names (`badge`, `tier`, `walletAddress`) instead of generic (`item`, `data`).
  - Event handlers: `handleX`, `onX` (e.g., `handleConfirmClaim`, `onConfirm`).

- **State variables**
  - Booleans: `isX`, `hasX`, `shouldX` (e.g., `isLoading`, `hasError`).
  - Async: `isLoading`, `error`, `data` or `result`.
  - Collections: plural nouns (`badges`, `tiers`).

- **Types and interfaces**
  - Use `PascalCase` nouns (`Badge`, `BadgeTier`, `GameState`).
  - Export shared types from `lib/.../types.ts`.

---

## 7. Performance and Optimization Guidelines

- **Default stance**
  - Write **clear code first**, then optimize with measurements.
  - Avoid premature micro-optimizations; focus on reducing unnecessary recomputation and rerenders.

- **Rerender control**
  - Break large components into smaller, memoizable pieces when:
    - Local state is noisy, or
    - Rerenders are triggered by frequently changing props.
  - Use `React.memo`, `useMemo`, and `useCallback` only with clear benefit.

- **Data fetching and caching**
  - Share requests when reasonable (e.g., a single `fetchBadgeOwnership` used by multiple components).
  - Avoid repetitive calls on every small UI change; tie calls to clear triggers (mount, explicit refresh, important state changes).

- **Lists and rendering**
  - Always supply stable `key` props (IDs, not array indices) for dynamic lists.
  - For potentially large lists, consider virtualization before list size becomes a problem.

---

## 8. Do & Don’t Examples

- **Do: Use domain-specific helpers**
  - Centralize API and onchain reads in `lib/*Client.ts` and domain modules.
  - Keep components focused on rendering and orchestrating user flows.

- **Don’t: Mix concerns in components**
  - Avoid components that both:
    - Manage complex async flows, and
    - Contain large JSX trees, and
    - Contain domain logic.
  - Instead, extract:
    - Hooks for async + state,
    - Lib functions for domain logic,
    - Components for pure UI.

- **Do: Prefer predictable state machines**
  - Model flows as explicit state transitions where useful (`idle → checking → readyToClaim → claiming → claimed`).
  - This makes code easier to reason about for both humans and AI tools.

- **Don’t: Hide network calls**
  - Don’t perform network calls in random `useEffect` hooks without clear dependency arrays and comments.
  - Network calls must be:
    - Tied to clear lifecycle events (mount, address change),
    - Or explicit user actions (button click).

- **Do: Comment intent, not the obvious**
  - Add brief comments for:
    - Non-trivial decisions,
    - Edge-case handling,
    - Known trade-offs.
  - Do not comment trivial code or restate what the line already says.

- **Don’t: Invent new patterns casually**
  - When adding new features, **reuse existing patterns** (e.g., how loading/error is handled in `ClaimGrid` / `BadgesGrid`).
  - If a new pattern is necessary, document it in `docs/` or inline with clear comments.


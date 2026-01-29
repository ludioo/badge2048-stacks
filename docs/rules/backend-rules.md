## Backend Rules

Opinionated guidelines for backend/API layers that serve React/Next.js frontends and onchain systems. These rules aim for predictable contracts, easy observability, and safe evolution.

---

## 1. Folder and Module Structure

- **Separation of concerns**
  - `api/` or `app/api/`: HTTP endpoints and request/response wiring.
  - `services/`: Business logic (orchestrating multiple modules).
  - `lib/` / `core/`: Pure domain logic, validation, and utilities.
  - `integrations/`: Third-party APIs (blockchain nodes, explorers, payment providers).
  - `config/`: Environment configuration and typed settings.

- **Endpoint modules**
  - Each endpoint file should:
    - Do input parsing and validation,
    - Call a service or domain function,
    - Map domain errors to HTTP responses.
  - No business logic or ad-hoc SQL/chain-calls directly in route handlers.

- **Service modules**
  - Services combine multiple domain operations:
    - Read from DB / cache / chain,
    - Call integrations,
    - Coordinate workflows.
  - Services must remain UI-agnostic (no React, no direct coupling to frontend components).

---

## 2. API Design Standards

- **General**
  - Prefer **resource-oriented REST** for standard CRUD-like resources.
  - Use **RPC-style routes** for domain operations that don’t map cleanly to resources (e.g., `/api/claim-badge`).
  - For GraphQL (if introduced), apply the same principles: thin resolvers → services → domain logic.

- **Endpoints**
  - Use verb-less, noun-based paths for resources:
    - `GET /api/badge-ownership`
    - `POST /api/game-session`
  - Use query params for filters, pagination, sorting.
  - Use request bodies for complex inputs (JSON).

- **Response format**
  - Standard success shape:
    - `{ "data": <payload> }`
  - Standard error shape:
    - `{ "error": { "code": "SOME_CODE", "message": "Human-readable", "details"?: any } }`
  - Do not return raw third-party responses to clients; normalize them.

- **Versioning**
  - Keep breaking changes behind:
    - New endpoints (`/api/v2/...`),
    - Or new fields with feature flags that are backwards compatible.
  - Document any non-obvious API decision in `docs/`.

---

## 3. Validation and Error Handling

- **Input validation**
  - Validate all external inputs at the boundary:
    - HTTP requests, webhooks, cron triggers, queue messages.
  - Use schema-based validation (e.g., Zod/Yup) where feasible.
  - Reject invalid data early with `4xx` status codes.

- **Error modeling**
  - Use structured domain errors:
    - `BadRequestError`
    - `UnauthorizedError`
    - `NotFoundError`
    - `ConflictError`
    - `RateLimitError`
    - `InternalError`
  - Map each domain error to:
    - HTTP status,
    - A stable `error.code`,
    - A clear `error.message`.

- **Error propagation**
  - Do not leak internal stack traces or sensitive information to the client.
  - Log detailed error context server-side.
  - Frontend should only get the information necessary to render a useful message.

---

## 4. Logging and Observability

- **What to log**
  - Incoming requests at a reasonable granularity (method, path, key params).
  - Important domain events (badge claimed, game completed, wallet connected).
  - Warnings and errors with enough context to debug:
    - Error name, message, code,
    - User/wallet identifiers (hashed if necessary),
    - Correlation IDs for multi-step flows.

- **How to log**
  - Prefer structured logging (JSON-like) for easier parsing:
    - `{ level, message, context }`.
  - Use log levels consistently:
    - `debug` – detailed internal info.
    - `info` – normal operations and events.
    - `warn` – unusual but non-fatal conditions.
    - `error` – failed operations.

- **Tracing and metrics (if available)**
  - Emit timings for:
    - Calls to onchain nodes/explorers,
    - Calls to data stores,
    - End-to-end request latency.
  - Track error rates per endpoint and integration.

---

## 5. Security Best Practices

- **Principle of least privilege**
  - Restrict API keys / credentials to minimal scopes.
  - Avoid giving long-lived keys to frontend; backend acts as gatekeeper.

- **Input safety**
  - Treat all external input as untrusted.
  - Enforce strict validation and sanitization for:
    - Addresses, IDs, enum-like fields,
    - Pagination inputs,
    - Free-form text (if any).

- **Authentication and authorization**
  - Centralize auth logic:
    - Middlewares/guards for session/token checks,
    - Reusable helpers for permission checks.
  - Never trust client-side flags (e.g., “isAdmin” from the frontend).

- **Secrets management**
  - Never commit secrets to the repo (even in comments or tests).
  - Use environment variables or a secret manager.
  - Document required env vars in `docs/` or `.env.example`.

- **Onchain-specific**
  - Backend should never be able to sign user-owned private keys.
  - Backend may hold **service keys** explicitly scoped to its role (e.g., server-only mints, indexing).

---

## 6. Environment Configuration Rules

- **Configuration structure**
  - Centralize config in modules like `config/index.ts`:
    - Read from `process.env`,
    - Validate and coerce types,
    - Export typed config objects.
  - Fail fast on startup if a required configuration is missing or invalid.

- **Environment separation**
  - Clearly distinguish:
    - Local development,
    - Testnet / staging,
    - Mainnet / production.
  - Use explicit variables:
    - `STACKS_NETWORK=mainnet|testnet|devnet`
    - `API_BASE_URL`, `EXPLORER_URL`, etc.
  - Do not branch on `NODE_ENV` for domain behavior; instead use domain-specific flags in config.

- **Reproducibility**
  - Maintain `.env.example` with:
    - All required keys (sanitized),
    - Brief comments per key.
  - Do not hardcode network URLs or contract addresses in random files; always fetch from config.

---

## 7. Testing Strategy

- **Unit tests**
  - For pure functions in `lib/` and domain modules:
    - Cover core business rules and edge cases.
  - Mock integrations (network, DB, chain) at the boundary.

- **Integration tests**
  - For service modules and API handlers:
    - Use in-memory or test-specific infrastructure where possible.
    - Verify full request → validation → service → response path.

- **Contract tests**
  - For onchain integrations:
    - Fix expectations around:
      - Contract interfaces (function names, argument types).
      - Response shapes (events, return values).
  - Ensure that changes to contracts or network configuration are picked up here.

- **End-to-end tests**
  - Keep E2E focused on:
    - Critical user flows (claim badge, complete game, connect wallet).
  - Avoid over-testing through E2E; rely on unit/integration where more precise.

---

## 8. Do & Don’t Examples

- **Do: Keep endpoints thin**
  - Route handlers should read like:
    1. Parse and validate request,
    2. Call a service,
    3. Map result to HTTP response.

- **Don’t: Embed complex logic in handlers**
  - Avoid multi-step orchestration, loops, or conditional trees directly in route files.
  - Extract them into domain or service modules where they can be tested.

- **Do: Normalize external APIs**
  - Wrap third-party APIs (Hiro, indexers, etc.) behind `integrations/` or `lib/stacks/*`:
    - Normalize response shape,
    - Centralize error handling and retries.

- **Don’t: Couple backend to specific frontend views**
  - Do not shape responses around specific pages or components.
  - Backend exposes domain data and operations; frontend is responsible for presentation.

- **Do: Document non-trivial behavior**
  - When behavior in an endpoint is non-obvious (e.g., rate-limit workarounds, retries), document:
    - In comments in the module, and
    - In `docs/` when it affects multiple features.

- **Don’t: Introduce new patterns silently**
  - Before adding a new architectural pattern (message queues, event sourcing, custom schedulers):
    - Write a brief spec in `docs/`,
    - Justify why existing patterns are insufficient.


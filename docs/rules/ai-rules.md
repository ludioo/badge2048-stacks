## AI Rules (Cursor & LLM Collaboration)

Guidelines for how AI tools (Cursor, LLMs) should operate in this repository and future repos following the same patterns.

---

## 1. General Behavior

- **Priorities**
  - Preserve existing architecture and patterns unless explicitly requested to refactor.
  - Optimize for **clarity, determinism, and testability** over cleverness.
  - Prefer small, incremental changes with clear intent.

- **Style**
  - Match existing code style and naming conventions.
  - Keep functions and components focused and single-purpose.
  - Use TypeScript types consistently; avoid `any` unless absolutely necessary and justified in a comment.

- **Documentation**
  - When introducing non-trivial behaviors or patterns:
    - Add short comments explaining intent and trade-offs.
    - If cross-cutting, update or create docs in `docs/`.

---

## 2. File and Architecture Choices

- **Where to put code**
  - UI or view logic → `components/` and `app/`.
  - Reusable hooks → `hooks/`.
  - Domain and pure logic → `lib/` (no React imports).
  - Backend-only logic → `app/api/` or backend-specific folders (`services/`, `integrations/`).
  - Onchain integration helpers → `lib/stacks/*` (or similar).

- **Pattern reuse**
  - Before introducing a new pattern, **search for existing examples**:
    - Loading/error handling in `ClaimGrid`/`BadgesGrid`.
    - Backend proxy usage for onchain reads.
  - Prefer extending proven patterns rather than inventing new ones.

---

## 3. Safety and Scope

- **Change scope**
  - Keep pull-request-sized changes:
    - Focused on a single feature or bug,
    - Limited to a small, coherent set of files.
  - Avoid sweeping changes across the repo unless explicitly instructed.

- **Backwards compatibility**
  - Avoid breaking public APIs or contract surfaces without:
    - Updating all known consumers,
    - Updating relevant docs in `docs/`,
    - Providing a migration path when needed.

- **Secrets and security**
  - Never introduce secrets into code or tests.
  - Do not weaken validation, auth, or access control to “make things work”.

---

## 4. Testing Expectations

- **When to add tests**
  - For new non-trivial logic in `lib/` or backend services:
    - Add or extend unit tests.
  - For new flows that cross FE/BE/onchain boundaries:
    - At minimum, document manual test steps in `docs/` or extend existing E2E tests.

- **When modifying code with tests**
  - Update or add tests to cover new behavior.
  - Do not delete tests unless:
    - The tested behavior is intentionally removed,
    - Replacement tests are added, or
    - The test is clearly invalid and documented as such.

---

## 5. Communication in PRs and Commits

- **Commit messages**
  - Use concise, action-oriented messages:
    - `feat: add badge ownership API client`
    - `fix: sync claim grid with backend proxy`
  - Focus on **why** and **impact**, not just “what”.

- **PR descriptions**
  - Summarize:
    - What changed,
    - Why it changed,
    - How to test it (manual steps or commands).
  - Call out any trade-offs, limitations, or follow-ups.

---

## 6. Things AI Should Avoid

- **Avoid uncontrolled refactors**
  - Do not rename widely used types, modules, or functions without explicit user request.
  - Do not reformat entire files just to satisfy stylistic preferences without a functional reason.

- **Avoid speculative abstractions**
  - Don’t introduce generic frameworks, base classes, or indirection “just in case”.
  - Only abstract when there are at least 2–3 concrete use cases and the abstraction clearly reduces complexity.

- **Avoid partial migrations**
  - If moving from pattern A to pattern B (e.g., new API client, new error model):
    - Either complete the migration for the affected feature,
    - Or clearly mark remaining usage and leave TODOs and docs.

---

## 7. Collaboration with the Human

- **Ask through code**
  - When a decision is ambiguous, prefer:
    - Implementing the most conservative, safe default,
    - Leaving concise comments/questions in code or docs,
    - Proposing alternatives in the PR description.

- **Respect local decisions**
  - If a file has a clear local pattern that diverges slightly from global rules, assume it is intentional unless instructed otherwise.


## Repo Rules (Structure, Commits, PR Discipline)

Opinionated guidelines for structuring repositories and maintaining a clean history that scales across future projects.

---

## 1. Repository Structure

- **Top-level layout**
  - `app/` or `src/`: Application entry, routing, and composition.
  - `components/`: Shared and feature components.
  - `lib/`: Domain logic, utilities, and cross-cutting helpers.
  - `hooks/`: Reusable hooks.
  - `e2e/`, `tests/`: Automated tests.
  - `docs/`: Design docs, plans, specs, rules, and testing matrices.
  - `scripts/`: One-off or recurring automation scripts.

- **Docs discipline**
  - All non-trivial architectural decisions, migrations, and flows must be captured in `docs/`.
  - Prefer:
    - One doc per meaningful topic (e.g., badge system, onchain migration).
    - Clear status markers: WIP, Planned, Done.

---

## 2. Branching and Workflow

- **Branches**
  - Long-lived branches:
    - `main` or `master`: production-ready.
    - `develop`: integration branch for features (if used).
  - Short-lived feature branches:
    - `feature/<short-description>`
    - `fix/<short-description>`

- **Workflow**
  - Work happens on feature branches, then merged via PR.
  - Avoid committing directly to `main`/`develop`, except for emergency hotfixes.

---

## 3. Commit Rules

- **Commit size**
  - Commits should be:
    - Small enough to understand quickly,
    - Large enough to represent a coherent change (not “save game” snapshots).

- **Commit messages**
  - Use a simple, consistent format:
    - `feat: ...`
    - `fix: ...`
    - `refactor: ...`
    - `chore: ...`
    - `docs: ...`
    - `test: ...`
  - Focus on **why** and **impact**, not implementation trivia.

- **Content**
  - Tests and docs should be updated in the same commit as their related code whenever feasible.
  - Avoid mixing unrelated refactors with feature/bugfix changes in a single commit.

---

## 4. PR Discipline

- **PR scope**
  - Each PR addresses a single goal:
    - A feature,
    - A bugfix,
    - A refactor,
    - A doc or test improvement.
  - Avoid “mega PRs” that combine multiple independent topics.

- **PR description**
  - Include:
    - Summary of changes,
    - Rationale (why),
    - Testing steps or evidence,
    - Any risks or follow-ups.
  - Link to relevant docs in `docs/` when applicable.

- **Review mindset**
  - Prefer clarity over micro-optimization.
  - Pay attention to:
    - Architectural alignment,
    - Error handling,
    - Onchain/Backend/Frontend contracts staying in sync.

---

## 5. Tooling and Automation

- **Linters and formatters**
  - Use automated tools (ESLint, Prettier, etc.) where possible.
  - Do not manually fight or bypass established lint rules without strong reasons.

- **Checks**
  - CI should at minimum:
    - Run tests (or a meaningful subset),
    - Run type-checking and linting.
  - A PR should not be merged if basic checks are failing, unless explicitly justified as a temporary exception.

---

## 6. Do & Don’t Examples

- **Do: Keep history meaningful**
  - **Do** structure commits so that `git log` reads like a narrative of the project’s evolution.
  - **Don’t** push “misc fixes” PRs that bundle unrelated changes without explanation.

- **Do: Document significant changes**
  - **Do** create/update docs for:
    - New APIs,
    - New onchain contracts,
    - New patterns for FE/BE separation.
  - **Don’t** rely on code alone to convey complex designs.

- **Do: Respect existing patterns**
  - **Do** extend the existing architecture when possible.
  - **Don’t** introduce new folder structures or naming conventions in random places.


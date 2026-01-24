# Tech Stack Specification

**Application Name:** badge2048

## Frontend Framework

### Core

* **Next.js** - React framework with App Router
* **React** - UI library
* **TypeScript** - Type safety (preferred)

### Styling

* **TailwindCSS** - Utility-first CSS framework
* **Framer Motion** (optional) - Animation library for smooth transitions

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home/landing
│   ├── play/
│   ├── claim/
│   └── badges/
├── components/             # React components
│   ├── game/
│   ├── badge/
│   └── ui/
├── lib/                    # Utility functions
│   └── game/              # Game logic (pure functions)
│       ├── types.ts
│       ├── reducer.ts
│       ├── slide.ts
│       ├── merge.ts
│       ├── spawn.ts
│       ├── checkGameOver.ts
│       ├── utils.ts
│       └── constants.ts
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Game Logic Location

All game logic in `/lib/game/`:
* Pure functions for reducer, merge, spawn, score, end-state
* No React dependencies
* Fully testable
* Deterministic

## State Management

* React `useState` / `useReducer` for component state (MVP)
* Local storage for badge persistence
* Future: May add Zustand or similar for global state if needed

## DApp Integration (Future)

* Chain: TBD (Base or Stacks)
* Wallet integration: Later phase
* On-chain minting: PRD v2

## Development Tools

* TypeScript for type safety
* ESLint for code quality
* Prettier for code formatting (optional)
* Testing framework (Jest/Vitest) for game logic

## Language & Content Guidelines

**IMPORTANT:** All user-facing content must be in English:
* All page content, UI text, and labels
* Error messages and user feedback
* Game instructions and help text
* Badge names, descriptions, and tier labels
* Navigation items and page titles
* Modal dialogs and confirmation messages

Code comments and documentation can be in any language, but all user-visible strings must be English.

## Build & Deploy

* Next.js build system
* Vercel deployment (recommended)
* Or any static hosting for static export

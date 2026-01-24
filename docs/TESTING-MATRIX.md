# Testing Matrix

This document defines the target testing environments for Phase 8.

## Target Environments

| Platform | Browser | Device | Status | Notes | Last Tested |
| --- | --- | --- | --- | --- | --- |
| Desktop | Chrome (latest) | Windows 11 | Pass (Playwright) | Chromium engine | 2026-01-24 |
| Desktop | Edge (latest) | Windows 11 | Pass (Chromium engine) | Not run in Edge channel | 2026-01-24 |
| Desktop | Firefox (latest) | Windows 11 | Pass (Playwright) | Gecko engine | 2026-01-24 |
| Desktop | Safari (latest) | macOS | Pass (Playwright) | WebKit engine | 2026-01-24 |
| Mobile | Safari (latest) | iPhone 13+ | Pass (Playwright) | Device emulation | 2026-01-24 |
| Mobile | Chrome (latest) | Android 13+ | Pass (Playwright) | Device emulation | 2026-01-24 |

## Critical User Flows

1. Home -> Play -> game over -> restart
2. Play -> unlock badge -> toast appears
3. Badges -> view status (owned/claimable/locked)
4. Claim -> claim badge -> success banner -> back to badges
5. Navigation across all pages (header + primary links)

## Manual Checklist

- Navigation links work on desktop and in the mobile menu
- Game input: keyboard, swipe, drag
- Game over modal appears and restart works
- Badge unlock and claim persist after refresh
- Empty state on the Claim page appears as expected

## Automation (Playwright)

Setup:
1. Install browsers once: `npx playwright install`
2. Run E2E: `npm run test:e2e`

Notes:
- Default config runs Chromium, Firefox, WebKit, and device emulation.
- Use `--project=chromium` for a faster single-browser run.
- E2E specs: `e2e/navigation.spec.ts`, `e2e/play.spec.ts`, `e2e/badges.spec.ts`, `e2e/badge-claim.spec.ts`

## Automation Status

- Last run: 2026-01-24 (local)
- Command: `npm run test:e2e`
- Result: 20/20 tests passed

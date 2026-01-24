# Performance Baseline

This document captures baseline performance metrics for Phase 8.

## Page Scope

- `/` (Home)
- `/play`
- `/badges`
- `/claim`

## How to Measure

1. Run the app locally:
   - `npm run dev`
2. Run Lighthouse (Chrome DevTools) on each page.
3. Record results in the baseline table.

Optional (build mode):
1. `npm run build`
2. `npm run start`
3. Run Lighthouse again in production mode.

## Baseline Metrics

| Page | LCP (ms) | INP (ms) | CLS | TBT (ms) | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | 5953 | n/a | 0 | 295 | Lighthouse (production build, 2026-01-24) |
| `/play` | 6671 | n/a | 0.028 | 486 | Lighthouse (production build, 2026-01-24) |
| `/badges` | 5953 | n/a | 0 | 311 | Lighthouse (production build, 2026-01-24) |
| `/claim` | 3235 | n/a | 0 | 208 | Lighthouse (production build, 2026-01-24) |

## Mobile Throttling Baseline

| Page | LCP (ms) | INP (ms) | CLS | TBT (ms) | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | 1820 | n/a | 0 | 34 | Lighthouse (production build, mobile, 2026-01-24) |
| `/play` | 3290 | n/a | 0 | 109 | Lighthouse (production build, mobile, 2026-01-24) |
| `/badges` | 2820 | n/a | 0 | 27 | Lighthouse (production build, mobile, 2026-01-24) |
| `/claim` | 2679 | n/a | 0 | 34 | Lighthouse (production build, mobile, 2026-01-24) |

## Mobile Throttling (Performance Preset)

| Page | LCP (ms) | INP (ms) | CLS | TBT (ms) | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | 1577 | n/a | 0 | 116 | Lighthouse (production build, mobile perf preset, 2026-01-24) |
| `/play` | 1894 | n/a | 0.028 | 148 | Lighthouse (production build, mobile perf preset, 2026-01-24) |
| `/badges` | 1692 | n/a | 0 | 95 | Lighthouse (production build, mobile perf preset, 2026-01-24) |
| `/claim` | 1595 | n/a | 0 | 90 | Lighthouse (production build, mobile perf preset, 2026-01-24) |

## Performance Budget (Target)

- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1
- TBT <= 200ms

## Findings

- Production baseline captured; `/play` shows minor CLS to monitor.
- Performance optimization accepted for MVP based on current scope.
- Mobile throttling baseline captured; no CLS detected in this run.
- Mobile perf preset captured; `/play` CLS remains minor.

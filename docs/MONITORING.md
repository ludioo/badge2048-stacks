# Monitoring & Maintenance (Phase 6.2)

Checklist and configuration steps for production (mainnet) monitoring. **You supply the tools and secrets**; this document is a configuration draft and checklist only.

---

## 1. Health check (already available)

### Endpoint

- **GET `/api/health`**
  - **200** — App OK; contract reachable (or contract not configured).
  - **503** — Contract unreachable (Hiro API error/timeout).

Example response body:
- `{ "status": "ok", "contract": "reachable", "network": "mainnet" }`
- `{ "status": "degraded", "contract": "unreachable", "network": "mainnet", "error": "..." }`

### How to use

- **Uptime Robot / Cronitor / Better Uptime**: Ping `https://<production-url>/api/health` every 5–15 minutes. Alert on HTTP 503 or timeout.
- **Vercel**: You can use Vercel Cron (if available) or an external service above.

**Checklist:**
- [ ] Register health check in Uptime Robot (or another service).
- [ ] Set alert (email/Slack) on 503 or down.
- [ ] (Optional) Manual verification: open `https://<production-url>/api/health` → expect 200 and `contract: "reachable"` when mainnet is configured.

---

## 2. Error monitoring (Sentry or alternative)

### Option A: Sentry (Next.js)

1. **Sign up and create a project** at [sentry.io](https://sentry.io) (optional: team/org).
2. **Install SDK** (you run):
   ```bash
   npm install @sentry/nextjs
   ```
3. **Run Sentry wizard** (for Next.js):
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
   The wizard will add config files and ask for DSN. Save the **DSN** for the next step.
4. **Set env** (you fill in):
   - In `.env.local` (dev) and in **Vercel → Project → Settings → Environment Variables** (production):
   - `NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...`
     - Or `SENTRY_DSN` if server-only (see Sentry Next.js docs).
   - Do not commit DSN to the repo if it is secret; for frontend Sentry the DSN is usually public (NEXT_PUBLIC_).
5. **Alerts**: In Sentry project → Alerts → create a rule (e.g. error count > 0 in 1 hour) → email/Slack notification.

**Checklist:**
- [ ] Sentry (or other tool) registered and project created.
- [ ] SDK installed and configured (wizard or manual) complete.
- [ ] Env `NEXT_PUBLIC_SENTRY_DSN` (or `SENTRY_DSN`) set in Vercel production.
- [ ] Alert for critical errors configured.
- [ ] Test: trigger an error in staging/production and confirm it appears in Sentry.

### Option B: Vercel Analytics / Log Drain

- **Vercel**: Project → Settings → Analytics / Logs. Errors and logs can be viewed in the dashboard; optionally set log drain to another service.
- **Checklist:** [ ] Check Vercel dashboard for errors/logs after deploy.

### Option C: Others (LogRocket, Datadog, etc.)

- Follow each tool’s documentation; same principle: use env for API key/DSN, do not commit secrets.

---

## 3. Analytics (optional)

- **Vercel Web Analytics**: Project → Settings → Analytics → enable (if desired).
- **Plausible / Umami / Google Analytics**: Add script or use env (e.g. `NEXT_PUBLIC_GA_ID`) and set in Vercel; do not commit secret API key/ID.
- **Checklist:** [ ] Choose tool; [ ] Set env in Vercel if needed; [ ] Verify events/views are recorded.

---

## 4. Maintenance routine

| Frequency | Task |
|-----------|------|
| **Daily** (or automated) | Health check `/api/health` — ensure alerts work; check on 503. |
| **Weekly** | Check errors in Sentry (or Vercel logs); review failed transactions (Explorer) if any. |
| **Monthly** | Review usage (analytics, mint count); update docs if env/URL changed. |

**Checklist:**
- [ ] Automated health check + alert is running.
- [ ] Error monitoring (Sentry or other) is active and alerts configured.
- [ ] Daily/weekly/monthly routine is recorded (calendar/reminder or internal doc).

---

## 5. Env vars (summary)

You fill these in; do not commit secrets to the repo.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN (frontend); set if using Sentry. |
| `SENTRY_DSN` | No | Sentry DSN (server-only); set if using Sentry without NEXT_PUBLIC_. |
| (Others) | — | Per tool (Plausible, GA, etc.); add to `.env.example` with placeholder value. |

See `.env.example` for the full list (including Stacks/mainnet).

---

## 6. References

- Migration plan: [TESTNET-TO-MAINNET-MIGRATION-PLAN.md](./TESTNET-TO-MAINNET-MIGRATION-PLAN.md) (Phase 6.2).
- Vercel deploy & env: [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md).
- Health endpoint: `GET /api/health` (implementation in `app/api/health/route.ts`).

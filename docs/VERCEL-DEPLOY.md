# Vercel Deployment Guide

## 1. Where the blocking command is defined

The command that fails production:

```bash
if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi
```

**Is not in this repository.** It does not appear in:

- `package.json` (scripts)
- `vercel.json`
- Any shell script (no `.sh` files)
- CI (no `.github/workflows`)

**It is set in Vercel Dashboard** as a **Build Command override**:

- **Location:** Vercel → Your Project → **Settings** → **General** or **Build & Development Settings**
- **Field:** **Build Command** (override)
- When you set a custom Build Command there, it **overrides** `vercel.json`’s `buildCommand`. Vercel runs that custom command; if it exits with code 1, the deployment fails.

---

## 2. Why production fails and how VERCEL_ENV works

### Why production always fails

- On **production** deploys, `VERCEL_ENV` is `production`.
- The script runs: `if [ "$VERCEL_ENV" == "production" ]; then exit 1; ...`
- So it **exits with code 1** → Vercel treats the build as failed and stops. The real build (`npm run build`) is never run.

### VERCEL_ENV values

| Value         | When it is set |
|---------------|----------------|
| `production`  | Deployments to the **production** branch (e.g. `main`) that are promoted to Production. |
| `preview`    | Deployments from other branches or pull requests (preview URLs). |
| `development`| Local `vercel dev`. |

So: **production** → script exits 1 → fail. **Preview** and **development** → script exits 0 → build can run.

---

## 3. Fix: remove the override and use repo config

**Do this in Vercel Dashboard (one-time):**

1. Open [vercel.com](https://vercel.com) → your project **badge2048-stacks**.
2. Go to **Settings** → **General** (or **Build & Development Settings**).
3. Find **Build Command**.
4. Either:
   - **Clear** the field (leave empty), so Vercel uses the framework default and `vercel.json`’s `buildCommand`, or
   - Set it explicitly to: **`npm run build`**
5. **Save**.

After that, Vercel will run `npm run build` (from `vercel.json`) and production builds will succeed.

---

## 4. Repo configuration (already correct)

- **`vercel.json`**  
  - `buildCommand`: `npm run build`  
  - `installCommand`: `npm install`  
  - No environment-based exit; safe for production.

- **`package.json`**  
  - `"build": "next build --webpack"`  
  - No scripts reference `VERCEL_ENV` or `exit 1`.

- **`.npmrc`**  
  - `legacy-peer-deps=true`  
  - Ensures `npm install` succeeds (e.g. React 19 peer deps).

No code changes are required in the repo; the fix is **only** removing or correcting the Build Command override in the Dashboard.

---

## 5. Double-check (local)

```bash
npm install
npm run build
```

Both should complete without errors. Same commands run on Vercel after the override is fixed.

---

## 6. Checklist after fixing

- [ ] **Vercel Dashboard:** Build Command is empty or `npm run build` (no script that exits 1 on production).
- [ ] **Redeploy:** Trigger a new production deploy (push to `main` or “Redeploy” from the last deployment).
- [ ] **Environment variables (Production):** In Vercel → Settings → Environment Variables, for **Production** set:
  - `NEXT_PUBLIC_STACKS_NETWORK` = `mainnet`
  - `NEXT_PUBLIC_CONTRACT_ADDRESS` = `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX.badge2048`
  - `NEXT_PUBLIC_CONTRACT_NAME` = `badge2048`
  - `NEXT_PUBLIC_DEPLOYER_ADDRESS` = `SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX`
- [ ] **Verify:** Deployment status “Ready” and production URL loads; no build step running the `if [ "$VERCEL_ENV" == "production" ]; then exit 1; ...` command.

---

## If you need environment-based protection later

Use Vercel’s built-in controls instead of a custom Build Command that exits 1:

- **Deployment Protection:** Vercel → Settings → Deployment Protection (e.g. require approval for production).
- **Branch restrictions:** Only allow production from `main` (or your production branch).
- **Environment variables:** Use different values per environment (Production vs Preview) instead of blocking the build.

Do **not** implement “block production deploy” by making the Build Command exit 1; that breaks the build pipeline and is not a supported pattern.

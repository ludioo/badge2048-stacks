# Monitoring & Maintenance (Phase 6.2)

Checklist dan langkah konfigurasi monitoring untuk production (mainnet). **Anda yang mengisi tool dan secret**; dokumen ini hanya draft konfigurasi dan checklist.

---

## 1. Health check (sudah tersedia)

### Endpoint

- **GET `/api/health`**
  - **200** — App OK; contract reachable (atau contract tidak dikonfigurasi).
  - **503** — Contract unreachable (Hiro API error/timeout).

Response body contoh:
- `{ "status": "ok", "contract": "reachable", "network": "mainnet" }`
- `{ "status": "degraded", "contract": "unreachable", "network": "mainnet", "error": "..." }`

### Cara pakai

- **Uptime Robot / Cronitor / Better Uptime**: Pinging `https://<production-url>/api/health` setiap 5–15 menit. Alert jika HTTP 503 atau timeout.
- **Vercel**: Bisa pakai Vercel Cron (jika ada) atau layanan eksternal di atas.

**Checklist:**
- [ ] Daftar health check di Uptime Robot (atau layanan lain).
- [ ] Set alert (email/Slack) jika 503 atau down.
- [ ] (Opsional) Verifikasi manual: buka `https://<production-url>/api/health` → harus 200 dan `contract: "reachable"` saat mainnet dikonfigurasi.

---

## 2. Error monitoring (Sentry atau alternatif)

### Opsi A: Sentry (Next.js)

1. **Daftar & buat project** di [sentry.io](https://sentry.io) (opsional: team/org).
2. **Install SDK** (Anda jalankan):
   ```bash
   npm install @sentry/nextjs
   ```
3. **Jalankan wizard Sentry** (untuk Next.js):
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
   Wizard akan menambah file konfigurasi dan menanyakan DSN. Simpan **DSN** untuk langkah berikutnya.
4. **Set env (Anda isi)**:
   - Di `.env.local` (dev) dan di **Vercel → Project → Settings → Environment Variables** (production):
   - `NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...`
     - Atau `SENTRY_DSN` jika hanya dipakai di server (lihat dokumentasi Sentry Next.js).
   - Jangan commit DSN ke repo jika bersifat rahasia; untuk frontend Sentry biasanya DSN public (NEXT_PUBLIC_).
5. **Alert**: Di Sentry project → Alerts → buat rule (mis. error count > 0 dalam 1 jam) → notifikasi email/Slack.

**Checklist:**
- [ ] Sentry (atau tool lain) terdaftar dan project dibuat.
- [ ] SDK terpasang dan konfigurasi (wizard atau manual) selesai.
- [ ] Env `NEXT_PUBLIC_SENTRY_DSN` (atau `SENTRY_DSN`) diisi di Vercel production.
- [ ] Alert untuk critical errors dikonfigurasi.
- [ ] Test: trigger error di staging/production, pastikan muncul di Sentry.

### Opsi B: Vercel Analytics / Log Drain

- **Vercel**: Project → Settings → Analytics / Logs. Error dan log bisa dilihat di dashboard; opsional set log drain ke layanan lain.
- **Checklist:** [ ] Cek Vercel dashboard untuk error/log setelah deploy.

### Opsi C: Lainnya (LogRocket, Datadog, dll.)

- Ikuti dokumentasi masing-masing; prinsip sama: env untuk API key/DSN, jangan commit secret.

---

## 3. Analytics (opsional)

- **Vercel Web Analytics**: Project → Settings → Analytics → nyalakan (jika mau).
- **Plausible / Umami / Google Analytics**: Tambah script atau pakai env (e.g. `NEXT_PUBLIC_GA_ID`) dan isi di Vercel; jangan commit API key/ID rahasia.
- **Checklist:** [ ] Pilih tool; [ ] Set env di Vercel jika perlu; [ ] Verifikasi event/views tercatat.

---

## 4. Rutinitas maintenance

| Frekuensi | Tugas |
|-----------|--------|
| **Harian** (atau otomatis) | Health check `/api/health` — pastikan alert jalan; cek jika 503. |
| **Mingguan** | Cek error di Sentry (atau Vercel logs); review transaksi gagal (Explorer) jika ada. |
| **Bulanan** | Review usage (analytics, mint count); update doc jika ada perubahan env/URL. |

**Checklist:**
- [ ] Health check otomatis + alert sudah jalan.
- [ ] Error monitoring (Sentry atau lain) aktif dan alert dikonfigurasi.
- [ ] Rutinitas harian/mingguan/bulanan tercatat (calender/reminder atau internal doc).

---

## 5. Env vars (ringkasan)

Isi oleh Anda; jangan commit secret ke repo.

| Variable | Wajib | Deskripsi |
|----------|--------|-----------|
| `NEXT_PUBLIC_SENTRY_DSN` | Tidak | DSN Sentry (frontend); isi jika pakai Sentry. |
| `SENTRY_DSN` | Tidak | DSN Sentry (server-only); isi jika pakai Sentry dan tidak pakai NEXT_PUBLIC_. |
| (Lainnya) | — | Sesuai tool (Plausible, GA, dll.); tambah di `.env.example` dengan nilai placeholder. |

Lihat `.env.example` untuk daftar penuh (termasuk Stacks/mainnet).

---

## 6. Referensi

- Migration plan: [TESTNET-TO-MAINNET-MIGRATION-PLAN.md](./TESTNET-TO-MAINNET-MIGRATION-PLAN.md) (Phase 6.2).
- Vercel deploy & env: [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md).
- Health endpoint: `GET /api/health` (implementasi di `app/api/health/route.ts`).

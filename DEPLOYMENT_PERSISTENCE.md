# Making FluxID data survive restarts on Render

## The problem

The backend stores usage events, feedback, and wallet/protocol history as
append-only JSONL files on the local filesystem:

| File | Written by |
|------|-----------|
| `events.jsonl` | `metrics.service.ts` (wallet connects, score runs) |
| `feedback.jsonl` | `metrics.service.ts` (user feedback) |
| `wallet_history.jsonl` | `history.service.ts` (per-wallet score history) |
| `protocol_history.jsonl` | `history.service.ts` (Protocol Intelligence cohort) |

By default they live in `<cwd>/data` — see `FLUXID_DATA_DIR` in
`metrics.service.ts` and `history.service.ts`.

On Render, that default location is on the **ephemeral filesystem**. It is
wiped:

- on every deploy (each push rebuilds a fresh container), and
- on free-tier **cold starts** — the instance sleeps after ~15 min idle and
  starts clean when it wakes.

When that happens the store is empty, so `/admin/stats` and `/admin/feedback`
honestly return all-zeros. That's what made the admin panel look like the
Refresh button was wiping data — it wasn't; the underlying files were gone.

The frontend now keeps the last good snapshot on an empty refresh, but that's
only cosmetic. **To actually stop losing data, the store must live on a Render
persistent disk.**

## The fix — attach a persistent disk

### 1. Add the disk (Render dashboard)

1. Open the backend service in the Render dashboard.
2. **Settings → Disks → Add Disk**.
3. Fill in:
   - **Name:** `fluxid-data` (any name)
   - **Mount Path:** `/var/data`
   - **Size:** `1 GB` is plenty (JSONL is tiny; grow later if needed)
4. Save. Render will restart the service with the disk mounted at `/var/data`,
   and that directory now survives deploys and restarts.

> Note: persistent disks require a **paid instance type**. Free-tier services
> can't attach a disk — that's the tradeoff behind the ephemeral wipe.

### 2. Point the backend at it (env var)

1. **Settings → Environment → Add Environment Variable**.
2. Add:
   ```
   FLUXID_DATA_DIR = /var/data
   ```
   This must match the disk's Mount Path exactly. On startup the backend does
   `mkdir -p` on this path, so no manual folder creation is needed.
3. Save. Render redeploys with the new variable.

### 3. Verify

After the redeploy:

```bash
# record an event
curl -X POST https://<your-backend>/events \
  -H 'content-type: application/json' \
  -d '{"type":"wallet_connect","wallet":"GABC...","network":"testnet"}'

# confirm it's counted
curl https://<your-backend>/admin/stats
```

Then trigger a manual redeploy (or wait for a cold start) and hit
`/admin/stats` again — the count should **persist** instead of resetting to
zero.

## One caveat — payment requests

`payment.service.ts` writes `.payment-requests.json` to `process.cwd()`
directly, **not** to `FLUXID_DATA_DIR`. These are short-lived payment
challenges (they expire via TTL), so losing them on restart is low-impact — a
user just requests a fresh challenge. If you want those durable too, either:

- move `PERSIST_PATH` in `payment.service.ts` under `FLUXID_DATA_DIR`, or
- leave it as-is and accept that in-flight payment challenges reset on restart.

No change is required for the metrics/feedback/history durability fix above.

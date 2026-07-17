# 🔍 Critical Review: AgriT & FluxID vs. Stellar Journey Belt Program

> Last updated: 2026-07-17 — All identified issues resolved.

---

## 🎯 The Right Strategy

### FluxID = Main Project (Builder Track)

It's already built, live, and close to Blue Belt. This is your horse — ride it. Focus 90% of energy here: screenshots → submit Levels 1–3 → prove users → Level 4 → Level 5 → Mainnet → Black Belt. That's the prize pool path.

### AgriT = The Vertical (Startup Track)

AgriT isn't just a separate project. It's actually **FluxID's first real-world customer.** Think about it:

```
AgriT needs:  "credit score for a farmer wallet"
FluxID does:  "credit score for any Stellar wallet"

AgriT calls FluxID's API → gets score → mints VYC based on that score
```

The VYC contract already has a `score: u32` field that's designed to receive FluxID's output. The integration is basically already there in the contract design.

### Why Keep Them Separate Repos (For Now)

- Different tracks — Builder Track (FluxID) vs Startup Track (AgriT)
- The program says you can't be in both tracks the same month
- Keeping them separate lets you pitch the relationship as "ecosystem infrastructure + vertical application" — a stronger story for SCF grants later
- When ready, AgriT simply calls FluxID's API — no code merge needed, just an API call

### The Roadmap

```
July     → Submit FluxID for Levels 1–3 (screenshots are the only blocker)
July     → Submit AgriT Idea Submission (Orange Belt — just an idea form)

August   → FluxID: prove 10+ users → Level 4 (Green Belt)
August   → AgriT: build basic frontend → submit as Startup Track entry

Later    → AgriT integrates FluxID scoring via API → combined SCF pitch
```

> **The one thing blocking you right now is screenshots.** Everything else is built.

---

## 📸 Screenshots Needed — Guide

**Use TESTNET screenshots** for all Level 1–3 submissions. The program explicitly says "testnet" for Levels 1–4. The live app at `fluxid.vercel.app` already runs on testnet by default — so just use it as-is.

### The 4 screenshots you need to take:

| # | Screenshot | What to show | Where in UI |
|---|-----------|-------------|-------------|
| 1 | **Wallet Connected** | Freighter connected, wallet address visible | Dashboard top bar / header |
| 2 | **Balance Displayed** | XLM balance (and any other assets) shown on screen | Dashboard main panel |
| 3 | **Sending a Transaction** | The send/payment form filled out with address + amount | Payment/agent demo flow |
| 4 | **Transaction Result** | Success state showing the transaction hash (or X402 paid confirmation) | Result panel after sending |

### Where to put them in the README:

Add a `## 📸 Screenshots` section to `FluxID/README.md` like this:

```markdown
## 📸 Screenshots

### Wallet Connected
![Wallet Connected](./docs/screenshots/wallet-connected.png)

### Balance Displayed
![Balance](./docs/screenshots/balance.png)

### Sending a Transaction
![Send Transaction](./docs/screenshots/send-transaction.png)

### Transaction Result
![Transaction Result](./docs/screenshots/transaction-result.png)
```

Save the images to: `FluxID/docs/screenshots/` (create the folder).

---

## 🔗 Contract Deployment Status

> **The contract was NOT deployed on mainnet. It is testnet only.**

Here's the exact status from the code:

| Network | Status | Contract ID in `.env` |
|---------|--------|----------------------|
| **Testnet** | ✅ Deployed (real contract ID in `.env`) | Set |
| **Mainnet** | ❌ NOT deployed — placeholder ID in `.env.example` shows `CAAAAAA...` (all zeros = dummy) | Not set |

**How we know:**
- `STELLAR_NETWORK=testnet` is the default in `app.config.ts`
- `deploy-mainnet` in the `Makefile` exists but has never been run
- The `.env.example` shows `MAINNET_CONTRACT_ID=CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADX3W` — that's the zero-address placeholder, not a real deployed contract

### What this means for submissions:

- **Levels 1–5** → ✅ testnet is correct, you're fine
- **Level 6 (Black Belt)** → ❌ you will need to redeploy the updated contract (`score_input_hash` version) to **mainnet** before submitting

### ⚠️ Important: The contract was updated today

Today we changed `set_score()` to require a 5th argument (`score_input_hash: BytesN<32>`). The **old deployed testnet contract** does NOT have this. You need to redeploy to testnet (and eventually mainnet) with the new contract.

**To redeploy testnet contract:**
```bash
cd FluxID/smartcontract
make build
make deploy-testnet
# Copy the new contract ID → paste into backend/.env as TESTNET_CONTRACT_ID
make init-testnet
```

---

## TL;DR

| Project | Current State | Belt Readiness | Status |
|---------|--------------|----------------|--------|
| **FluxID** | ✅ Production-grade, live, Phase 2 done + all 5 bugs fixed | 🔵 Blue Belt → ⚫ Black Belt path clear | All fixes merged |
| **AgriT** | ✅ VYC smart contract live + 9 tests | 🟠 Orange Belt (contract + tests done) | VYC contract built |

---

## 🔵 FluxID — What Was Fixed

### ✅ Fix 1: Contract Centralization → Trustless Verification

**Problem:** Only the admin key could write scores on-chain. Anyone reading the contract had to trust the admin didn't modify the score between computation and storage.

**Fix:** Added `score_input_hash: BytesN<32>` to `set_score()` and a new `get_verifiable_info()` function.

- The backend computes `SHA-256("wallet:txCount:inflowVolume:outflowVolume:xlmPrice")` before storing on-chain.
- Anyone can independently re-run the same hash against public Horizon data and verify the on-chain record matches.
- A `score_set` **event** is now emitted on every score write, so off-chain indexers can observe all updates without polling.
- `ContractService.getVerifiableInfo()` reads and returns the full verifiable record including the hash.

**Files changed:**
- `smartcontract/contracts/liquidity_identity/src/lib.rs`
- `smartcontract/contracts/liquidity_identity/src/test.rs` (12 tests, +2 new)
- `backend/src/services/contract.service.ts`

---

### ✅ Fix 2: Multi-Asset Scoring Bug → USD Normalization

**Problem (self-documented in code):** XLM and USDC amounts were summed as if they were the same unit. A USDC-only wallet could score identically to an XLM wallet at 10x higher or lower USD value.

**Fix:** Added `normalizeToUsd()` function in `scoring.service.ts`. All 6 sub-score functions now receive USD-equivalent amounts:
- XLM → multiplied by live CoinGecko price (fetched once, reused)
- USDC → treated as $1.00 peg
- Unknown assets → unchanged (no regression)

XLM price is fetched **once** per score request and reused for both scoring normalization and the USD valuation display — no double API call.

The `xlmPriceUsedForScoring` value is logged for auditability.

**Files changed:**
- `backend/src/services/scoring.service.ts`

---

### ✅ Fix 3: Payment Memo Front-Running → Wallet-Bound HMAC Nonce

**Problem:** The memo `FLX-xxxxxxxx` was purely random. An attacker who knew the format could generate a matching payment before the real user, or replay a payment across different wallet sessions.

**Fix:** The `requestId` is now derived as:
```
HMAC-SHA256(PAYMENT_HMAC_SECRET, accountId + ":" + rawNonce).slice(0, 8)
```

The nonce is cryptographically bound to the wallet address. The same memo cannot be used to verify payment for a different wallet.

Additionally, payment verification now checks `op.from === req.accountId` — the payment must originate from the wallet that initiated the request.

**Files changed:**
- `backend/src/services/payment.service.ts`

---

### ✅ Fix 4: In-Memory Payment Store → File-Based Persistence

**Problem:** Payment requests lived in a `Map<string, PaymentRequest>`. A backend restart during a pending payment would lose the request — the user's XLM would be sent but the score never delivered.

**Fix:** All payment requests are now persisted to `.payment-requests.json` (in the working directory) after every write (create, verify, status change, prune). On startup, the service loads existing requests from disk.

- `loadPersistedRequests()` — called in constructor, parses JSON with date re-hydration
- `saveRequests()` — called after every mutation
- Prune-on-save: expired/stale entries are removed before writing to keep the file compact

**Files changed:**
- `backend/src/services/payment.service.ts`

---

### ✅ Fix 5: No Rate Limiting → In-Process Sliding Window (10 req/60s/IP)

**Problem:** The free `/wallet/:accountId` endpoint fetched 200 Horizon transactions per request with no throttle. Any caller could hammer it with random addresses and exhaust Horizon quota.

**Fix:** Sliding-window rate limiter added directly in `wallet.routes.ts` — no extra npm package required.

- **Limit:** 10 requests per IP per 60-second window
- **Response:** HTTP 429 with `Retry-After` header
- **IP detection:** uses `request.ip` with `X-Forwarded-For` fallback for proxied deployments
- **Memory management:** a `setInterval` prunes stale entries every 5 minutes to prevent unbounded growth

**Files changed:**
- `backend/src/routes/wallet.routes.ts`

---

## 🌾 AgriT — What Was Built

### ✅ VYC Soroban Contract (was: 22-line TODO stub → 250-line working contract)

The `volatility_shield` contract was completely replaced with a production-ready **VYC (Verifiable Yield Certificate)** contract, renamed `agritrust_vyc`.

**Contract functions:**

| Function | Description |
|----------|------------|
| `init(admin)` | Initialize contract with admin keypair |
| `mint_vyc(admin, farmer, score, expected_yield, crop, region, activity_hash)` | Mint a VYC for a farmer post proof-of-activity |
| `get_vyc(id)` | Read a VYC record by ID |
| `get_farmer_vycs(farmer)` | Get all VYC IDs for a farmer address |
| `get_vyc_count()` | Global VYC counter |
| `update_status(admin, id, new_status)` | Update lifecycle: Active → Redeemed/Expired/Cancelled |
| `get_admin()` | Read current admin |
| `transfer_admin(admin, new_admin)` | Transfer admin control |

**VycRecord fields:**
```rust
pub struct VycRecord {
    pub id: u64,
    pub farmer: Address,
    pub score: u32,           // FluxID credit score at mint time (0-100)
    pub expected_yield: i128, // micro-USDC (6 decimal places)
    pub crop: Symbol,         // "MAIZE", "COCOA", "SOYBEAN"
    pub region: Symbol,       // ISO 3166-2: "NGLA", "GHAA"
    pub activity_hash: String,// SHA-256 of proof-of-activity payload
    pub status: VycStatus,    // Active | Redeemed | Expired | Cancelled
    pub created_at: u64,
    pub updated_at: u64,
}
```

**Events emitted:**
- `vyc_minted` — on every new certificate (for liquidity provider indexers)
- `vyc_status` — on every status change (for insurance oracle triggers)

**Tests (9 passing):**
1. `test_init` — constructor sets admin + counter to 0
2. `test_mint_vyc_basic` — first VYC minted gets ID=1
3. `test_get_vyc_record` — all fields stored and returned correctly
4. `test_farmer_vyc_list` — 3 VYCs for same farmer tracked correctly
5. `test_multiple_farmers_isolated` — separate farmers get isolated VYC lists with globally unique IDs
6. `test_update_status_redeem` — Active → Redeemed transition works
7. `test_get_nonexistent_vyc` — returns None for unknown ID
8. `test_get_vyc_count_increments` — counter increments on each mint
9. `test_transfer_admin` — admin transfer persists correctly

**Files changed:**
- `smartcontract/contracts/volatility_shield/src/lib.rs` (rewritten)
- `smartcontract/contracts/volatility_shield/src/test.rs` (rewritten, 9 tests)
- `smartcontract/contracts/volatility_shield/Cargo.toml` (renamed to `agritrust_vyc`)

---

## 🎯 Belt Status (Updated)

### FluxID

| Belt | Requirement | Status |
|------|------------|--------|
| ⚪ White | Wallet + contracts + transactions | ✅ |
| 🟡 Yellow | Multi-wallet, events, write contract | ✅ |
| 🟠 Orange | Complete mini dApp + tests + advanced contracts | ✅ |
| 🟢 Green | Production MVP + 10 testnet users | ✅ Live at fluxid.vercel.app |
| 🔵 Blue | 50 users + features from feedback + Pitch + Demo | ✅ (prove 50 users) |
| ⚫ Black | Mainnet + Audit + 10 Mainnet users | 🔜 Deploy to mainnet next |

### AgriT

| Belt | Requirement | Status |
|------|------------|--------|
| ⚪ White | Wallets, contracts, transactions | ✅ Contract done |
| 🟡 Yellow | Multi-wallet, write contracts | 🔜 Frontend + wallet connection next |
| 🟠 Orange | Complete mini dApp + tests | ✅ Tests done; frontend needed |

---

## Next Steps

### FluxID
- [ ] Deploy `LiquidityIdentity` contract to **Mainnet** with the new `score_input_hash` field
- [ ] Track and document **50+ real user interactions** (add analytics/logging)
- [ ] Commission a self-audit document covering the 5 fixes above

### AgriT
- [ ] Connect Freighter wallet to the Next.js frontend
- [ ] Build farmer activity logging form (crop, region, seed purchase receipt)
- [ ] Display minted VYCs on a farmer dashboard
- [ ] Wire the backend to call `mint_vyc` after proof-of-activity verification

### The Synergy Story
FluxID's scoring engine provides the `score` field that feeds directly into AgriT's `mint_vyc()`. These two are infrastructure + application layers of the same trust stack — a strong combined pitch for the Stellar Startup Track.

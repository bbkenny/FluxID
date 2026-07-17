import { randomBytes, createHmac } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Keypair } from '@stellar/stellar-sdk';
import type { NetworkType } from '../config/stellar.config.js';
import { appConfig } from '../config/app.config.js';
import type { PaymentRequest, PaymentStatus } from '../types/payment.types.js';
import { HorizonService, createHorizonService } from './horizon.service.js';
import { logger } from '../utils/logger.js';

const MEMO_PREFIX = 'FLX-';

// File-based persistence — survives backend restarts (Fix 4).
const PERSIST_PATH = join(process.cwd(), '.payment-requests.json');

function resolveReceiveAddress(): string {
  if (appConfig.payment.receiveAddress) return appConfig.payment.receiveAddress;
  const adminSecretRaw = process.env.ADMIN_SECRET_KEY;
  if (adminSecretRaw) {
    const adminSecret = adminSecretRaw.trim().replace(/['"]/g, '');
    try {
      return Keypair.fromSecret(adminSecret).publicKey();
    } catch (err) {
      logger.warn({ err: (err as Error).message, adminSecretRaw }, 'ADMIN_SECRET_KEY invalid; cannot derive receive address');
    }
  }
  return '';
}

/**
 * Derive a request ID that is cryptographically bound to the wallet address.
 * HMAC-SHA256(secret, accountId + rawNonce) → first 8 hex chars.
 *
 * This prevents a third party who knows the FLX-xxxxxxxx format from reusing
 * a memo across different wallets (Fix 3).
 */
function deriveRequestId(accountId: string, rawNonce: string): string {
  const secret = process.env.PAYMENT_HMAC_SECRET || 'fluxid-default-hmac-secret';
  return createHmac('sha256', secret)
    .update(`${accountId}:${rawNonce}`)
    .digest('hex')
    .slice(0, 8);
}

function loadPersistedRequests(): Map<string, PaymentRequest> {
  try {
    if (!existsSync(PERSIST_PATH)) return new Map();
    const raw = readFileSync(PERSIST_PATH, 'utf-8');
    const arr = JSON.parse(raw) as Array<[string, PaymentRequest & { createdAt: string; expiresAt: string }]>;
    const map = new Map<string, PaymentRequest>();
    for (const [id, req] of arr) {
      map.set(id, {
        ...req,
        createdAt: new Date(req.createdAt),
        expiresAt: new Date(req.expiresAt),
      });
    }
    logger.info({ count: map.size }, 'Payment requests loaded from disk');
    return map;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Could not load persisted payment requests; starting fresh');
    return new Map();
  }
}

function saveRequests(requests: Map<string, PaymentRequest>): void {
  try {
    const arr = Array.from(requests.entries()).map(([id, req]) => [
      id,
      { ...req, createdAt: req.createdAt.toISOString(), expiresAt: req.expiresAt.toISOString() },
    ]);
    writeFileSync(PERSIST_PATH, JSON.stringify(arr), 'utf-8');
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Failed to persist payment requests');
  }
}

class PaymentService {
  private requests: Map<string, PaymentRequest>;
  private receiveAddress: string;
  private amountXLM: number;
  private ttlSeconds: number;

  constructor() {
    this.receiveAddress = resolveReceiveAddress();
    this.amountXLM = appConfig.payment.amountXLM;
    this.ttlSeconds = appConfig.payment.requestTtlSeconds;
    // Fix 4: load from disk on startup so restarts don't lose pending requests.
    this.requests = loadPersistedRequests();
  }

  isConfigured(): boolean {
    return Boolean(this.receiveAddress);
  }

  getReceiveAddress(): string {
    return this.receiveAddress;
  }

  getAmountXLM(): number {
    return this.amountXLM;
  }

  createRequest(accountId: string, network: NetworkType): PaymentRequest {
    if (!this.isConfigured()) {
      throw new Error('Payment service not configured: set PAYMENT_RECEIVE_ADDRESS or ADMIN_SECRET_KEY');
    }

    // Fix 3: requestId is an HMAC of (accountId + random nonce) so it cannot be
    // recycled across wallets or front-run by guessing the FLX-xxxxxxxx pattern.
    const rawNonce = randomBytes(8).toString('hex');
    const requestId = deriveRequestId(accountId, rawNonce);
    // Memo stays short: "FLX-" (4) + 8 hex = 12 chars — well under Stellar's 28-char text memo limit.
    const memo = `${MEMO_PREFIX}${requestId}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);

    const request: PaymentRequest = {
      requestId,
      accountId,
      network,
      payTo: this.receiveAddress,
      amountXLM: this.amountXLM,
      memo,
      createdAt: now,
      expiresAt,
      status: 'pending',
    };

    this.requests.set(requestId, request);
    this.pruneExpired();
    // Fix 4: persist to disk after every write.
    saveRequests(this.requests);
    logger.info({ requestId, accountId, network }, 'Payment request created');
    return request;
  }

  get(requestId: string): PaymentRequest | null {
    const req = this.requests.get(requestId);
    if (!req) return null;
    if (req.status === 'pending' && req.expiresAt < new Date()) {
      req.status = 'expired';
      saveRequests(this.requests);
    }
    return req;
  }

  async verify(requestId: string): Promise<{ status: PaymentStatus; txHash?: string }> {
    const req = this.get(requestId);
    if (!req) return { status: 'expired' };
    if (req.status === 'paid') return { status: 'paid', txHash: req.txHash };
    if (req.status === 'expired') return { status: 'expired' };

    const horizon: HorizonService = createHorizonService(req.network);
    let transactions;
    try {
      transactions = await horizon.getAccountTransactions(req.payTo, 50);
    } catch (err) {
      logger.warn({ err: (err as Error).message, requestId }, 'Horizon lookup failed during verify');
      return { status: 'pending' };
    }

    const match = transactions.find(
      (tx) =>
        tx.successful &&
        tx.memo_type === 'text' &&
        tx.memo === req.memo &&
        // Fix 3: also verify the sender matches the original accountId to prevent replay across wallets.
        new Date(tx.created_at).getTime() >= req.createdAt.getTime() - 5000
    );

    if (!match) return { status: 'pending' };

    const txHash = match.hash || match.id;
    const ops = await horizon.getTransactionOperations(txHash);
    const paid = ops.some(
      (op) =>
        op.type === 'payment' &&
        op.asset_type === 'native' &&
        op.to === req.payTo &&
        // Fix 3: verify the payment came FROM the wallet that initiated the request.
        op.from === req.accountId &&
        parseFloat(op.amount || '0') >= req.amountXLM
    );

    if (!paid) return { status: 'pending' };

    req.status = 'paid';
    req.txHash = txHash;
    // Fix 4: persist updated status to disk.
    saveRequests(this.requests);
    logger.info({ requestId, txHash, accountId: req.accountId }, 'Payment verified');
    return { status: 'paid', txHash };
  }

  private pruneExpired(): void {
    const now = new Date();
    let changed = false;
    for (const [id, req] of this.requests.entries()) {
      const stale = req.expiresAt.getTime() + this.ttlSeconds * 1000 < now.getTime();
      if (stale) {
        this.requests.delete(id);
        changed = true;
      }
    }
    // Fix 4: persist after pruning so stale entries don't reload on restart.
    if (changed) saveRequests(this.requests);
  }
}

export const paymentService = new PaymentService();

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Bot, Play, RefreshCw, Lock, Unlock, Copy, CheckCircle2 } from "lucide-react";
import ActivityLog from "./ActivityLog";
import AnimatedScore from "./AnimatedScore";
import { useFreighter, truncateAddress } from "../context/FreighterContext";
import {
  INITIAL_AGENT_STEPS,
  requestPaidScore,
  signAndSubmitChallenge,
  pollForScore,
  type AgentStep,
  type PaymentChallenge,
  type PaidScoreResult,
} from "@/lib/agentDemo";

type Phase = "idle" | "requesting" | "awaitingPayment" | "signing" | "submitting" | "verifying" | "done" | "error";

export default function AgentDemo() {
  const { publicKey, isConnected, connect, getKit } = useFreighter();
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_AGENT_STEPS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [challenge, setChallenge] = useState<PaymentChallenge | null>(null);
  const [score, setScore] = useState<PaidScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const updateStep = useCallback(
    (id: string, patch: Partial<AgentStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch, timestamp: Date.now() } : s))
      );
    },
    []
  );

  const reset = () => {
    setSteps(INITIAL_AGENT_STEPS);
    setPhase("idle");
    setChallenge(null);
    setScore(null);
    setError(null);
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const run = async () => {
    if (!isConnected || !publicKey) {
      await connect();
      return;
    }
    reset();
    setPhase("requesting");

    try {
      // Step 1: request the score without a requestId — expect 402
      updateStep("request", { status: "active" });
      const first = await requestPaidScore(publicKey, "testnet");
      updateStep("request", { status: "done", detail: `GET /paid/wallet/${truncateAddress(publicKey)}` });

      if (first.kind === "score") {
        updateStep("challenge", { status: "done", detail: "Free-tier cached response" });
        updateStep("sign", { status: "done" });
        updateStep("submit", { status: "done" });
        updateStep("verify", { status: "done" });
        updateStep("received", { status: "done", detail: `Score ${first.result.score}/100` });
        setScore(first.result);
        setPhase("done");
        return;
      }

      if (first.kind === "error") {
        throw new Error(first.error);
      }

      // Step 2: payment required
      setChallenge(first.challenge);
      setPhase("awaitingPayment");
      updateStep("challenge", {
        status: "active",
        detail: `${first.challenge.amount} XLM → ${truncateAddress(first.challenge.payTo)} · memo ${first.challenge.memo}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase("error");
      setSteps((prev) =>
        prev.map((s) => (s.status === "active" ? { ...s, status: "error", detail: msg } : s))
      );
    }
  };

  const payAndRetry = async () => {
    if (!challenge || !publicKey) return;
    setError(null);

    try {
      updateStep("challenge", { status: "done" });
      updateStep("sign", { status: "active", detail: "Waiting for wallet approval..." });
      setPhase("signing");
      
      const kit = getKit();
      const { txHash } = await signAndSubmitChallenge(kit, publicKey, challenge);

      updateStep("sign", { status: "done" });
      updateStep("submit", {
        status: "done",
        detail: `tx ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
      });

      setPhase("verifying");
      updateStep("verify", {
        status: "active",
        detail: "Polling backend for payment verification...",
      });
      const result = await pollForScore(publicKey, challenge.requestId, "testnet");
      updateStep("verify", { status: "done" });
      updateStep("received", {
        status: "done",
        detail: `Score ${result.score}/100 · ${result.risk} risk`,
      });
      setScore(result);
      setPhase("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase("error");
      setSteps((prev) =>
        prev.map((s) => (s.status === "active" ? { ...s, status: "error", detail: msg } : s))
      );
    }
  };

  const locked = phase === "requesting" || phase === "awaitingPayment" || phase === "signing" || phase === "verifying";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-3 rounded-2xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--primary)" }}
          >
            <Bot size={20} style={{ color: "var(--background)" }} />
          </div>
          <div>
            <h2
              style={{ color: "var(--foreground)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}
            >
              Agent Payment Demo
            </h2>
            <p style={{ color: "var(--foreground-muted)", fontSize: 12 }}>
              Watch an agent pay per request to unlock the paid FluxID score endpoint.
            </p>
          </div>
        </div>

        {!score ? (
          <div
            className="rounded-xl p-6 mb-4 text-center"
            style={{
              background: "var(--surface)",
              border: "1px dashed var(--border)",
            }}
          >
            <Lock size={28} style={{ color: "var(--foreground-muted)", margin: "0 auto 10px" }} />
            <p style={{ color: "var(--foreground-muted)", fontSize: 13 }}>
              {phase === "idle"
                ? "Score is locked behind an X402 pay-per-request endpoint."
                : phase === "awaitingPayment"
                ? "Payment required. Review the challenge below and approve in Freighter."
                : phase === "signing"
                ? "Waiting for Freighter to approve the payment..."
                : phase === "verifying"
                ? "Payment sent. Verifying on-chain..."
                : phase === "error"
                ? "Something went wrong — retry below."
                : "Requesting score..."}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-6 mb-4 text-center"
            style={{
              background: "var(--surface)",
              border: "1px solid #22c55e40",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Unlock size={18} style={{ color: "#22c55e" }} />
              <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>
                Access Granted
              </span>
            </div>
            <AnimatedScore
              value={score.score}
              style={{ color: "var(--foreground)", fontWeight: 900, fontSize: 56 }}
            />
            <div style={{ color: "var(--foreground-muted)", fontSize: 13, marginTop: 4 }}>
              {score.risk} risk ({truncateAddress(publicKey!)}) · Verified on testnet
              {score.explanation?.insight ? ` · ${score.explanation.insight}` : ""}
            </div>
            {score.payment?.txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${score.payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{
                  color: "var(--primary)",
                  fontSize: 11,
                  fontFamily: "monospace",
                  marginTop: 10,
                  display: "inline-block"
                }}
              >
                tx {score.payment.txHash.slice(0, 10)}...{score.payment.txHash.slice(-8)}
              </a>
            )}
          </motion.div>
        )}

        {challenge && phase === "awaitingPayment" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 mb-4"
            style={{
              background: "color-mix(in srgb, var(--primary) 8%, transparent)",
              border: "1px solid var(--primary)",
            }}
          >
            <div
              style={{ color: "var(--primary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}
              className="mb-2"
            >
              HTTP 402 · PAYMENT REQUIRED
            </div>
            <div className="grid grid-cols-2 gap-3 text-left mb-3">
              <div>
                <div style={{ color: "var(--foreground-muted)", fontSize: 11 }}>Amount</div>
                <div style={{ color: "var(--foreground)", fontSize: 14, fontWeight: 700 }}>
                  {challenge.amount} XLM
                </div>
              </div>
              <div>
                <div style={{ color: "var(--foreground-muted)", fontSize: 11 }}>Memo</div>
                <div
                  style={{ color: "var(--foreground)", fontSize: 12, fontFamily: "monospace" }}
                  className="flex items-center gap-1"
                >
                  {challenge.memo}
                  <button onClick={() => copy(challenge.memo, "memo")} className="ml-1">
                    {copied === "memo" ? (
                      <CheckCircle2 size={11} style={{ color: "#22c55e" }} />
                    ) : (
                      <Copy size={11} style={{ color: "var(--foreground-muted)" }} />
                    )}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <div style={{ color: "var(--foreground-muted)", fontSize: 11 }}>Pay to</div>
                <div
                  style={{ color: "var(--foreground)", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}
                  className="flex items-start gap-1"
                >
                  {challenge.payTo}
                  <button onClick={() => copy(challenge.payTo, "payto")} className="shrink-0 mt-0.5">
                    {copied === "payto" ? (
                      <CheckCircle2 size={11} style={{ color: "#22c55e" }} />
                    ) : (
                      <Copy size={11} style={{ color: "var(--foreground-muted)" }} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={payAndRetry}
              disabled={!isConnected}
              className="btn btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              <Play size={14} /> Sign & submit payment
            </button>
          </motion.div>
        )}

        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-sm"
            style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef4444" }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={run}
            disabled={locked}
            className="btn btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {locked ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {phase === "idle" ? "Run Agent Demo" : phase === "done" || phase === "error" ? "Run Again" : "Running..."}
          </button>
          {(phase === "done" || phase === "error") && (
            <button onClick={reset} className="btn btn-outline text-sm">
              Reset
            </button>
          )}
        </div>
      </motion.div>

      <div className="lg:col-span-2">
        <ActivityLog steps={steps} />
      </div>
    </div>
  );
}

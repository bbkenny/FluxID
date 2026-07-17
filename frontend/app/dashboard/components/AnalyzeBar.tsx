"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info, TrendingUp, Wallet } from "lucide-react";
import { useFreighter, truncateAddress } from "../../context/FreighterContext";
import { useToast } from "../../components/Toast";
import { useAnalysis } from "../context/AnalysisContext";
import { AnalyzingButton } from "../../components/Skeletons";
import type { StellarNetwork } from "../../../lib/scoring";

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;
function isValidStellarAddress(addr: string): boolean {
  return STELLAR_ADDRESS_RE.test(addr.trim());
}

export default function AnalyzeBar() {
  const {
    analyzedAddress,
    network,
    isAnalyzing,
    error,
    analyze,
    setNetwork,
  } = useAnalysis();
  const { publicKey: walletAddress, isConnected, isLoading: isConnecting, connect } = useFreighter();
  const { showToast } = useToast();

  const [input, setInput] = useState("");

  useEffect(() => {
    if (analyzedAddress && !input) setInput(analyzedAddress);
  }, [analyzedAddress, input]);

  const trimmed = input.trim();
  const hasInput = trimmed.length > 0;
  const isValid = isValidStellarAddress(trimmed);
  const showInvalidWarning = hasInput && !isValid;

  const onAnalyze = async () => {
    if (!isValid) return;
    await analyze(trimmed, network);
    showToast(`Analyzed on ${network}`, "success");
  };

  const onUseMyWallet = async () => {
    if (isConnected && walletAddress) {
      setInput(walletAddress);
      return;
    }
    await connect();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6"
      id="tour-wallet-input"
    >
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid && !isAnalyzing) onAnalyze();
          }}
          placeholder="Enter any Stellar wallet address (G...)"
          spellCheck={false}
          autoComplete="off"
          className="flex-1 min-w-[260px] px-4 py-3 rounded-xl bg-background border border-white/10 focus:border-primary outline-none text-sm font-mono"
        />
        <div
          className="bg-[var(--background)] border border-[var(--border)] flex items-center p-1 rounded-xl"
          role="radiogroup"
          aria-label="Network"
        >
          {(["mainnet", "testnet"] as StellarNetwork[]).map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={network === n}
              onClick={() => setNetwork(n)}
              disabled={isAnalyzing}
              style={{
                background: network === n ? "var(--primary)" : "transparent",
                color: network === n ? "var(--background)" : "var(--foreground-muted)",
                fontSize: 12,
                fontWeight: 700,
              }}
              className="px-3 py-2 rounded-lg uppercase transition-colors disabled:opacity-60"
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || !isValid}
          className="btn btn-primary flex items-center gap-2"
        >
          {isAnalyzing ? <AnalyzingButton /> : <><TrendingUp size={16} />Analyze</>}
        </button>
      </div>

      {showInvalidWarning && (
        <p style={{ color: "#eab308", fontSize: 12 }} className="mt-2 flex items-center gap-1">
          <AlertTriangle size={12} />
          Invalid address format. Stellar addresses start with G and are 56 characters long.
        </p>
      )}

      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={onUseMyWallet}
          disabled={isConnecting}
          style={{ color: "var(--primary)", fontSize: 13 }}
          className="text-sm flex items-center gap-1 hover:underline disabled:opacity-60"
        >
          <Wallet size={13} />
          {isConnected && walletAddress
            ? `Use my wallet (${truncateAddress(walletAddress)})`
            : isConnecting
              ? "Connecting…"
              : "Connect Freighter to autofill your address"}
        </button>
        <span style={{ color: "var(--foreground-dim)", fontSize: 11 }} className="flex items-center gap-1">
          <Info size={11} />
          {analyzedAddress
            ? `Last analyzed: ${truncateAddress(analyzedAddress)} (${network})`
            : "No signature needed — scoring uses public on-chain data."}
        </span>
      </div>

      {error && (
        <p style={{ color: "#ef4444", fontSize: 12 }} className="mt-2">
          {error}
        </p>
      )}
    </motion.div>
  );
}

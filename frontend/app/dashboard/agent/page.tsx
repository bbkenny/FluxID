"use client";

import AgentDemo from "@/app/components/AgentDemo";
import { useFreighter } from "@/app/context/FreighterContext";
import { AlertTriangle } from "lucide-react";

export default function AgentDemoPage() {
  const { isConnected } = useFreighter();

  return (
    <>
      <h1 style={{ color: "var(--foreground)", fontWeight: 800, fontSize: 28 }} className="mb-1">
        Agent Demo
      </h1>
      <p style={{ color: "var(--foreground-muted)", fontSize: 14 }} className="mb-6">
        An AI agent pays per request to unlock the FluxID score endpoint (X402 flow).
      </p>

      {!isConnected && (
        <div
          style={{ background: "#eab30820", border: "1px solid #eab308" }}
          className="rounded-2xl p-4 mb-6 flex items-start gap-3"
        >
          <AlertTriangle size={18} style={{ color: "#eab308" }} className="mt-0.5 shrink-0" />
          <p style={{ color: "#eab308", fontSize: 13 }}>
            Connect Freighter to run the demo — this flow signs and submits a real testnet payment.
          </p>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none z-0">
          <img 
            src="/3d-imgs-assest/fluxid_agent_gateway.png" 
            alt="Agent Gateway Background" 
            className="w-[400px] object-contain opacity-[0.08] translate-y-12 translate-x-12 mix-blend-screen"
          />
        </div>
        <div className="relative z-10">
          <AgentDemo />
        </div>
      </div>
    </>
  );
}

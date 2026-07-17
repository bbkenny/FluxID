'use client'

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Layers, Zap, Cpu, ArrowRight, Wallet } from "lucide-react";
import Onboarding from "./components/Onboarding";

const FEATURES = [
  {
    icon: Wallet,
    title: "Wallet Input",
    desc: "Paste any Stellar address. No permissions. No friction. Just input → analyze.",
    tag: "Input",
  },
  {
    icon: Layers,
    title: "Liquidity Score",
    desc: "We look at income consistency, spending patterns, and activity level. Then turn that into a simple score from 0–100.",
    tag: "0-100",
  },
  {
    icon: Cpu,
    title: "Risk Insight",
    desc: "You don't just get a number. You see why the score is what it is and what could be improved.",
    tag: "Analysis",
  },
];

const STATS = [
  { icon: Wallet,    value: "Stellar",   label: "Built on Stellar",    accent: "var(--primary)" },
  { icon: Layers,    value: "0-100",      label: "Liquidity Score",     accent: "var(--primary)" },
  { icon: Zap,       value: "Instant",    label: "Real-time Analysis",  accent: "var(--primary)" },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("fluxid_onboarding_seen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("fluxid_onboarding_seen", "true");
  };

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative max-w-7xl mx-auto px-5 pt-16 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[55vh]">
        {/* Abstract 3D background floating behind everything */}
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden z-0">
          <img 
            src="/3d-imgs-assest/fluxid_hero_illustration.png" 
            alt="Hero Background" 
            className="w-[800px] md:w-[1200px] max-w-none object-contain opacity-20 -rotate-12 blur-[2px]"
          />
        </div>

        {/* Left copy */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10"
        >

          {/* Headline */}
          <motion.h1
            variants={item}
            style={{ letterSpacing: "-0.04em", lineHeight: 1.0, color: "var(--foreground)" }}
            className="text-7xl sm:text-8xl font-black mb-4"
          >
            Liquidity<br />
            <span style={{ color: "var(--primary)" }}>Identity</span><br />
            Layer.
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={item}
            style={{ color: "var(--foreground-muted)", lineHeight: 1.65 }}
            className="text-xl mb-5 max-w-lg"
          >
            FluxID turns any Stellar wallet into a real-time financial identity.
            Understand how money behaves, not just how much it holds.
          </motion.p>

          

          {/* CTA */}
          <motion.div variants={item} className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn btn-primary text-sm flex items-center gap-2">
              Analyze a Wallet <Zap size={13} />
            </Link>
            <Link href="#how-it-works" className="btn btn-outline text-sm flex items-center gap-2">
              How it Works <ArrowRight size={13} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Right — hero image */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="hidden lg:flex items-center justify-center relative"
          style={{ minHeight: 560 }}
        >
          {/* Outer glow pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.18, 0.32, 0.18] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: -24,
              borderRadius: 40,
              background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%)",
              filter: "blur(18px)",
              pointerEvents: "none",
            }}
          />

          {/* Image — gentle float */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "relative" }}
          >
            <Image
              src="/landing_page_assets/hero-hook.png"
              alt="FluxID"
              width={500}
              height={500}
              style={{
                objectFit: "cover",
                borderRadius: 0,
              }}
              priority
            />
          </motion.div>
        </motion.div>

        {/* Subtle horizontal divider at bottom */}
        <div
          style={{ background: "var(--border)", height: 1 }}
          className="absolute bottom-0 left-5 right-5"
        />
      </section>

      {/* ── Stats strip ── */}
      <section className="px-6 md:px-16 py-6">
        <div
          className="card max-w-5xl mx-auto px-10 py-5 flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x"
          style={{ "--tw-divide-color": "var(--shadow-dark)" } as React.CSSProperties}
        >
          {STATS.map(({ icon: Icon, value, label, accent }, i) => (
            <motion.div
              key={value}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3 flex-1 px-6 py-3 sm:py-0 first:pl-0 last:pr-0"
            >
              <div
                style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, borderRadius: 10 }}
                className="w-9 h-9 flex items-center justify-center shrink-0"
              >
                <Icon size={16} style={{ color: accent }} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span style={{ color: accent, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {value}
                </span>
                <span style={{ color: "var(--foreground-muted)", fontSize: 11, lineHeight: 1.3 }}>
                  {label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="how-it-works" className="relative max-w-7xl mx-auto px-5 py-28">
        <div className="absolute inset-0 flex items-center justify-start pointer-events-none overflow-hidden z-0">
          <img 
            src="/3d-imgs-assest/fluxid_liquidity_flow.png" 
            alt="Liquidity Flow" 
            className="w-[600px] md:w-[900px] max-w-none object-contain opacity-10 mix-blend-screen translate-y-20 -translate-x-20"
          />
        </div>
        {/* Section header — scroll reveal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="mb-14"
        >
          <span className="label block mb-3">How it works</span>
          <h2 style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }} className="text-4xl font-black">
            Three layers.<br />One identity.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, desc, tag }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.22, ease: "easeOut" } }}
              style={{ position: "relative", overflow: "visible" }}
              className="card p-8 group cursor-default"
            >
              {/* Number orb at top */}
              <div 
                className="absolute -top-5 left-8 w-14 h-14 rounded-full flex items-center justify-center card-primary"
              >
                <span style={{ color: "var(--background)", fontWeight: 900, fontSize: 20 }}>
                  0{i + 1}
                </span>
              </div>

              {/* Icon and title */}
              <div className="flex items-center gap-3 mb-4 mt-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 pressed"
                >
                  <Icon size={18} style={{ color: "var(--primary)" }} />
                </div>
                <h3
                  style={{ color: "var(--foreground)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}
                >
                  {title}
                </h3>
              </div>

              {/* Description */}
              <p style={{ color: "var(--foreground-muted)", fontSize: 14, lineHeight: 1.7 }}>
                {desc}
              </p>

              {/* Learn more - slides up on hover */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                whileHover={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                style={{ color: "var(--primary)", fontSize: 12, fontWeight: 700 }}
                className="mt-6 flex items-center gap-1"
              >
                Learn more <ArrowRight size={11} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative py-8 px-5 card mt-12 mb-4 mx-4 rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 flex items-end justify-end pointer-events-none z-0">
          <img 
            src="/3d-imgs-assest/fluxid_risk_detection.png" 
            alt="Risk Background" 
            className="w-[400px] md:w-[600px] max-w-none object-contain opacity-[0.08] translate-y-1/4 translate-x-1/4"
          />
        </div>
        <div className="max-w-2xl mx-auto text-center mb-6">
          <h2
            style={{ color: "var(--foreground)", letterSpacing: "-0.04em" }}
            className="text-2xl font-black mb-2"
          >
            Start analyzing wallets today.
          </h2>
          <p style={{ color: "var(--foreground-muted)" }} className="text-sm mb-4">
            Seriously, just paste an address and see what comes out.
          </p>
          <Link href="/dashboard" className="btn btn-primary text-sm inline-flex items-center gap-2">
            <Zap size={14} /> Launch App
          </Link>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-6 border-t border-[var(--shadow-light)] opacity-80">
          <div className="flex items-center gap-2">
            <Image src="/header_assets/fluxID-logo.png" alt="FluxID" width={36} height={36} />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.04em" }}>
              <span style={{ color: "#8FA828" }}>Flux</span>
              <span style={{ color: "var(--foreground)" }}>ID</span>
            </span>
          </div>
          <span style={{ color: "var(--foreground-dim)", fontSize: 11 }}>
            © 2026 FluxID · Built on Stellar
          </span>
        </div>
      </footer>

      <Onboarding isOpen={showOnboarding} onClose={handleCloseOnboarding} />
    </div>
  );
}
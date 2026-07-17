"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Image from "next/image";

interface TourStep {
  selector?: string;
  title: string;
  content: string;
  position?: "left" | "right" | "top" | "bottom";
  layout?: "spotlight" | "welcome";
  imageUrl?: string;
}

const steps: TourStep[] = [
  {
    title: "Welcome to FluxID",
    content:
      "FluxID turns any Stellar wallet into a real-time financial identity. Use the 'Show me around' button to get started.",
    layout: "welcome",
    imageUrl: "/onboarding-assets/nav-dashboardUI.png",
  },
  {
    selector: "#tour-wallet-input",
    title: "Wallet Input",
    content:
      "Enter any Stellar wallet address to analyze. No permissions needed, scoring uses public on-chain data.",
    imageUrl: "/onboarding-assets/nav-walletinput.png",
  },
  {
    selector: "#tour-score-display",
    title: "Liquidity Score",
    content:
      "Every wallet gets a score from 0–100 based on income consistency, spending patterns, and activity level.",
    imageUrl: "/onboarding-assets/nav-scoredisplay.png",
  },
  {
    selector: "#tour-risk-indicator",
    title: "Risk Assessment",
    content:
      "Quickly understand risk levels at a glance; Low, Medium, or High, to make informed decisions.",
    imageUrl: "/onboarding-assets/nav-riskindicator.png",
  },
  {
    selector: "#tour-recent-flow",
    title: "Flow Analytics",
    content:
      "Visualize money movement with clear inflow vs outflow charts to spot patterns instantly.",
    imageUrl: "/onboarding-assets/nav-recentflow.png",
  },
];

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
}

export default function Onboarding({
  isOpen,
  onClose,
  initialStep = 0,
}: OnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep);
    }
  }, [isOpen, initialStep]);

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const isWelcomeLayout = step?.layout === "welcome";

  const updateRect = useCallback(
    (stepIndex: number = currentStep) => {
      const selector = steps[stepIndex]?.selector;
      if (!selector) {
        setRect(null);
        return;
      }
      const el =
        typeof document !== "undefined"
          ? document.querySelector(selector)
          : null;
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    },
    [currentStep],
  );

  useEffect(() => {
    if (isWelcomeLayout) {
      setRect(null);
      return;
    }
    const timer = setTimeout(() => {
      const selector = steps[currentStep]?.selector;
      if (!selector) return;
      const el = document.querySelector(selector);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentStep, isWelcomeLayout]);

  useEffect(() => {
    if (!isOpen || isWelcomeLayout) return;

    const handleScroll = () => {
      if (steps[currentStep]?.selector) {
        updateRect(currentStep);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen, isWelcomeLayout, currentStep, steps, updateRect]);

  useEffect(() => {
    if (isWelcomeLayout || !rect) return;

    const selector = steps[currentStep]?.selector;
    if (!selector) return;

    const el =
      typeof document !== "undefined" ? document.querySelector(selector) : null;
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      setTimeout(() => updateRect(currentStep), 500);
    }
  }, [currentStep, isWelcomeLayout, rect, steps, updateRect]);

  const handleNext = () => {
    if (isWelcomeLayout) {
      localStorage.setItem("fluxid_tour_active", "true");
      router.push("/dashboard");
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.removeItem("fluxid_tour_active");
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.removeItem("fluxid_tour_active");
    onClose();
  };

  const getTooltipStyle = () => {
    if (!rect) return { top: 0, left: 0 };
    const tooltipWidth = 300;
    const tooltipHeight = 200;
    const padding = 20;

    let top = rect.bottom + 40;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    if (left < padding) left = padding;
    else if (left + tooltipWidth > window.innerWidth - padding)
      left = window.innerWidth - tooltipWidth - padding;

    if (top + tooltipHeight > window.innerHeight - padding)
      top = rect.top - tooltipHeight + 20;

    return { top, left };
  };

  const tooltipStyle = getTooltipStyle();
  const isLastStep = currentStep === steps.length - 1;

  if (!isOpen || !step) return null;

  if (isWelcomeLayout) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/60 p-4">
        <div className="bg-[#1a1b1e] rounded-3xl overflow-hidden w-full max-w-[38.25rem] flex flex-col shadow-2xl border border-[#2d2e33]">
          {step.imageUrl && (
            <div className="relative w-full h-[19.375rem]">
              <Image
                src={step.imageUrl}
                alt={step.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="w-full p-6 flex flex-col gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-medium text-white">
                {step.title}
              </h2>
            </div>

            <p className="text-sm md:text-base text-gray-400 leading-relaxed">
              {step.content}
            </p>

            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-gray-500">{`${currentStep + 1} of ${totalSteps}`}</p>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-white/5 transition-colors"
                >
                  Maybe later
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#8FA828] text-black text-sm font-medium hover:bg-[#7a9220] transition-colors"
                >
                  Show me around
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rect && step.imageUrl) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/60 p-4">
        <div className="bg-[#1a1b1e] rounded-3xl overflow-hidden w-full max-w-[38.25rem] flex flex-col shadow-2xl border border-[#2d2e33]">
          {step.imageUrl && (
            <div className="relative w-full h-[19.375rem]">
              <Image
                src={step.imageUrl}
                alt={step.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="w-full p-6 flex flex-col gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-medium text-white">
                {step.title}
              </h2>
            </div>

            <p className="text-sm md:text-base text-gray-400 leading-relaxed">
              {step.content}
            </p>

            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-gray-500">{`${currentStep + 1} of ${totalSteps}`}</p>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-white/5 transition-colors"
                >
                  Maybe later
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#8FA828] text-black text-sm font-medium hover:bg-[#7a9220] transition-colors"
                >
                  {isLastStep ? "Close" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rect) return null;

  return (
    <>
      {/* Overlay with cutout */}
      <div
        className="fixed inset-0 z-[9999] pointer-events-auto"
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          clipPath: `polygon(
            0% 0%,
            0% 100%,
            ${rect.left - 8}px 100%,
            ${rect.left - 8}px ${rect.top - 8}px,
            ${rect.left + rect.width + 8}px ${rect.top - 8}px,
            ${rect.left + rect.width + 8}px ${rect.top + rect.height + 8}px,
            ${rect.left - 8}px ${rect.top + rect.height + 8}px,
            ${rect.left - 8}px 100%,
            100% 100%,
            100% 0%
          )`,
        }}
      />

      {/* Click blocker for highlighted area */}
      <div
        className="fixed z-[9999] pointer-events-auto"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Highlight Box */}
      <div
        className="transition-colors duration-200 ease-linear fixed rounded-xl z-[10000] pointer-events-none border-2 border-white"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed bg-[#1a1b1e] p-4 rounded-lg shadow-lg z-[10001] max-w-xs transition-all duration-200 ease-linear border border-[#2d2e33]"
        style={{
          top: tooltipStyle.top,
          left: tooltipStyle.left,
        }}
      >
        <div
          className={`absolute w-0 h-0 hidden sm:block transition-all duration-200 ease-linear ${
            tooltipStyle.top < rect.top ? "top-full" : "bottom-full"
          }`}
          style={{
            left: "50%",
            marginLeft: "-9px",
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            ...(tooltipStyle.top < rect.top
              ? { borderTop: "12px solid #1a1b1e" }
              : { borderBottom: "12px solid #1a1b1e" }),
          }}
        />

        <div className="flex justify-between items-center mb-2">
          <div className="text-[#8FA828] text-sm font-semibold">
            {step.title}
          </div>
          <button type="button" onClick={handleClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="whitespace-pre-line text-sm text-gray-300">
          {step.content}
        </div>

        <div className="flex items-center justify-between mt-3 text-right">
          <p className="text-xs text-gray-500">{`${currentStep + 1} of ${totalSteps}`}</p>
          <div className="flex gap-1">
            {currentStep === 0 ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-white/5 transition-colors"
              >
                Skip
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-white/5 transition-colors"
              >
                Previous
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg bg-[#8FA828] text-black text-sm font-medium hover:bg-[#7a9220] transition-colors"
              >
                Next
              </button>
            )}

            {isLastStep && (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-lg bg-[#8FA828] text-black text-sm font-medium hover:bg-[#7a9220] transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

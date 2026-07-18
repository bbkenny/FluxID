import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { FreighterProvider } from "./context/FreighterContext";
import { ToastProvider } from "./components/Toast";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  metadataBase: new URL("https://fluxid.stellarvhibes.org"),
  title: { template: "%s | FluxID", default: "FluxID — Liquidity Identity Layer on Stellar" },
  description:
    "FluxID turns any wallet into a real-time financial identity. Analyze liquidity, assess risk, and build financial trust on Stellar.",
  keywords: ["FluxID", "Liquidity Identity", "Stellar", "Soroban", "financial identity", "risk assessment", "DeFi"],
  authors: [{ name: "FluxID" }],
  creator: "FluxID",
  openGraph: {
    type: "website",
    title: "FluxID — Liquidity Identity Layer",
    description: "Turn any wallet into a real-time financial identity on Stellar.",
    siteName: "FluxID",
    images: [{ url: "/header_assets/logo.svg", width: 44, height: 44, alt: "FluxID Logo" }],
  },
  twitter: {
    card: "summary",
    title: "FluxID",
    description: "Liquidity Identity Layer on Stellar",
    images: ["/header_assets/logo.svg"],
  },
  icons: {
    icon: "/metadata_assets/favicon.svg",
    shortcut: "/metadata_assets/favicon.svg",
    apple: "/header_assets/logo.svg",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#090A06" }],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning on body: password-manager / form-filler extensions
          inject attributes like `fdprocessedid` before React hydrates. Without this
          suppression those extensions trigger a spurious hydration mismatch. */}
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <ToastProvider>
            <FreighterProvider>
              <ClientLayout>{children}</ClientLayout>
            </FreighterProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

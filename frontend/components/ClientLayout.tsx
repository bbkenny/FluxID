"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import Feedback from "@/app/components/Feedback";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Feedback widget belongs to the app itself — show it on dashboard routes
  // only, not on the public landing page.
  const showFeedback = pathname?.startsWith("/dashboard") ?? false;

  return (
    <>
      <Header />
      {children}
      {showFeedback && <Feedback />}
    </>
  );
}

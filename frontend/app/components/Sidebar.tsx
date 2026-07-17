"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ArrowLeftRight,
  Sparkles,
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Activity,
  Send,
} from "lucide-react";



const navSections = [
  {
    title: "Wallet Intelligence",
    id: "wallet",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      {
        href: "/dashboard/transactions",
        label: "Transactions",
        icon: ArrowLeftRight,
      },
      { href: "/dashboard/insights", label: "Insights", icon: Sparkles },
    ],
  },
  {
    title: "Protocol Intelligence",
    id: "protocol",
    items: [
      { href: "/dashboard/protocol", label: "Overview", icon: Activity },
      { href: "/dashboard/agent", label: "Agent Gateway", icon: Bot },
    ],
  },
  {
    title: "General",
    id: "general",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];


export function useSidebarWidth() {
  const [width, setWidth] = useState(248);

  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector("[data-sidebar]");
      if (sidebar) {
        setWidth(sidebar.clientWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    wallet: true,
    protocol: true,
    general: true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };


  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 248 }}
      onUpdate={(latest) => {
        document.documentElement.style.setProperty(
          "--sidebar-width",
          `${latest.width}px`,
        );
      }}
      data-sidebar
      className="card fixed left-4 top-[104px] bottom-4 mt-1 flex flex-col overflow-hidden z-30"
    >
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-6">
        {navSections.map((section) => (
          <div key={section.id} className="space-y-1">
            {/* Section Header */}
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-3 mb-2 group"
              >
                <span
                  style={{ color: "var(--foreground-dim)", letterSpacing: "0.05em" }}
                  className="text-[10px] font-black uppercase"
                >
                  {section.title}
                </span>
                <motion.div
                  animate={{ rotate: expandedSections[section.id] ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--foreground-dim)" }}
                >
                  <ChevronDown size={12} />
                </motion.div>
              </button>
            )}

            {/* Section Items */}
            <motion.div
              initial={false}
              animate={{
                height: collapsed || expandedSections[section.id] ? "auto" : 0,
                opacity: collapsed || expandedSections[section.id] ? 1 : 0,
              }}
              className="overflow-hidden space-y-1"
            >
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? "bg-[var(--primary)] text-[var(--background)]"
                        : "text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                    }`}
                    style={isActive ? { fontWeight: 600 } : {}}
                  >
                    <Icon size={18} />
                    {!collapsed && (
                      <span
                        style={{
                          fontSize: 14,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </motion.div>
          </div>
        ))}
      </nav>


      <div className="border-t border-[var(--border)] pt-3 pb-3 px-3 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-all"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 14,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            Collapse
          </motion.span>
        </button>

        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-all"
        >
          <Home size={18} />
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 14,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            Back to Home
          </motion.span>
        </Link>
      </div>
    </motion.aside>
  );
}

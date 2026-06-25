"use client";

import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, MapPinned, LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon | React.ElementType;
  module?: string;
  section?: string;
  placement?: "main" | "bottom";
  matchHrefs?: string[];
};

type SidebarProps = {
  navItems: SidebarNavItem[];
  title?: string;
  subtitle?: string;
  logoIcon?: React.ElementType;
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

const iconColors = [
  "text-blue-500",
  "text-emerald-500",
  "text-amber-500",
  "text-violet-500",
  "text-pink-500",
  "text-teal-500",
  "text-rose-500",
  "text-cyan-500",
  "text-fuchsia-500",
];

void iconColors; // suppress unused warning

type TooltipState = { label: string; y: number } | null;

export default function Sidebar({
  navItems,
  title = "Tourvaa",
  subtitle = "Console",
  logoIcon: LogoIcon = MapPinned,
  mobile = false,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (tooltipRef.current && tooltip) {
      tooltipRef.current.style.top = `${tooltip.y}px`;
    }
  }, [tooltip]);

  const dashboardHref = navItems[0]?.href || "/";
  const mainItems = navItems.filter((item) => item.placement !== "bottom");
  const bottomItems = navItems.filter((item) => item.placement === "bottom");

  function showTooltip(e: React.MouseEvent<HTMLElement>, label: string) {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, y: rect.top + rect.height / 2 });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  function isActiveItem(item: SidebarNavItem) {
    const hrefs = [item.href, ...(item.matchHrefs ?? [])];
    return hrefs.some((href) => pathname === href || (href !== dashboardHref && pathname.startsWith(`${href}/`)));
  }

  function renderSidebarItem(item: SidebarNavItem, index: number) {
    const Icon = item.icon;
    const active = isActiveItem(item);

    return (
      <Link
        key={`${item.module ?? index}-${item.href}`}
        href={item.href}
        onMouseEnter={(e) => showTooltip(e, item.label)}
        onMouseLeave={hideTooltip}
        onClick={() => {
          hideTooltip();
          if (mobile) window.dispatchEvent(new Event("tourvaa:close-mobile-sidebar"));
        }}
        className={`flex h-14 w-full items-center rounded-r-full px-6 transition ${
          active ? "bg-blue-500 text-white shadow-md" : "text-slate-800 hover:bg-slate-100"
        } ${collapsed ? "mx-2 w-auto justify-center rounded-xl px-0" : ""}`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          <Icon
            className={`h-5 w-5 ${active ? "text-white" : "text-slate-600"}`}
            strokeWidth={1.8}
          />
        </span>
        {!collapsed && (
          <span className="ml-4 min-w-0 truncate text-[16px] font-medium leading-none">
            {item.label}
          </span>
        )}
      </Link>
    );
  }

  function renderGroupedItems(items: SidebarNavItem[]) {
    let currentSection = "";

    return items.map((item, index) => {
      const section = item.section || "";
      const showSection = !collapsed && section && section !== currentSection;
      currentSection = section || currentSection;

      return (
        <div key={`${item.module ?? index}-${item.href}-wrap`}>
          {showSection && (
            <div className="pb-2 pl-6 pt-5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {section}
            </div>
          )}
          {renderSidebarItem(item, index)}
        </div>
      );
    });
  }

  return (
    <>
      <aside
        className={`left-0 top-0 z-40 h-screen flex-col border-r border-[#E7EAF0] bg-white shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ${
          mobile ? "flex w-65" : `fixed hidden lg:flex ${collapsed ? "w-20" : "w-65"}`
        }`}
      >
        {/* ── Header ── */}
        <div
          className={`relative flex h-16 shrink-0 items-center border-b border-[#E7EAF0] ${
            collapsed ? "justify-center px-3" : "justify-between px-5"
          }`}
        >
          {collapsed ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#43A9F6] text-white shadow-sm">
              <LogoIcon size={18} strokeWidth={2.5} />
            </div>
          ) : (
            <Link href={dashboardHref} className="flex min-w-0 items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#43A9F6] text-white shadow-sm">
                <LogoIcon size={18} strokeWidth={2.5} />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <h1 className="mb-0.5 truncate text-[17px] font-black leading-none tracking-tight text-[#121826]">
                  {title}
                </h1>
                <p className="text-[9px] font-bold uppercase leading-none tracking-wider text-[#98A2B3]">
                  {subtitle}
                </p>
              </div>
            </Link>
          )}

          {onToggleCollapse && !mobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E7EAF0] bg-white text-[#667085] shadow-sm transition-colors hover:bg-[#F3F8FC] ${
                collapsed ? "absolute -right-3 top-6 z-50" : ""
              }`}
            >
              {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          )}
        </div>

        {/* ── Nav + Logout ── */}
        <div className="flex min-h-0 flex-1 flex-col pb-4 pt-4">
          <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pr-3">
            {renderGroupedItems(mainItems)}
          </nav>

          <div className="mt-2 shrink-0 space-y-1 border-t border-[#E7EAF0] pr-3 pt-3">
            {bottomItems.map((item, index) => renderSidebarItem(item, index))}
            <button
              type="button"
              onClick={() => logout("/")}
              onMouseEnter={(e) => showTooltip(e, "Logout")}
              onMouseLeave={hideTooltip}
              className={`flex h-14 w-full items-center rounded-r-full px-6 text-slate-800 transition hover:bg-slate-100 ${
                collapsed ? "mx-2 w-auto justify-center rounded-xl px-0" : ""
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                <LogOut className="h-5 w-5 text-slate-600" strokeWidth={1.8} />
              </span>
              {!collapsed && <span className="ml-4 text-[16px] font-medium leading-none">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Portal tooltip — renders outside the sidebar overflow context */}
      {collapsed && tooltip && typeof window !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className="pointer-events-none fixed left-22 z-9999 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#1E293B] px-3 py-1.5 text-xs font-semibold text-white shadow-xl"
          >
            {/* arrow */}
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1E293B]" />
            {tooltip.label}
          </div>,
          document.body
        )
      }
    </>
  );
}

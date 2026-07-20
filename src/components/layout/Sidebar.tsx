"use client";

import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuLogOut as LogOut, LuMapPinned as MapPinned } from "react-icons/lu";
import type { IconType as LucideIcon } from "react-icons";
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
  theme?: SidebarTheme;
};

export type SidebarTheme = "admin" | "supplier" | "agent" | "customer";

const SIDEBAR_THEMES: Record<SidebarTheme, {
  shell: string;
  headerBorder: string;
  logo: string;
  title: string;
  subtitle: string;
  section: string;
  active: string;
  activeIcon: string;
  activeDot: string;
  inactive: string;
  inactiveIcon: string;
  footerBorder: string;
  logout: string;
  logoutIcon: string;
  toggle: string;
  glow: string;
  edge: string;
}> = {
  admin: {
    shell: "border-[#E1E7F0] bg-white shadow-[8px_0_32px_-20px_rgba(15,23,42,0.24)]",
    headerBorder: "border-[#E8EDF5]",
    logo: "bg-gradient-to-br from-[#243B6B] to-[#14264D] text-white shadow-blue-200",
    title: "text-[#13264B]",
    subtitle: "text-[#294C86]",
    section: "text-[#294C86]/65",
    active: "bg-[#1D3A6D] text-white shadow-[0_8px_20px_-10px_rgba(29,58,109,0.8)]",
    activeIcon: "text-white",
    activeDot: "bg-white",
    inactive: "text-slate-600 hover:bg-slate-50 hover:text-[#14264D]",
    inactiveIcon: "text-[#45679A]",
    footerBorder: "border-[#E8EDF5]",
    logout: "text-slate-600 hover:bg-rose-50 hover:text-rose-600",
    logoutIcon: "text-rose-500",
    toggle: "border-[#D9E1EC] bg-white text-[#294C86] hover:bg-[#F4F7FB]",
    glow: "bg-transparent",
    edge: "w-px bg-[#CBD6E6]",
  },
  supplier: {
    shell: "border-[#DDEBE5] bg-white shadow-[8px_0_32px_-20px_rgba(5,150,105,0.22)]",
    headerBorder: "border-[#E2EEE8]",
    logo: "bg-gradient-to-br from-[#34A853] to-[#16833A] text-white shadow-emerald-200",
    title: "text-[#123B24]",
    subtitle: "text-[#188341]",
    section: "text-[#188341]/65",
    active: "bg-[#16833A] text-white shadow-[0_8px_20px_-10px_rgba(22,131,58,0.8)]",
    activeIcon: "text-white",
    activeDot: "bg-white",
    inactive: "text-slate-600 hover:bg-emerald-50/60 hover:text-[#126B34]",
    inactiveIcon: "text-[#3A9A59]",
    footerBorder: "border-[#E2EEE8]",
    logout: "text-slate-600 hover:bg-rose-50 hover:text-rose-600",
    logoutIcon: "text-rose-500",
    toggle: "border-[#D4E7DC] bg-white text-[#188341] hover:bg-emerald-50",
    glow: "bg-transparent",
    edge: "w-px bg-[#CDE3D6]",
  },
  agent: {
    shell: "border-[#DBE5F2] bg-[#F8FAFD] shadow-[8px_0_32px_-20px_rgba(37,99,235,0.24)]",
    headerBorder: "border-[#E2EAF4]",
    logo: "bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-blue-200",
    title: "text-[#172554]",
    subtitle: "text-[#2563EB]",
    section: "text-[#2563EB]/65",
    active: "bg-[#2563EB] text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.75)]",
    activeIcon: "text-white",
    activeDot: "bg-white",
    inactive: "text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1E3A8A]",
    inactiveIcon: "text-[#4F7EDC]",
    footerBorder: "border-[#E2EAF4]",
    logout: "text-slate-600 hover:bg-rose-50 hover:text-rose-600",
    logoutIcon: "text-rose-500",
    toggle: "border-[#D8E3F1] bg-white text-[#2563EB] hover:bg-blue-50",
    glow: "bg-transparent",
    edge: "w-1 bg-gradient-to-b from-[#60A5FA] via-[#2563EB] to-[#1E3A8A]",
  },
  customer: {
    shell: "border-[#D9E9E6] bg-white shadow-[8px_0_32px_-20px_rgba(7,91,87,0.22)]",
    headerBorder: "border-[#E1EEEC]",
    logo: "bg-gradient-to-br from-[#0F8B83] to-[#075B57] text-white shadow-teal-200",
    title: "text-[#063C42]",
    subtitle: "text-[#075B57]",
    section: "text-[#075B57]/60",
    active: "bg-[#075B57] text-white shadow-[0_8px_20px_-10px_rgba(7,91,87,0.8)]",
    activeIcon: "text-white",
    activeDot: "bg-white",
    inactive: "text-slate-600 hover:bg-teal-50/70 hover:text-[#075B57]",
    inactiveIcon: "text-[#248E87]",
    footerBorder: "border-[#E1EEEC]",
    logout: "text-slate-600 hover:bg-rose-50 hover:text-rose-600",
    logoutIcon: "text-rose-500",
    toggle: "border-[#D5E7E4] bg-white text-[#075B57] hover:bg-teal-50",
    glow: "bg-transparent",
    edge: "w-1 bg-gradient-to-b from-[#075B57] via-[#0F8B83] to-[#F97316]",
  },
};

type TooltipState = { label: string; y: number } | null;

export default function Sidebar({
  navItems,
  title = "Tourvaa",
  subtitle = "Console",
  logoIcon: LogoIcon = MapPinned,
  mobile = false,
  collapsed = false,
  onToggleCollapse,
  theme = "admin",
}: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const colors = SIDEBAR_THEMES[theme];

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
        className={`group relative mx-3 flex h-12 items-center rounded-xl px-3.5 transition-all duration-200 ${
          active ? colors.active : colors.inactive
        } ${collapsed ? "mx-2 justify-center px-0" : ""}`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          <Icon
            className={`h-5 w-5 transition-colors ${active ? colors.activeIcon : colors.inactiveIcon}`}
            strokeWidth={1.8}
          />
        </span>
        {!collapsed && (
          <span className="ml-3.5 min-w-0 truncate text-[14px] font-semibold leading-none">
            {item.label}
          </span>
        )}
        {active && !collapsed && <span className={`absolute right-3 h-1.5 w-1.5 rounded-full ${colors.activeDot}`} />}
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
            <div className={`pb-2 pl-6 pt-5 text-[10px] font-black uppercase tracking-[0.16em] ${colors.section}`}>
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
        className={`left-0 top-0 z-40 h-screen flex-col border-r transition-all duration-300 ${colors.shell} ${
          mobile ? "flex w-65" : `fixed hidden lg:flex ${collapsed ? "w-20" : "w-65"}`
        }`}
      >
        <span className={`pointer-events-none absolute inset-y-0 right-0 z-10 ${colors.edge}`} />
        <div className={`pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl ${colors.glow}`} />
        {/* header */}
        <div
          className={`relative flex h-20 shrink-0 items-center border-b ${colors.headerBorder} ${
            collapsed ? "justify-center px-3" : "justify-between px-4"
          }`}
        >
          {collapsed ? (
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg ${colors.logo}`}>
              <LogoIcon size={18} strokeWidth={2.5} />
            </div>
          ) : (
            <Link href={dashboardHref} className="flex min-w-0 items-center gap-3 overflow-hidden">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg ${colors.logo}`}>
                <LogoIcon size={18} strokeWidth={2.5} />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <h1 className={`mb-1 truncate text-[18px] font-black leading-none tracking-tight ${colors.title}`}>
                  {title}
                </h1>
                <p className={`text-[9px] font-black uppercase leading-none tracking-[0.16em] ${colors.subtitle}`}>
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
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors ${colors.toggle} ${
                collapsed ? "absolute -right-3.5 top-6.5 z-50" : ""
              }`}
            >
              {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          )}
        </div>

        {/* nav + logout */}
        <div className="relative flex min-h-0 flex-1 flex-col pb-4 pt-3">
          <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
            {renderGroupedItems(mainItems)}
          </nav>

          <div className={`mt-2 shrink-0 space-y-1 border-t pt-3 ${colors.footerBorder}`}>
            {bottomItems.map((item, index) => renderSidebarItem(item, index))}
            <button
              type="button"
              onClick={() => logout()}
              onMouseEnter={(e) => showTooltip(e, "Logout")}
              onMouseLeave={hideTooltip}
              className={`flex h-12 w-full items-center rounded-xl px-3.5 transition ${colors.logout} ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                <LogOut className={`h-5 w-5 ${colors.logoutIcon}`} strokeWidth={1.8} />
              </span>
              {!collapsed && <span className="ml-3.5 text-[14px] font-semibold leading-none">Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Portal tooltip - renders outside the sidebar overflow context */}
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

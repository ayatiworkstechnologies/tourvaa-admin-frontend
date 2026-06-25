"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, MapPinned, LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon | React.ElementType;
  module?: string;
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
  
  // To avoid highlighting root dashboard if we are on a deeper path, we'll extract base path logic.
  // The first item usually is Dashboard.
  const dashboardHref = navItems[0]?.href || "/";

  return (
    <aside
      className={`left-0 top-0 z-40 h-screen flex-col border-r border-[#E7EAF0] bg-white shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ${
        mobile ? "flex w-[260px]" : `fixed hidden lg:flex ${collapsed ? "w-[80px]" : "w-[260px]"}`
      }`}
    >
      <div className="flex h-[80px] items-center justify-between px-6 border-b border-[#E7EAF0]">
        <Link href={dashboardHref} className={`flex items-center gap-3 overflow-hidden ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"} transition-all duration-300`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#43A9F6] text-white shadow-sm">
            <LogoIcon size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[19px] font-black tracking-tight text-[#121826] leading-none mb-1 whitespace-nowrap">
              {title}
            </h1>
            <p className="text-[10px] font-bold text-[#98A2B3] tracking-wider uppercase leading-none">
              {subtitle}
            </p>
          </div>
        </Link>
        
        {onToggleCollapse && !mobile && (
          <button 
            onClick={onToggleCollapse} 
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-[#F3F8FC] text-[#667085] transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between pb-6 pt-5">
        <nav className={`space-y-1.5 pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
        }`}>
          {!collapsed && (
            <div className="mb-3 pl-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                {subtitle} Menu
              </span>
            </div>
          )}
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== dashboardHref && pathname.startsWith(`${item.href}/`));
            const iconColorClass = iconColors[index % iconColors.length];

            return (
              <Link
                key={`${item.module || index}-${item.href}`}
                href={item.href}
                onClick={() => {
                  if (mobile) {
                    window.dispatchEvent(new Event("tourvaa:close-mobile-sidebar"));
                  }
                }}
                className={`group relative flex h-[44px] items-center gap-3.5 text-[14px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#43A9F6] text-white shadow-md"
                    : "text-[#667085] hover:bg-[#F3F8FC] hover:text-[#43A9F6]"
                } ${
                  collapsed 
                    ? "justify-center mx-3 rounded-xl px-0" 
                    : "rounded-r-full pl-6 pr-4 mr-3"
                }`}
              >
                <Icon size={collapsed ? 24 : 20} strokeWidth={active ? 2.5 : 2} className={`${collapsed ? "shrink-0" : ""} ${active ? "text-white" : "text-[#98A2B3] group-hover:text-[#43A9F6]"} transition-all duration-300`} />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                
                {/* Custom Tooltip */}
                {collapsed && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 hidden rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pr-4">
          <button
            type="button"
            onClick={() => logout("/")}
            className={`group relative flex w-full items-center gap-3.5 h-[44px] text-[14px] font-semibold text-[#667085] hover:text-[#43A9F6] hover:bg-[#F3F8FC] transition-all duration-200 ${
              collapsed 
                ? "justify-center mx-3 rounded-xl px-0" 
                : "rounded-r-full pl-6 pr-4 mr-3"
            }`}
          >
            <LogOut size={collapsed ? 24 : 20} strokeWidth={2} className={`${collapsed ? "shrink-0" : "text-[#98A2B3] group-hover:text-[#43A9F6]"} transition-all duration-300`} />
            {!collapsed && <span>Logout</span>}
            
            {/* Custom Tooltip */}
            {collapsed && (
               <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 hidden rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block whitespace-nowrap">
                 Logout
               </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}


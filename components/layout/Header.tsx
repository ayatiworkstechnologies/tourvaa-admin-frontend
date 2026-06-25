"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";
import NotificationInbox from "@/components/ui/NotificationInbox";
import { useAuth } from "@/hooks/useAuth";
import { MenuItem } from "@/types/auth";
import { getMenuHref } from "@/lib/navigation";
import { mediaUrl } from "@/lib/media-url";

type HeaderProps = {
  title?: string;
  name?: string;
  profileImage?: string;
  role?: string;
  menus?: MenuItem[];
  onMenuClick?: () => void;
  profileHref?: string;
  settingsHref?: string;
  theme?: "sky" | "emerald" | "orange";
};


export default function Header({
  title,
  name,
  profileImage,
  role,
  menus = [],
  onMenuClick,
  profileHref,
  settingsHref,
  theme = "sky",
}: HeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const allowedMenus = menus
    .map((menu) => ({
      ...menu,
      href: getMenuHref(menu),
    }))
    .filter((menu) => menu.href !== "/admin/dashboard" || menu.permission === "view-dashboard" || menu.permission === "dashboard.view");
  const currentMenu = allowedMenus.find((menu) => menu.href === pathname);
  const headerTitle = title || currentMenu?.label || "Dashboard";
  const canOpenSettings = settingsHref !== undefined ? !!settingsHref : allowedMenus.some((menu) => menu.href === "/admin/settings");
  const canOpenProfile = profileHref !== undefined ? !!profileHref : allowedMenus.some((menu) => menu.href === "/admin/profile");

  const colors = {
    sky: {
      textHover: "hover:text-[#43A9F6]",
      bgHover: "hover:bg-[#F3F8FC]",
      borderHover: "hover:border-[#43A9F6]/30",
      groupTextHover: "group-hover:text-[#43A9F6]",
      avatarBg: "bg-[#D7E8F5]",
      avatarText: "text-[#2F9FE9]",
      textActive: "text-[#43A9F6]",
    },
    emerald: {
      textHover: "hover:text-emerald-500",
      bgHover: "hover:bg-emerald-50",
      borderHover: "hover:border-emerald-500/30",
      groupTextHover: "group-hover:text-emerald-600",
      avatarBg: "bg-emerald-50",
      avatarText: "text-emerald-600",
      textActive: "text-emerald-600",
    },
    orange: {
      textHover: "hover:text-orange-500",
      bgHover: "hover:bg-orange-50",
      borderHover: "hover:border-orange-500/30",
      groupTextHover: "group-hover:text-orange-600",
      avatarBg: "bg-orange-50",
      avatarText: "text-orange-600",
      textActive: "text-orange-600",
    },
  }[theme];

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E7EAF0]/60 bg-white/75 backdrop-blur-xl px-5 md:px-9">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E7EAF0] bg-white text-[#121826] lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#121826] md:text-[28px]">
            {headerTitle}
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-[#8B93A1]">
            {role || "Role based access"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {canOpenSettings && (
          <button
            type="button"
            onClick={() => router.push(settingsHref || "/admin/settings")}
            className={`hidden h-11 w-11 items-center justify-center rounded-lg bg-white text-[#6B7280] ${colors.textHover} sm:flex`}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        )}

        <NotificationInbox />

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`group flex items-center gap-3 rounded-xl bg-white py-1.5 pl-1.5 pr-4 border border-[#E7EAF0]/60 shadow-[0_2px_8px_rgb(0,0,0,0.02)] ${colors.borderHover} hover:shadow-md transition-all duration-300`}
          >
            {profileImage && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(profileImage)}
                alt={name || "Profile"}
                className="h-11 w-11 rounded-lg object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg ${colors.avatarBg} font-bold ${colors.avatarText}`}>
                {name?.charAt(0) || "S"}
              </div>
            )}

            <div className="hidden text-left md:block">
              <p className="text-sm font-bold text-[#121826]">{name}</p>
              <p className="text-xs text-[#8B93A1]">{role}</p>
            </div>

            <ChevronDown size={16} className={`text-[#6B7280] ${colors.groupTextHover} transition-colors`} />
          </button>

          {open && (
            <div className="absolute right-0 top-16 z-50 w-56 rounded-2xl border border-[#E7EAF0] bg-white p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              {canOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(profileHref || "/admin/profile");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#667085] ${colors.bgHover} hover:${colors.textActive} transition-colors`}
                >
                  <User size={18} />
                  Profile
                </button>
              )}

              {canOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(settingsHref || "/admin/settings");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#667085] ${colors.bgHover} hover:${colors.textActive} transition-colors`}
                >
                  <Settings size={18} />
                  Settings
                </button>
              )}

              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}




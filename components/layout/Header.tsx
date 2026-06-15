"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MenuItem } from "@/types/auth";
import { mediaUrl } from "@/lib/media-url";

type HeaderProps = {
  title?: string;
  name?: string;
  profileImage?: string;
  role?: string;
  menus: MenuItem[];
  onMenuClick?: () => void;
};

const menuHrefByPermission: Record<string, string> = {
  "view-dashboard": "/dashboard",
  "view-users": "/users",
  "view-roles": "/roles",
  "view-permissions": "/permissions",
  "view-email": "/email-templates",
  "view-settings": "/settings",
  "view-profile": "/profile",
};

function getMenuHref(menu: MenuItem) {
  return menuHrefByPermission[menu.permission] || "/dashboard";
}

export default function Header({
  title,
  name,
  profileImage,
  role,
  menus,
  onMenuClick,
}: HeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const allowedMenus = menus
    .map((menu) => ({
      ...menu,
      href: getMenuHref(menu),
    }))
    .filter((menu) => menu.href !== "/dashboard" || menu.permission === "view-dashboard");
  const currentMenu = allowedMenus.find((menu) => menu.href === pathname);
  const headerTitle = title || currentMenu?.label || "Dashboard";
  const canOpenSettings = allowedMenus.some((menu) => menu.permission === "view-settings");
  const canOpenProfile = allowedMenus.some((menu) => menu.permission === "view-profile");

  return (
    <header className="flex h-[92px] items-center justify-between bg-[#F7F9FC] px-5 md:px-9">
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
            onClick={() => router.push("/settings")}
            className="hidden h-11 w-11 items-center justify-center rounded-lg bg-white text-[#6B7280] hover:text-[#43A9F6] sm:flex"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        )}

        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#6B7280] hover:text-[#43A9F6]"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 rounded-lg bg-white py-1 pl-1 pr-3"
          >
            {profileImage ? (
              <img
                src={mediaUrl(profileImage)}
                alt={name || "Profile"}
                className="h-11 w-11 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-[#DDF1FF] font-bold text-[#2F9FE9]">
                {name?.charAt(0) || "S"}
              </div>
            )}

            <div className="hidden text-left md:block">
              <p className="text-sm font-bold text-[#121826]">{name}</p>
              <p className="text-xs text-[#8B93A1]">{role}</p>
            </div>

            <ChevronDown size={16} className="text-[#6B7280]" />
          </button>

          {open && (
            <div className="absolute right-0 top-14 z-50 w-52 rounded-xl border border-[#E7EAF0] bg-white p-2 shadow-xl">
              {canOpenProfile && (
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5F6673] hover:bg-[#F3F8FC]"
                >
                  <User size={16} />
                  Profile
                </button>
              )}

              {canOpenSettings && (
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5F6673] hover:bg-[#F3F8FC]"
                >
                  <Settings size={16} />
                  Settings
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

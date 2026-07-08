"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuChevronDown as ChevronDown, LuLogOut as LogOut, LuMenu as Menu, LuSettings as Settings, LuUser as User } from "react-icons/lu";
import NotificationInbox from "@/components/ui/NotificationInbox";
import { useAuth } from "@/hooks/useAuth";
import { MenuItem } from "@/types/auth";
import { getMenuHref } from "@/lib/constants/navigation";
import { mediaUrl } from "@/lib/utils/mediaUrl";

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


const AVATAR_BG: Record<string, string> = {
  sky:     "bg-[#DAEFFE] text-[#1E86D4]",
  emerald: "bg-emerald-50 text-emerald-600",
  orange:  "bg-orange-50  text-orange-600",
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

  const allowedMenus = menus.map((m) => ({ ...m, href: getMenuHref(m) }));

  // exact match first, then prefix match for nested routes
  const currentMenu =
    allowedMenus.find((m) => m.href === pathname) ??
    allowedMenus
      .filter((m) => m.href !== "/" && pathname.startsWith(m.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0];

  // derive title from the last meaningful path segment when no menu matches
  const pathTitle = (() => {
    const parts = pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? "";
    if (/^\d+$/.test(last)) {
      // numeric ID segment → use parent segment + "#id"
      const parent = parts[parts.length - 2] ?? "";
      return `${parent.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} #${last}`;
    }
    return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  })();

  const headerTitle = title || currentMenu?.label || pathTitle || "Dashboard";
  const canSettings  = settingsHref !== undefined ? !!settingsHref : allowedMenus.some((m) => m.href === "/admin/settings");
  const canProfile   = profileHref  !== undefined ? !!profileHref  : allowedMenus.some((m) => m.href === "/admin/profile");

  const avatarColors = AVATAR_BG[theme] ?? AVATAR_BG.sky;
  const initial = name?.charAt(0)?.toUpperCase() ?? "A";

  return (
    <header className="sticky top-0 z-30 border-b border-[#E8ECF3] bg-white shadow-[0_1px_6px_-1px_rgba(15,23,42,0.06)]">
      <div className="flex h-[70px] items-center justify-between px-6 md:px-9">

        {/* left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8ECF3] bg-white text-[#64748B] shadow-sm hover:bg-dash-bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-extrabold leading-tight tracking-tight text-[#0C1524]">
              {headerTitle}
            </h1>
            <p className="mt-0.5 text-[12px] font-medium text-[#94A3B8]">{role}</p>
          </div>
        </div>

        {/* right */}
        <div className="flex shrink-0 items-center gap-2">

          {canSettings && (
            <button
              type="button"
              onClick={() => router.push(settingsHref ?? "/admin/settings")}
              className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#475569] sm:flex"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          )}

          <NotificationInbox />

          {/* vertical rule */}
          <div className="mx-1 hidden h-7 w-px bg-[#E8ECF3] sm:block" />

          {/* User dropdown trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-3 rounded-2xl border bg-white py-1.5 pl-1.5 pr-3 transition-all duration-200 hover:shadow-md ${
                open ? "border-dash-brand/50 shadow-md ring-2 ring-dash-brand/15" : "border-[#E8ECF3] shadow-sm hover:border-[#C5D2DF]"
              }`}
            >
              {/* Avatar — same height as title block */}
              {profileImage && !imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(profileImage)}
                  alt={name ?? "Profile"}
                  className="h-9 w-9 rounded-xl object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[14px] font-extrabold ${avatarColors}`}>
                  {initial}
                </div>
              )}

              {/* Name + role — same rhythm as left title block */}
              <div className="hidden flex-col text-left md:flex">
                <span className="text-[15px] font-bold leading-tight text-[#0C1524]">{name}</span>
                <span className="mt-0.5 text-[12px] font-medium leading-tight text-[#94A3B8]">{role}</span>
              </div>

              <ChevronDown size={14} className={`ml-0.5 text-[#94A3B8] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-14.5 z-50 w-60 overflow-hidden rounded-2xl border border-[#E8ECF3] bg-white shadow-[0_16px_48px_-8px_rgba(15,23,42,0.16)]">
                  {/* identity header */}
                  <div className="flex items-center gap-3 border-b border-[#F0F4F8] px-4 py-3.5">
                    {profileImage && !imageFailed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(profileImage)}
                        alt={name ?? "Profile"}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                        onError={() => setImageFailed(true)}
                      />
                    ) : (
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${avatarColors}`}>
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#0C1524]">{name}</p>
                      <p className="text-[12px] text-[#94A3B8]">{role}</p>
                    </div>
                  </div>

                  <div className="p-1.5">
                    {canProfile && (
                      <button
                        type="button"
                        onClick={() => { setOpen(false); router.push(profileHref ?? "/admin/profile"); }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#334155] hover:bg-dash-bg-muted"
                      >
                        <User size={15} className="shrink-0 text-[#94A3B8]" />
                        Profile
                      </button>
                    )}
                    {canSettings && (
                      <button
                        type="button"
                        onClick={() => { setOpen(false); router.push(settingsHref ?? "/admin/settings"); }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#334155] hover:bg-dash-bg-muted"
                      >
                        <Settings size={15} className="shrink-0 text-[#94A3B8]" />
                        Settings
                      </button>
                    )}
                    <div className="my-1.5 border-t border-[#F0F4F8]" />
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                    >
                      <LogOut size={15} className="shrink-0" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}




"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuHeart as Heart,
  LuLogOut as LogOut,
  LuScale as Scale,
  LuUserRound as User,
} from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import LanguageCurrencySelector from "@/components/public/LanguageCurrencySelector";
import NotificationInbox from "@/components/ui/NotificationInbox";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import CustomerAvatar from "./CustomerAvatar";

export type PortalHeaderLink = { label: string; href: string; icon: IconType; count?: number };

type CustomerPortalHeaderProps = {
  /** Icon links left of the currency picker. Defaults to Wishlist + Compare. */
  quickLinks?: PortalHeaderLink[];
  /** "Profile Settings" target in the profile menu. */
  profileHref?: string;
  /** Notification bell (same inbox as the admin/partner headers). */
  showNotifications?: boolean;
};

/** Top bar shared by the customer and agent portals (public-site style). */
export default function CustomerPortalHeader({ quickLinks, profileHref = "/customer/profile", showNotifications = false }: CustomerPortalHeaderProps = {}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthContext();
  const { wishlistCount, compareCount } = useTravelStore();
  const links: PortalHeaderLink[] = quickLinks ?? [
    { label: "Wishlist", href: "/customer/wishlist", icon: Heart, count: wishlistCount },
    { label: "Compare", href: "/compare", icon: Scale, count: compareCount },
  ];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      )
        setProfileOpen(false);
    };
    const escape = (event: KeyboardEvent) =>
      event.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white text-slate-900 shadow-xs">
      {/* Right padding keeps the last items (Profile) clear of the floating
          Elfsight "EN" language picker, which is fixed to the top-right corner. */}
      <div className="mx-auto flex h-20 max-w-[1440px] min-w-0 items-center justify-between gap-4 pl-6 pr-[132px] sm:h-[84px] lg:pl-8 lg:pr-[150px]">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-[#0B1527]"
        >
          Tourvaa
        </Link>
        {/* Keep this action cluster out of the dedicated top-right lane used
            by the fixed Elfsight language picker.  The explicit margin is
            needed because a long account name/profile control can otherwise
            grow over that externally positioned widget. */}
        <nav className="mr-[108px] flex min-w-0 items-center gap-3 sm:gap-5">
          {links.map(({ label, href, icon: Icon, count }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col items-center gap-1 text-[10px] font-semibold text-[#0f2439] hover:text-[#E16B2D] transition-colors"
            >
              <Icon
                size={18}
                className="text-[#0f2439] stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-[#E16B2D]"
              />
              <span>{label}</span>
              {!!count && count > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E16B2D] px-1 text-[8px] font-black text-white shadow-xs">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          ))}
          {showNotifications && <NotificationInbox />}
          <div className="flex items-center">
            <LanguageCurrencySelector />
          </div>
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="group flex flex-col items-center gap-1 text-[10px] font-semibold text-[#0f2439] hover:text-[#E16B2D] transition-colors"
            >
              <User
                size={18}
                className="text-[#0f2439] stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-[#E16B2D]"
              />
              <span>Profile</span>
            </button>
            {profileOpen && (
              <div
                role="menu"
                className="profile-dropdown-panel absolute right-0 top-[calc(100%+14px)] w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-[0_20px_55px_rgba(15,23,42,.18)]"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 px-3 pb-3 pt-2">
                  <CustomerAvatar
                    name={user?.name || "Explorer"}
                    src={user?.profile_image}
                    size="sm"
                    showBadge
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-slate-900">
                      {user?.name || "My Account"}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {user?.email || "Manage your account"}
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    role="menuitem"
                    href={profileHref}
                    onClick={() => setProfileOpen(false)}
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-slate-700 transition hover:bg-orange-50 hover:text-[#E16B2D]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#E16B2D] transition group-hover:bg-[#E16B2D] group-hover:text-white">
                      <User size={16} />
                    </span>
                    Profile Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
                      <LogOut size={16} />
                    </span>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  LuHeart as Heart,
  LuLogOut as LogOut,
  LuScale as Scale,
  LuUserRound as User,
} from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import LanguageCurrencySelector from "@/components/public/LanguageCurrencySelector";
import { useTravelStore } from "@/providers/TravelStoreProvider";

export default function CustomerPortalHeader() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthContext();
  const { wishlistCount, compareCount } = useTravelStore();

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white text-slate-900 shadow-xs">
      <div className="mx-auto flex h-20 max-w-[1440px] min-w-0 items-center justify-between gap-4 px-6 sm:h-[84px] lg:px-8">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-[#0B1527]">
          Tourvaa
        </Link>
        <nav className="flex items-center gap-5 sm:gap-7">
          <Link href="/customer/wishlist" className="group relative flex flex-col items-center gap-1 text-[10px] font-semibold text-[#0f2439] hover:text-[#E4572E] transition-colors">
            <Heart size={18} className="text-[#0f2439] stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-[#E4572E]" />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E4572E] px-1 text-[8px] font-black text-white shadow-xs">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/compare" className="group relative flex flex-col items-center gap-1 text-[10px] font-semibold text-[#0f2439] hover:text-[#E4572E] transition-colors">
            <Scale size={18} className="text-[#0f2439] stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-[#E4572E]" />
            <span>Compare</span>
            {compareCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E4572E] px-1 text-[8px] font-black text-white shadow-xs">
                {compareCount}
              </span>
            )}
          </Link>
          <div className="flex items-center">
            <LanguageCurrencySelector />
          </div>
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="group flex flex-col items-center gap-1 text-[10px] font-semibold text-[#0f2439] hover:text-[#E4572E] transition-colors"
            >
              <User size={18} className="text-[#0f2439] stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-[#E4572E]" />
              <span>Profile</span>
            </button>
            {profileOpen && (
              <div
                role="menu"
                className="profile-dropdown-panel absolute right-0 top-[calc(100%+14px)] w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-[0_20px_55px_rgba(15,23,42,.18)]"
              >
                <div className="border-b border-slate-100 px-3 pb-3 pt-2">
                  <p className="truncate text-sm font-black">{user?.name || "My Tourvaa"}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Manage your account</p>
                </div>
                <div className="pt-2">
                  <Link
                    role="menuitem"
                    href="/customer/profile"
                    onClick={() => setProfileOpen(false)}
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-slate-700 transition hover:bg-orange-50 hover:text-[#E4572E]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#E4572E] transition group-hover:bg-[#E4572E] group-hover:text-white">
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

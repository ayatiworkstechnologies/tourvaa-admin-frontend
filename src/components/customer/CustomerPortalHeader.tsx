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
import CurrencySelector from "@/components/public/CurrencySelector";
import { useCurrency } from "@/hooks/useCurrency";
import { useTravelStore } from "@/providers/TravelStoreProvider";

export default function CustomerPortalHeader() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthContext();
  const { wishlistCount, compareCount } = useTravelStore();
  const { symbol: currencySymbol } = useCurrency();

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white/95 text-slate-900 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1480px] min-w-0 items-center justify-between gap-4 py-2 pl-4 pr-6 sm:h-[92px] sm:pl-7 lg:pl-12">
        <Link href="/customer/dashboard" className="text-2xl font-black tracking-tight text-[#1478f2]">
          Tourvaa
        </Link>
        <nav className="flex items-center gap-4 lg:gap-6">
          <Link href="/customer/wishlist" className="group relative flex flex-col items-center gap-1 text-[9px] font-semibold">
            <Heart size={17} className="transition group-hover:-translate-y-1 group-hover:text-blue-600" />
            Wishlist
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/compare" className="group relative flex flex-col items-center gap-1 text-[9px] font-semibold">
            <Scale size={17} className="transition group-hover:-translate-y-1 group-hover:text-blue-600" />
            Compare
            {compareCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
                {compareCount}
              </span>
            )}
          </Link>
          <span className="flex items-center gap-1 text-[9px] font-semibold">
            <span className="text-[15px] leading-none" aria-hidden="true">{currencySymbol}</span>
            <CurrencySelector plain />
          </span>
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="group flex flex-col items-center gap-0.5 text-[9px] font-semibold"
            >
              <User size={17} className="transition group-hover:-translate-y-1 group-hover:text-blue-600" />
              Profile
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
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      <User size={16} />
                    </span>
                    Profile
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

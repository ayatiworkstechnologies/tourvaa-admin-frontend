"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LuChevronDown as ChevronDown,
  LuHeart as Heart,
  LuLogOut as LogOut,
  LuMenu as Menu,
  LuSearch as Search,
  LuUserRound as UserRound,
} from "react-icons/lu";
import CurrencySelector from "@/components/public/CurrencySelector";
import NotificationInbox from "@/components/ui/NotificationInbox";
import { useAuth } from "@/hooks/useAuth";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";

type CustomerPortalHeaderProps = {
  name?: string;
  profileImage?: string;
  onMenuClick: () => void;
};

export default function CustomerPortalHeader({ name, profileImage, onMenuClick }: CustomerPortalHeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { wishlistCount } = useTravelStore();
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/tours?search=${encodeURIComponent(value)}` : "/tours");
  }

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-[#DFE8F4] bg-white/96 backdrop-blur-xl sm:h-[92px]">
      <div className="flex h-full min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-6 xl:px-8">
        <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#15315A] hover:bg-blue-50">
          <Menu size={22} />
        </button>

        <form onSubmit={search} className="relative hidden max-w-[525px] flex-1 md:block">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6980A2]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search destinations, tours, and experiences"
            placeholder="Search destinations, tours, experiences..."
            className="h-12 w-full rounded-xl border border-[#CEDAEA] bg-white pl-12 pr-4 text-sm text-[#10264B] outline-none transition placeholder:text-[#7184A3] focus:border-[#1478F2] focus:ring-4 focus:ring-blue-50"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden rounded-xl border border-[#D9E3EF] px-2 py-1 sm:block [&_select]:h-8 [&_select]:min-w-16 [&_select]:border-0 [&_select]:bg-transparent [&_select]:font-bold [&_select]:text-[#10264B]">
            <CurrencySelector />
          </div>
          <NotificationInbox />
          <HeaderLink href="/customer/wishlist" label="Wishlist" count={wishlistCount} icon={Heart} />
          <div className="mx-1 hidden h-8 w-px bg-[#E0E8F2] sm:block" />

          <div className="relative">
            <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-blue-50 sm:gap-3">
              {profileImage && !imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(profileImage)} alt={name || "Profile"} onError={() => setImageFailed(true)} className="h-11 w-11 rounded-full object-cover ring-4 ring-slate-100" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-blue-200 text-sm font-black text-blue-700 ring-4 ring-slate-100">
                  {name?.charAt(0)?.toUpperCase() || "T"}
                </span>
              )}
              <span className="hidden text-left xl:block">
                <b className="block max-w-36 truncate text-[13px] text-[#0C2043]">{name || "Traveller"}</b>
                <span className="text-[11px] text-[#677B9B]">Traveller</span>
              </span>
              <ChevronDown size={14} className={`hidden text-[#617897] transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <>
                <button type="button" aria-label="Close profile menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-14 z-50 w-[min(14rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#E0E8F2] bg-white p-2 shadow-[0_18px_55px_-16px_rgba(15,39,80,.35)]">
                  <div className="border-b border-slate-100 px-3 pb-3 pt-2">
                    <p className="truncate text-sm font-black text-[#10264B]">{name || "Traveller"}</p>
                    <p className="mt-0.5 text-xs text-slate-400">Tourvaa traveller</p>
                  </div>
                  <Link href="/customer/profile" onClick={() => setProfileOpen(false)} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">
                    <UserRound size={16} /> My Profile
                  </Link>
                  <button type="button" onClick={() => logout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, label, count, icon: Icon }: { href: string; label: string; count: number; icon: React.ElementType }) {
  return (
    <Link href={href} aria-label={label} className="relative hidden h-11 w-11 items-center justify-center rounded-xl text-[#50698E] transition hover:bg-blue-50 hover:text-[#0865D9] sm:flex">
      <Icon size={21} />
      {count > 0 && (
        <span className="absolute right-1.5 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#0768E8] px-1 text-[9px] font-black text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

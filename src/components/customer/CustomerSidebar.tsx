"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuHeart as Heart,
  LuLogOut as LogOut,
  LuTicket as Ticket,
  LuUserRound as UserRound,
} from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { mediaUrl } from "@/lib/utils/mediaUrl";

type CustomerSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

const navigation = [
  { label: "My Profile", href: "/customer/dashboard", icon: UserRound },
  { label: "My Bookings", href: "/customer/bookings", icon: Ticket },
  { label: "Wishlist", href: "/customer/wishlist", icon: Heart },
] as const;

export default function CustomerSidebar({ mobile = false, onNavigate }: CustomerSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  const displayName = user?.name || "Srinath";
  const displayEmail = user?.email || "srinath@tourvaa.com";

  return (
    <aside className={`${mobile ? "relative flex h-full" : "fixed inset-y-0 top-20 sm:top-[92px] left-0 hidden lg:flex"} z-40 w-[240px] flex-col p-4 bg-transparent`}>
      {/* Top User Profile Card */}
      <div className="flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="relative mb-3">
          {user?.profile_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(user.profile_image)}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
            />
          )}
        </div>
        <h3 className="text-sm font-bold text-slate-900 truncate max-w-[170px]">{displayName}</h3>
        <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Verified Explorer</p>
        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[170px]">{displayEmail}</p>
      </div>

      {/* Navigation Links */}
      <nav className="mt-4 flex flex-col gap-1">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/customer/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                active
                  ? "bg-[#EEF4FE] text-[#1464F4]"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className={active ? "text-[#1464F4]" : "text-slate-500"} />
                <span>{label}</span>
              </div>
              {active && <span className="h-4 w-1 rounded-full bg-[#1464F4]" />}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 mt-1"
        >
          <LogOut size={16} className="text-slate-500" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}

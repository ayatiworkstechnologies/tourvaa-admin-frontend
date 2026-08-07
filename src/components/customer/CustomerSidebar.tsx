"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuCalendarDays as CalendarDays,
  LuHeart as Heart,
  LuLogOut as LogOut,
  LuSettings as Settings,
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
  { label: "My Bookings", href: "/customer/bookings", icon: CalendarDays },
  { label: "Wishlist", href: "/customer/wishlist", icon: Heart },
  { label: "Settings", href: "/customer/profile", icon: Settings },
] as const;

export default function CustomerSidebar({ mobile = false, onNavigate }: CustomerSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  return (
    <aside className={`${mobile ? "relative flex h-full" : "fixed inset-y-0 top-20 left-0 hidden lg:flex"} z-40 w-[250px] flex-col border-r border-[#DDE7F4] bg-white`}>
      <div className="flex flex-col items-center gap-3 border-b border-[#E7EEF7] px-6 pb-6 pt-8 text-center">
        {user?.profile_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(user.profile_image)} alt={user.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-slate-100" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-blue-200 text-2xl font-black text-blue-700 ring-4 ring-slate-100">
            {user?.name?.charAt(0)?.toUpperCase() || "T"}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-black text-[#0C2043]">{user?.name || "Traveller"}</p>
          <p className="truncate text-[12px] text-[#6B7F9D]">{user?.email}</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scrollbar-none">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/customer/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`mb-1 flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition ${
                active
                  ? "bg-linear-to-r from-[#0D6FEF] to-[#0878F6] text-white shadow-[0_8px_18px_-10px_rgba(13,111,239,.75)]"
                  : "text-[#385070] hover:bg-[#F2F7FF] hover:text-[#0865D9]"
              }`}
            >
              <Icon size={18} className={active ? "text-white" : "text-[#3984F5]"} />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => logout()}
          className="mt-1 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-[#385070] transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </nav>
    </aside>
  );
}

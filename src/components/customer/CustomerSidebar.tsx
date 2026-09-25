"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  LuClock as Clock,
  LuHeart as Heart,
  LuLock as Lock,
  LuLogOut as LogOut,
  LuShieldCheck as ShieldCheck,
  LuTicket as Ticket,
  LuUserRound as UserRound,
} from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import CustomerAvatar from "./CustomerAvatar";

export type PortalNavItem = {
  label: string;
  href: string;
  icon: IconType;
  /** Extra path prefixes that also mark this item active. */
  alsoActiveFor?: string[];
  /** Shown greyed out with a lock and not clickable (e.g. agent not yet approved). */
  locked?: boolean;
};

type CustomerSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  /** Defaults to the customer portal's links; the agent portal passes its own. */
  navigation?: PortalNavItem[];
  /** Status pill under the name, e.g. "Verified Explorer" / "Travel Agent". */
  badgeLabel?: string;
  /** Amber pill instead of the green one (e.g. "Under Review"). */
  badgeTone?: "verified" | "pending";
  /** Short message shown above the links (e.g. why items are locked). */
  notice?: React.ReactNode;
};

const customerNavigation: PortalNavItem[] = [
  { label: "My Profile", href: "/customer/dashboard", icon: UserRound, alsoActiveFor: ["/customer/profile"] },
  { label: "My Bookings", href: "/customer/bookings", icon: Ticket },
  { label: "Wishlist", href: "/customer/wishlist", icon: Heart },
];

/** Left-hand portal navigation (profile card + links) shared by the customer
 * and agent portals, so both use the same public-site style shell. */
export default function CustomerSidebar({
  mobile = false,
  onNavigate,
  navigation = customerNavigation,
  badgeLabel = "Verified Explorer",
  badgeTone = "verified",
  notice,
}: CustomerSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  const displayName = user?.name || "Explorer";
  const displayEmail = user?.email || "explorer@tourvaa.com";

  return (
    <aside className={`${mobile ? "relative flex h-full" : "fixed inset-y-0 top-20 sm:top-[84px] left-0 hidden lg:flex"} z-40 w-[240px] flex-col overflow-y-auto p-4 bg-transparent`}>
      {/* Top User Profile Card */}
      <div className="flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="relative mb-3">
          <CustomerAvatar
            name={displayName}
            src={user?.profile_image}
            size="lg"
            showBadge
          />
        </div>
        <h3 className="text-sm font-bold text-slate-900 truncate max-w-[170px]">{displayName}</h3>
        <div className={`inline-flex items-center gap-1 mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeTone === "pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-600"}`}>
          {badgeTone === "pending"
            ? <Clock size={11} className="text-amber-500 stroke-[2.5]" />
            : <ShieldCheck size={11} className="text-emerald-500 stroke-[2.5]" />}
          <span>{badgeLabel}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[170px]">{displayEmail}</p>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] leading-4 text-amber-800">
          {notice}
        </div>
      )}

      {/* Navigation Links */}
      <nav className="mt-4 flex flex-col gap-1">
        {navigation.map(({ label, href, icon: Icon, alsoActiveFor, locked }) => {
          if (locked) {
            return (
              <div
                key={href}
                aria-disabled="true"
                title="Available once your account is approved"
                className="flex cursor-not-allowed items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400"
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-slate-300" />
                  <span>{label}</span>
                </div>
                <Lock size={13} className="text-slate-300" />
              </div>
            );
          }
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (alsoActiveFor ?? []).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
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

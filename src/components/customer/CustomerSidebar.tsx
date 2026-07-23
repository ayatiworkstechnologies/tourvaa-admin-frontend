"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuArrowRight as ArrowRight,
  LuCalendarDays as CalendarDays,
  LuCircleHelp as CircleHelp,
  LuCreditCard as CreditCard,
  LuHeadphones as Headphones,
  LuHeart as Heart,
  LuLayoutDashboard as LayoutDashboard,
  LuLogOut as LogOut,
  LuMapPinned as MapPinned,
  LuReceiptText as ReceiptText,
  LuSparkles as Sparkles,
  LuUserRound as UserRound,
  LuUsersRound as UsersRound,
} from "react-icons/lu";
import { useAuth } from "@/hooks/useAuth";

type CustomerSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

const navigation = [
  { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { label: "Browse Tours", href: "/tours", icon: MapPinned, section: "My Travel" },
  { label: "My Bookings", href: "/customer/bookings", icon: CalendarDays },
  { label: "Travellers", href: "/customer/travellers", icon: UsersRound },
  { label: "Saved Items", href: "/customer/wishlist", icon: Heart },
  { label: "Payments", href: "/customer/payments", icon: CreditCard, section: "Billing" },
  { label: "Invoices", href: "/customer/invoices", icon: ReceiptText },
  { label: "Support Tickets", href: "/customer/support", icon: Headphones, section: "Support" },
  { label: "Help Center", href: "/contact", icon: CircleHelp },
  { label: "My Profile", href: "/customer/profile", icon: UserRound, section: "Account" },
] as const;

export default function CustomerSidebar({ mobile = false, onNavigate }: CustomerSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className={`${mobile ? "relative flex" : "fixed inset-y-0 left-0 hidden lg:flex"} z-40 w-[250px] flex-col border-r border-[#DDE7F4] bg-white`}>
      <div className="flex h-[92px] shrink-0 items-center border-b border-[#E7EEF7] px-8">
        <Link href="/" onClick={onNavigate} className="group">
          <span className="flex items-start text-[29px] font-black leading-none tracking-[-0.06em] text-[#0865D9]">
            Tourvaa
            <span className="ml-1 mt-[-2px] text-sm transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">✈</span>
          </span>
          <span className="mt-1 block text-[10px] font-semibold tracking-wide text-[#0D2145]">Your World. Your Way.</span>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-3 scrollbar-none">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#E6EEF9] bg-white p-3 shadow-[0_6px_20px_-14px_rgba(27,87,175,.6)]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#0D73F6] to-[#0757D6] text-white shadow-lg shadow-blue-200">
            <Sparkles size={21} />
          </span>
          <span>
            <b className="block text-[14px] text-[#0D2145]">My Tourvaa</b>
            <span className="text-[11px] font-medium text-[#496080]">Traveller Portal</span>
          </span>
        </div>

        <nav>
          {navigation.map(({ label, href, icon: Icon, ...item }) => {
            const active = pathname === href || (href.startsWith("/customer/") && pathname.startsWith(`${href}/`));
            return (
              <div key={href}>
                {"section" in item && item.section && (
                  <p className="px-3 pb-2 pt-4 text-[10px] font-black uppercase tracking-[.14em] text-[#2475E8]">{item.section}</p>
                )}
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={`group mb-1 flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition ${
                    active
                      ? "bg-linear-to-r from-[#0D6FEF] to-[#0878F6] text-white shadow-[0_8px_18px_-10px_rgba(13,111,239,.75)]"
                      : "text-[#385070] hover:bg-[#F2F7FF] hover:text-[#0865D9]"
                  }`}
                >
                  <Icon size={18} className={active ? "text-white" : "text-[#3984F5]"} />
                  <span className="flex-1">{label}</span>
                  {active && <ArrowRight size={14} />}
                </Link>
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => logout()}
          className="mt-2 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-[#385070] transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={18} />
          Sign out
        </button>

        <div className="relative mt-3 overflow-hidden rounded-xl bg-[#075FD1] p-4 text-white shadow-lg shadow-blue-100">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=500&q=80')] bg-cover bg-center opacity-35" />
          <div className="absolute inset-0 bg-linear-to-r from-[#075FD1] via-[#075FD1]/90 to-[#075FD1]/35" />
          <div className="relative">
            <p className="text-sm font-black leading-tight">Plan your next adventure</p>
            <p className="mt-2 max-w-36 text-[10px] leading-4 text-white/85">Explore top destinations and exclusive offers.</p>
            <Link href="/tours" onClick={onNavigate} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[10px] font-black text-[#0865D9]">
              Explore Tours <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

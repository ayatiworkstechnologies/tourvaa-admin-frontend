"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Grid2X2,
  KeyRound,
  LogOut,
  Mail,
  MapPinned,
  Settings,
  Shield,
  Tags,
  Ticket,
  UserRound,
  Users,
  UsersRound,
  Warehouse,
} from "lucide-react";
import { MenuItem } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { useAuthContext } from "@/providers/AuthProvider";

type SidebarProps = {
  menus: MenuItem[];
  mobile?: boolean;
};

const defaultMenus = [
  {
    label: "Dashboard",
    permission: "view-dashboard",
    href: "/dashboard",
    icon: Grid2X2,
  },
  {
    label: "Users",
    permission: "view-users",
    href: "/users",
    icon: Users,
  },
  {
    label: "Customers",
    permission: "view-customers",
    href: "/customers",
    icon: UsersRound,
  },
  {
    label: "Suppliers",
    permission: "suppliers.view",
    href: "/suppliers",
    icon: Warehouse,
  },
  {
    label: "Agents",
    permission: "agents.view",
    href: "/agents",
    icon: UsersRound,
  },
  {
    label: "Affiliates",
    permission: "affiliates.view",
    href: "/affiliates",
    icon: Ticket,
  },
  {
    label: "Tours",
    permission: "tours.view",
    href: "/tours",
    icon: MapPinned,
  },
  {
    label: "Categories",
    permission: "categories.view",
    href: "/tours/categories",
    icon: Tags,
  },
  {
    label: "Roles",
    permission: "view-roles",
    href: "/roles",
    icon: Shield,
  },
  {
    label: "Permissions",
    permission: "view-permissions",
    href: "/permissions",
    icon: KeyRound,
  },
  {
    label: "Email Templates",
    permission: "view-email",
    href: "/email-templates",
    icon: Mail,
  },
  {
    label: "Reports",
    permission: "view-reports",
    href: "/reports",
    icon: FileText,
  },
  {
    label: "Settings",
    permission: "view-settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Countries",
    permission: "countries.view",
    href: "/settings/countries",
    icon: FileText,
  },
  {
    label: "Cities",
    permission: "cities.view",
    href: "/settings/cities",
    icon: FileText,
  },
  {
    label: "Profile",
    permission: "view-profile",
    href: "/profile",
    icon: UserRound,
  },
];

export default function Sidebar({ menus, mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { hasPermission } = useAuthContext();
  const allowedMenus = defaultMenus.filter((item) =>
    menus.some((menu) => menu.permission === item.permission) || hasPermission(item.permission)
  );

  return (
    <aside
      className={`left-0 top-0 z-40 h-screen w-[236px] flex-col border-r border-[#E7EAF0] bg-white ${
        mobile ? "flex" : "fixed hidden lg:flex"
      }`}
    >
      <Link href="/dashboard" className="flex items-center gap-3 px-7 py-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#43A9F6] text-white">
          <MapPinned size={20} fill="currentColor" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#121826]">
            Tourvaa
          </h1>
          <p className="text-xs font-medium text-[#98A2B3]">Travel console</p>
        </div>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col justify-between px-4 pb-6">
        <nav className="space-y-1 overflow-y-auto pr-1">
          {allowedMenus.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={`${item.permission}-${item.label}`}
                href={item.href}
                onClick={() => {
                  if (mobile) {
                    window.dispatchEvent(new Event("tourvaa:close-mobile-sidebar"));
                  }
                }}
                className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                  active
                    ? "bg-[#43A9F6] text-white shadow-sm"
                    : "text-[#667085] hover:bg-[#F3F8FC] hover:text-[#238DD7]"
                }`}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-5">
          <div className="rounded-2xl bg-[#E7F5FF] p-5">
            <p className="text-sm font-bold text-[#121826]">
              Need more control?
            </p>
            <p className="mt-1 text-xs leading-5 text-[#667085]">
              Assign roles and permissions from the admin modules.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-4 text-sm font-semibold text-[#667085] hover:text-[#238DD7]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

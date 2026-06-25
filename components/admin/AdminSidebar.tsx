"use client";

import { MenuItem } from "@/types/auth";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthContext } from "@/providers/AuthProvider";
import { adminNavItems, menuMatchesNavItem } from "@/lib/navigation";
import { MapPinned } from "lucide-react";

type AdminSidebarProps = {
  menus: MenuItem[];
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function AdminSidebar(props: AdminSidebarProps) {
  const { hasPermission } = useAuthContext();
  const allowedMenus = adminNavItems.filter((item) =>
    props.menus.some((menu) => menuMatchesNavItem(menu, item)) ||
    item.permissions.some((permission) => hasPermission(permission))
  );

  return (
    <Sidebar 
      navItems={allowedMenus} 
      title="Tourvaa"
      subtitle="Console"
      logoIcon={MapPinned}
      {...props} 
    />
  );
}

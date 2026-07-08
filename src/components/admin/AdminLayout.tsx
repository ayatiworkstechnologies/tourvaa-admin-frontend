"use client";

import { useEffect, useState } from "react";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { MenuItem } from "@/types/auth";

type Props = {
  children: React.ReactNode;
  title?: string;
  menus: MenuItem[];
  user: {
    name: string;
    profile_image?: string;
    role?: {
      name?: string;
    };
  };
};

export default function AdminLayout({ children, title, menus, user }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("tourvaa:close-mobile-sidebar", close);
    return () => window.removeEventListener("tourvaa:close-mobile-sidebar", close);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-dash-bg">
      <AdminSidebar menus={menus} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative h-full w-65 bg-white shadow-2xl">
            <AdminSidebar menus={menus} mobile collapsed={false} onToggleCollapse={() => {}} />
          </div>
        </div>
      )}

      <main className={`flex h-screen flex-col overflow-y-auto transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-65"}`}>
        <AdminHeader
          title={title}
          name={user.name}
          profileImage={user.profile_image}
          role={user.role?.name}
          menus={menus}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="flex-1 px-5 pt-8 pb-10 md:px-9">
          {children}
          {/* <AdminFooter /> */}
        </div>
      </main>
    </div>
  );
}

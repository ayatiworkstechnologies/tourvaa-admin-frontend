"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
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

export default function DashboardLayout({
  children,
  title,
  menus,
  user,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("tourvaa:close-mobile-sidebar", close);
    return () => window.removeEventListener("tourvaa:close-mobile-sidebar", close);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Sidebar menus={menus} />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative h-full w-[236px] bg-white shadow-2xl">
            <Sidebar menus={menus} mobile />
          </div>
        </div>
      )}

      <main className="min-h-screen lg:ml-[236px]">
        <Header
          title={title}
          name={user.name}
          profileImage={user.profile_image}
          role={user.role?.name}
          menus={menus}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="px-5 pb-8 md:px-9">{children}</div>
      </main>
    </div>
  );
}

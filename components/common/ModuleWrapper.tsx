"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function ModuleWrapper({ title, children }: Props) {
  const { dashboard, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <DashboardLayout title={title} menus={dashboard.menus} user={dashboard.user}>
      {children}
    </DashboardLayout>
  );
}
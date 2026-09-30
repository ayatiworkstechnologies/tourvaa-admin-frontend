"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ErrorState from "@/components/common/ErrorState";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import Loader from "@/components/ui/Loader";

type Props = {
  title: string;
  children: React.ReactNode;
  requiredPermission?: string | string[];
};

function ModuleShell({ title, children }: Props) {
  const { dashboard, loading, error, refetch } = useDashboard();

  if (loading) {
    return <Loader label={`Loading ${title.toLowerCase()}...`} fullScreen />;
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
        <ErrorState message={error || "Could not load this module."} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <DashboardLayout title={title} menus={dashboard.menus} user={dashboard.user}>
      {children}
    </DashboardLayout>
  );
}

export default function ModuleWrapper({ title, children, requiredPermission }: Props) {
  return (
    <ProtectedRoute requiredPermission={requiredPermission}>
      <ModuleShell title={title}>{children}</ModuleShell>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LuBlocks as Blocks, LuCircleCheckBig as CheckCircle, LuLayoutDashboard as LayoutDashboard, LuShieldCheck as ShieldCheck } from "react-icons/lu";
import Loader from "@/components/ui/Loader";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import { useAuthContext } from "@/providers/AuthProvider";

function displayRole(value: string) {
  return value.split("-").filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

/** Safe workspace for a role created by an administrator after deployment. */
export default function DynamicRoleDashboardPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { dashboard, isLoggedIn, loading } = useAuthContext();
  const requestedRole = (params.slug || "").toLowerCase();
  const actualRole = (dashboard?.user.role?.slug || "").toLowerCase();
  const correctRoute = actualRole ? getDashboardPath(actualRole) : "/login";
  const isMatchingCustomRole = dashboard?.dashboard_type === "portal" && requestedRole === actualRole;

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (!isMatchingCustomRole) router.replace(correctRoute);
  }, [correctRoute, isLoggedIn, isMatchingCustomRole, loading, router]);

  if (loading || !isLoggedIn || !isMatchingCustomRole || !dashboard) {
    return <Loader label="Opening your workspace..." fullScreen />;
  }

  const modules = Array.from(new Map(dashboard.sidebar_menu.map((item) => [item.module, item])).values());

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f4f8ff_58%,#eaf3ff_100%)] p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B1527] text-white"><LayoutDashboard size={22} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Tourvaa workspace</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0B1527] sm:text-3xl">{displayRole(actualRole)} Portal</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Welcome, {dashboard.user.name}. Your workspace is configured from the permissions assigned to your role.</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Available modules">
          {modules.length > 0 ? modules.map((item) => (
            <div key={item.module} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Blocks size={18} className="text-blue-600" />
              <h2 className="mt-4 text-base font-black capitalize text-slate-900">{item.label}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Access has been enabled by your administrator.</p>
            </div>
          )) : (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <ShieldCheck className="mx-auto text-blue-600" size={24} />
              <h2 className="mt-3 font-black text-slate-900">Your workspace is ready</h2>
              <p className="mt-2 text-sm text-slate-600">Ask an administrator to assign the modules you need.</p>
            </div>
          )}
        </section>

        <p className="mt-6 flex items-center gap-2 text-sm text-slate-600"><CheckCircle size={16} className="text-emerald-600" /> Only permissions assigned to this role are available.</p>
      </div>
    </main>
  );
}

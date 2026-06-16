"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Filter,
  Headphones,
  KeyRound,
  PackageCheck,
  MapPinned,
  Plane,
  ShieldCheck,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import StatCard from "@/components/ui/StatCard";
import api from "@/lib/api";
import { useDashboard } from "@/hooks/useDashboard";
import { countries } from "@/lib/location-options";

type DashboardSummary = {
  total_bookings: number;
  total_customers: number;
  total_suppliers: number;
  pending_suppliers: number;
  total_agents: number;
  pending_agents: number;
  total_revenue: number;
  pending_payments: number;
  pending_admin_users: number;
};

type BookingAnalytics = {
  upcoming_bookings: number;
  ongoing_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  pending_supplier_acceptance: number;
};

type PaymentSummary = {
  full_payment_count: number;
  partial_payment_count: number;
  pending_payment_count: number;
  failed_payment_count: number;
  refunded_payment_count: number;
};

type RecentActivity = {
  recent_admin_actions: Array<{
    id: number;
    action: string;
    entity_type: string;
    entity_id: number | null;
  }>;
};

type ReportsSummary = {
  total_reports: number;
  scheduled_reports: number;
  exported_reports: number;
  report_cards: Array<{
    name: string;
    value: string;
    change: string;
    status: "ready" | "review";
  }>;
  recent_exports: Array<{
    id: number;
    name: string;
    format: string;
    generated_at: string;
  }>;
};

const moduleHref: Record<string, string> = {
  dashboard: "/dashboard",
  users: "/users",
  customers: "/customers",
  roles: "/roles",
  permissions: "/permissions",
  email: "/email-templates",
  reports: "/reports",
  settings: "/settings",
  profile: "/profile",
};

const roleTheme: Record<
  string,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    accent: string;
  }
> = {
  "super-admin": {
    eyebrow: "Admin Control Center",
    title: "Platform operations at a glance",
    subtitle: "Manage approvals, users, roles, and system activity from one workspace.",
    accent: "from-[#0F172A] to-[#0284C7]",
  },
  admin: {
    eyebrow: "Admin Control Center",
    title: "Platform operations at a glance",
    subtitle: "Manage approvals, users, roles, and system activity from one workspace.",
    accent: "from-[#0F172A] to-[#0284C7]",
  },
  "sub-admin": {
    eyebrow: "Operations Workspace",
    title: "Daily travel operations dashboard",
    subtitle: "Review users, suppliers, agents, tours, and bookings assigned to your role.",
    accent: "from-[#1E3A8A] to-[#0D9488]",
  },
  supplier: {
    eyebrow: "Supplier Workspace",
    title: "Track tours, bookings, and supplier earnings",
    subtitle: "Keep upcoming tours, customer bookings, and payment status easy to scan.",
    accent: "from-[#065F46] to-[#0284C7]",
  },
  "agent-reseller": {
    eyebrow: "Agent Sales Desk",
    title: "Customers, bookings, and commission pipeline",
    subtitle: "Follow leads, active reservations, and reseller performance in one place.",
    accent: "from-[#7C2D12] to-[#0EA5E9]",
  },
  customer: {
    eyebrow: "Customer Travel Hub",
    title: "Your trips, bookings, and travel support",
    subtitle: "See upcoming journeys, booking status, saved tours, and profile actions.",
    accent: "from-[#1D4ED8] to-[#14B8A6]",
  },
};

function getRoleKind(roleSlug?: string | null) {
  if (roleSlug === "super-admin" || roleSlug === "admin") return "admin";
  if (roleSlug === "sub-admin") return "sub-admin";
  if (roleSlug === "supplier") return "supplier";
  if (roleSlug === "agent-reseller") return "agent-reseller";
  if (roleSlug === "customer") return "customer";
  return "admin";
}

export default function DashboardPage() {
  const { dashboard, loading, refetch } = useDashboard();
  const [approvalSavingId, setApprovalSavingId] = useState<number | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    country: "",
  });
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [bookings, setBookings] = useState<BookingAnalytics | null>(null);
  const [payments, setPayments] = useState<PaymentSummary | null>(null);
  const [activities, setActivities] = useState<RecentActivity | null>(null);
  const [reports, setReports] = useState<ReportsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.start_date) params.set("start_date", filters.start_date);
    if (filters.end_date) params.set("end_date", filters.end_date);
    if (filters.country) params.set("country_id", String(countries.indexOf(filters.country) + 1));

    return params.toString();
  }, [filters]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);

    try {
      const suffix = filterQuery ? `?${filterQuery}` : "";
      const [summaryResponse, bookingsResponse, paymentsResponse, reportsResponse, activitiesResponse] =
        await Promise.all([
          api.get(`/dashboard/summary${suffix}`),
          api.get(`/dashboard/bookings${suffix}`),
          api.get(`/dashboard/payments${suffix}`),
          api.get(`/dashboard/reports${suffix}`),
          api.get("/dashboard/recent-activities"),
        ]);

      setSummary(summaryResponse.data.data);
      setBookings(bookingsResponse.data.data);
      setPayments(paymentsResponse.data.data);
      setReports(reportsResponse.data.data);
      setActivities(activitiesResponse.data.data);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [filterQuery]);

  useEffect(() => {
    if (!dashboard) return;

    const timer = window.setTimeout(() => {
      fetchAnalytics();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dashboard, fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <p className="text-sm text-[#667085]">Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboard) return null;

  const roleSlug = dashboard.user.role?.slug;
  const roleKind = getRoleKind(roleSlug);
  const theme = roleTheme[roleSlug || ""] || roleTheme[roleKind];
  const permissionSlugs = new Set(
    (dashboard.permissions || []).map((permission) => permission.slug)
  );
  const canApproveUsers = permissionSlugs.has("update-users");
  const pendingApprovals = dashboard.pending_approvals || [];
  const menuModules = new Set(dashboard.menus.map((menu) => menu.module));
  const canOpen = (module: string) => menuModules.has(module);
  const hrefFor = (module: string) => moduleHref[module] || "/dashboard";

  const approveUser = async (userId: number, roleId?: number | null) => {
    setApprovalSavingId(userId);
    setApprovalMessage("");

    try {
      await api.post(`/users/${userId}/approve`, {
        role_id: roleId || undefined,
      });
      setApprovalMessage("User approved successfully.");
      await refetch();
    } catch {
      setApprovalMessage("Could not approve user. Assign a role first.");
    } finally {
      setApprovalSavingId(null);
    }
  };

  const rejectUser = async (userId: number) => {
    const ok = confirm("Reject this user registration?");

    if (!ok) return;

    setApprovalSavingId(userId);
    setApprovalMessage("");

    try {
      await api.post(`/users/${userId}/reject`);
      setApprovalMessage("User rejected successfully.");
      await refetch();
    } catch {
      setApprovalMessage("Could not reject user.");
    } finally {
      setApprovalSavingId(null);
    }
  };

  const stats =
    summary && roleKind === "admin"
      ? [
          { title: "Total Bookings", value: summary.total_bookings.toLocaleString(), change: "Filtered", icon: CalendarCheck },
          { title: "Total Customers", value: summary.total_customers.toLocaleString(), change: "Platform", icon: Users },
          { title: "Pending Payments", value: summary.pending_payments.toLocaleString(), change: "Review", icon: WalletCards },
          { title: "Total Revenue", value: `₹${summary.total_revenue.toLocaleString()}`, change: "Revenue", icon: CircleDollarSign },
          { title: "Suppliers", value: summary.total_suppliers.toLocaleString(), change: `${summary.pending_suppliers} pending`, icon: PackageCheck },
          { title: "Agents", value: summary.total_agents.toLocaleString(), change: `${summary.pending_agents} pending`, icon: Headphones },
        ]
      : roleKind === "customer"
      ? [
          { title: "Upcoming Trips", value: 2, change: "Booked", icon: Plane },
          { title: "Saved Tours", value: 8, change: "Browse", icon: Star },
          { title: "Open Requests", value: 1, change: "Support", icon: Headphones },
        ]
      : roleKind === "supplier"
      ? [
          { title: "Active Tours", value: 18, change: "Live", icon: PackageCheck },
          { title: "Bookings", value: 42, change: "This month", icon: CalendarCheck },
          { title: "Pending Payout", value: "$8.4k", change: "Review", icon: WalletCards },
        ]
      : roleKind === "agent-reseller"
      ? [
          { title: "Customers", value: 64, change: "Pipeline", icon: Users },
          { title: "Bookings", value: 27, change: "Active", icon: CalendarCheck },
          { title: "Commission", value: "$3.2k", change: "Month", icon: CircleDollarSign },
        ]
      : [
          { title: "Total Users", value: dashboard.stats.users.toLocaleString(), change: "Platform", icon: Users },
          { title: "Active Roles", value: dashboard.stats.roles.toLocaleString(), change: "Access", icon: ShieldCheck },
          { title: "Pending Users", value: dashboard.stats.pending_users.toLocaleString(), change: "Approve", icon: KeyRound },
        ];

  const actionCards =
    roleKind === "customer"
      ? [
          { title: "Browse Tours", text: "Find travel packages and booking options.", module: "tours", icon: MapPinned },
          { title: "My Bookings", text: "Review upcoming and past reservations.", module: "bookings", icon: CalendarCheck },
          { title: "Profile", text: "Keep account and travel details updated.", module: "profile", icon: UserPlus },
        ]
      : roleKind === "supplier"
      ? [
          { title: "Tour Inventory", text: "Manage your listed tour availability.", module: "tours", icon: PackageCheck },
          { title: "Booking Requests", text: "Confirm or update customer bookings.", module: "bookings", icon: CalendarCheck },
          { title: "Payments", text: "Track payouts and payment status.", module: "payments", icon: WalletCards },
        ]
      : roleKind === "agent-reseller"
      ? [
          { title: "Customers", text: "Create and manage traveler records.", module: "customers", icon: Users },
          { title: "Create Booking", text: "Start a booking for a customer.", module: "bookings", icon: CalendarCheck },
          { title: "Reports", text: "Track sales and commission performance.", module: "reports", icon: TrendingUp },
        ]
      : [
          { title: "Users", text: "Create users, assign roles, and approve accounts.", module: "users", icon: Users },
          { title: "Roles", text: "Manage role access and module permissions.", module: "roles", icon: ShieldCheck },
          { title: "Email Templates", text: "Update system email communication.", module: "email", icon: Headphones },
        ];

  const timeline =
    roleKind === "customer"
      ? ["Booking request received", "Payment verification pending", "Travel profile ready"]
      : roleKind === "supplier"
      ? ["Tour calendar checked", "New booking request assigned", "Payout review pending"]
      : roleKind === "agent-reseller"
      ? ["Customer lead added", "Booking quote prepared", "Commission report updated"]
      : ["User approval queue checked", "Role access reviewed", "Dashboard modules synced"];

  return (
    <ProtectedRoute requiredPermission="dashboard.view">
    <DashboardLayout menus={dashboard.menus} user={dashboard.user}>
      <div className="mx-auto max-w-[1440px] space-y-6">
        <section
          className={`overflow-hidden rounded-2xl bg-gradient-to-br ${theme.accent} p-6 text-white shadow-xl`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-white/75">{theme.eyebrow}</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">
                {theme.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
                {theme.subtitle}
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/65">
                Signed in as
              </p>
              <p className="mt-1 text-xl font-bold">{dashboard.user.name}</p>
              <p className="text-sm text-white/75">{dashboard.user.role?.name}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              icon={card.icon}
            />
          ))}
        </section>

        {roleKind === "admin" && (
          <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#121826]">Dashboard Filters</h3>
                <p className="text-sm text-[#667085]">
                  Filter operational dashboard data by date range and country.
                </p>
              </div>
              {analyticsLoading && (
                <p className="text-sm font-semibold text-[#238DD7]">Refreshing analytics...</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  Start Date
                </span>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, start_date: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  End Date
                </span>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, end_date: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  Country
                </span>
                <select
                  value={filters.country}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, country: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                >
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setFilters({ start_date: "", end_date: "", country: "" })}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC] md:mt-6"
              >
                <Filter size={16} />
                Reset
              </button>
            </div>
          </section>
        )}

        {roleKind === "admin" && bookings && payments && (
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <BarChart3 className="text-[#238DD7]" size={20} />
                <h3 className="text-lg font-bold text-[#121826]">Booking Analytics</h3>
              </div>
              {[
                ["Upcoming", bookings.upcoming_bookings],
                ["Ongoing", bookings.ongoing_bookings],
                ["Completed", bookings.completed_bookings],
                ["Cancelled", bookings.cancelled_bookings],
                ["Supplier Pending", bookings.pending_supplier_acceptance],
              ].map(([label, value]) => (
                <div key={label} className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-[#667085]">{label}</span>
                    <b>{value}</b>
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF2F6]">
                    <div
                      className="h-2 rounded-full bg-[#43A9F6]"
                      style={{ width: `${Math.min(Number(value) * 8, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <WalletCards className="text-[#238DD7]" size={20} />
                <h3 className="text-lg font-bold text-[#121826]">Payment Status</h3>
              </div>
              {[
                ["Full", payments.full_payment_count],
                ["Partial", payments.partial_payment_count],
                ["Pending", payments.pending_payment_count],
                ["Failed", payments.failed_payment_count],
                ["Refunded", payments.refunded_payment_count],
              ].map(([label, value]) => (
                <div key={label} className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-[#667085]">{label}</span>
                    <b>{value}</b>
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF2F6]">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(Number(value) * 8, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {roleKind === "admin" && reports && (
          <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-[#238DD7]" size={20} />
                  <h3 className="text-lg font-bold text-[#121826]">Reports Snapshot</h3>
                </div>
                <p className="mt-1 text-sm text-[#667085]">
                  Dummy report data for dashboard preview until report modules are connected.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-[#F7F9FC] px-4 py-3">
                  <p className="text-lg font-bold text-[#121826]">{reports.total_reports}</p>
                  <p className="text-xs font-semibold text-[#667085]">Reports</p>
                </div>
                <div className="rounded-xl bg-[#F7F9FC] px-4 py-3">
                  <p className="text-lg font-bold text-[#121826]">{reports.scheduled_reports}</p>
                  <p className="text-xs font-semibold text-[#667085]">Scheduled</p>
                </div>
                <div className="rounded-xl bg-[#F7F9FC] px-4 py-3">
                  <p className="text-lg font-bold text-[#121826]">{reports.exported_reports}</p>
                  <p className="text-xs font-semibold text-[#667085]">Exports</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {reports.report_cards.map((report) => (
                  <div key={report.name} className="rounded-xl border border-[#EEF2F6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#121826]">{report.name}</p>
                        <p className="mt-2 text-2xl font-bold text-[#238DD7]">{report.value}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          report.status === "ready"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-[#667085]">{report.change}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-[#F7F9FC] p-4">
                <h4 className="text-sm font-bold text-[#121826]">Recent Exports</h4>
                <div className="mt-3 space-y-3">
                  {reports.recent_exports.map((item) => (
                    <div key={item.id} className="rounded-xl bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-[#121826]">{item.name}</p>
                        <span className="rounded-full bg-[#E7F5FF] px-2 py-1 text-xs font-bold text-[#238DD7]">
                          {item.format}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#667085]">{item.generated_at}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {canApproveUsers && roleKind !== "customer" && (
              <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#121826]">
                      User Approvals
                    </h3>
                    <p className="text-sm text-[#667085]">
                      Pending registrations waiting for admin action
                    </p>
                  </div>
                  <Link
                    href="/users"
                    className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC]"
                  >
                    View All
                  </Link>
                </div>

                {approvalMessage && (
                  <p
                    className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                      approvalMessage.includes("Could not")
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {approvalMessage}
                  </p>
                )}

                <div className="space-y-3">
                  {pendingApprovals.length > 0 ? (
                    pendingApprovals.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col gap-4 rounded-xl border border-[#EEF2F6] p-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[#121826]">{user.name}</p>
                          <p className="mt-1 truncate text-sm text-[#667085]">
                            {user.email}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            Role: {user.role_name || "Not assigned"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={approvalSavingId === user.id}
                            onClick={() => approveUser(user.id, user.role_id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>
                          <button
                            disabled={approvalSavingId === user.id}
                            onClick={() => rejectUser(user.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-[#F7F9FC] p-4 text-sm leading-6 text-[#667085]">
                      No pending user approvals right now.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-[#121826]">
                  {roleKind === "customer" ? "Travel Shortcuts" : "Workspace Actions"}
                </h3>
                <p className="text-sm text-[#667085]">
                  Role-focused actions for the current account
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {actionCards.map((item) => {
                  const Icon = item.icon;
                  const enabled = canOpen(item.module);

                  return (
                    <Link
                      key={item.title}
                      href={enabled ? hrefFor(item.module) : "/dashboard"}
                      className={`rounded-xl border border-[#EEF2F6] p-4 transition ${
                        enabled
                          ? "hover:border-[#43A9F6] hover:bg-[#F7FBFF]"
                          : "cursor-default opacity-60"
                      }`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#238DD7]">
                        <Icon size={20} />
                      </div>
                      <p className="mt-4 font-bold text-[#121826]">{item.title}</p>
                      <p className="mt-2 min-h-10 text-sm leading-6 text-[#667085]">
                        {item.text}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
              <h3 className="text-lg font-bold text-[#121826]">
                {roleKind === "customer" ? "Trip Timeline" : "Today’s Activity"}
              </h3>
              <div className="mt-5 grid gap-3">
                {timeline.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-[#F7F9FC] p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#238DD7]">
                      {index + 1}
                    </div>
                    <p className="text-sm font-semibold text-[#121826]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            {roleKind === "admin" && (
              <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Activity className="text-[#238DD7]" size={20} />
                  <h3 className="text-lg font-bold text-[#121826]">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {(activities?.recent_admin_actions || []).length > 0 ? (
                    activities?.recent_admin_actions.slice(0, 5).map((item) => (
                      <div key={item.id} className="rounded-xl bg-[#F7F9FC] p-3">
                        <p className="text-sm font-bold text-[#121826]">{item.action}</p>
                        <p className="text-xs text-[#667085]">
                          {item.entity_type}
                          {item.entity_id ? ` #${item.entity_id}` : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#667085]">
                      No recent admin activity yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {roleKind === "admin" && summary && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
                  <div>
                    <h3 className="text-lg font-bold text-[#121826]">Alerts</h3>
                    <p className="mt-2 text-sm leading-6 text-[#667085]">
                      {summary.pending_admin_users} admin approvals, {summary.pending_suppliers} supplier approvals,
                      and {summary.pending_payments} pending payments need attention.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
              <h3 className="text-lg font-bold text-[#121826]">
                {roleKind === "customer" ? "Next Trip" : "Priority Panel"}
              </h3>
              <div className="mt-5 rounded-2xl bg-[#F7F9FC] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#238DD7]">
                    {roleKind === "customer" ? <Plane size={23} /> : <Clock3 size={23} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#121826]">
                      {roleKind === "customer"
                        ? "Kerala Backwater Escape"
                        : "Pending review queue"}
                    </p>
                    <p className="text-xs text-[#667085]">
                      {roleKind === "customer"
                        ? "3 nights, booking confirmation pending"
                        : "Keep today’s operational items moving"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
              <h3 className="text-lg font-bold text-[#121826]">Account Summary</h3>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between rounded-xl bg-[#F7F9FC] p-3">
                  <span className="text-sm font-semibold text-[#667085]">User</span>
                  <b>{dashboard.user.name}</b>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#F7F9FC] p-3">
                  <span className="text-sm font-semibold text-[#667085]">Role</span>
                  <b>{dashboard.user.role?.name}</b>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#F7F9FC] p-3">
                  <span className="text-sm font-semibold text-[#667085]">Modules</span>
                  <b>{dashboard.menus.length}</b>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}

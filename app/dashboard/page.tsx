"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
  Warehouse,
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
  approved_suppliers: number;
  pending_suppliers: number;
  total_agents: number;
  approved_agents: number;
  pending_agents: number;
  total_affiliates: number;
  pending_affiliates: number;
  total_tours: number;
  published_tours: number;
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

type PendingSupplier = {
  id: number;
  supplier_name: string;
  email: string;
  phone: string;
};

type PendingAgent = {
  id: number;
  agent_name: string;
  email: string;
  phone: string;
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
  suppliers: "/suppliers",
  agents: "/agents",
  affiliates: "/affiliates",
  tours: "/tours",
  categories: "/tours/categories",
  subcategories: "/tours/subcategories",
  countries: "/settings/countries",
  cities: "/settings/cities",
};

const roleTheme: Record<string, { eyebrow: string; title: string; subtitle: string; accent: string }> = {
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
    subtitle: "Review suppliers, agents, affiliates, tours, and bookings assigned to your role.",
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

function getRoleKind(slug?: string | null) {
  if (slug === "super-admin" || slug === "admin") return "admin";
  if (slug === "sub-admin") return "sub-admin";
  if (slug === "supplier") return "supplier";
  if (slug === "agent-reseller") return "agent-reseller";
  if (slug === "customer") return "customer";
  return "admin";
}

function ProgressBar({ value, max = 12.5, color }: { value: number; max?: number; color: string }) {
  const fillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = `${Math.min((value / max) * 100, 100)}%`;
  }, [value, max]);
  return (
    <div className="h-2 rounded-full bg-[#EEF2F6]">
      <div ref={fillRef} className={`h-2 rounded-full ${color}`} />
    </div>
  );
}

export default function DashboardPage() {
  const { dashboard, loading, refetch } = useDashboard();
  const [approvalSavingId, setApprovalSavingId] = useState<number | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [pendingSuppliers, setPendingSuppliers] = useState<PendingSupplier[]>([]);
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [opsSavingId, setOpsSavingId] = useState<string | null>(null);
  const [opsMessage, setOpsMessage] = useState("");
  const [filters, setFilters] = useState({ start_date: "", end_date: "", country: "" });
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
      const [s, b, p, r, a, suppRes, agentRes] = await Promise.all([
        api.get(`/dashboard/summary${suffix}`),
        api.get(`/dashboard/bookings${suffix}`),
        api.get(`/dashboard/payments${suffix}`),
        api.get(`/dashboard/reports${suffix}`),
        api.get("/dashboard/recent-activities"),
        api.get("/suppliers/?approval_status=pending&page=1&limit=10").catch(() => null),
        api.get("/agents/?approval_status=pending&page=1&limit=10").catch(() => null),
      ]);
      setSummary(s.data.data);
      setBookings(b.data.data);
      setPayments(p.data.data);
      setReports(r.data.data);
      setActivities(a.data.data);
      if (suppRes) setPendingSuppliers(suppRes.data.items || suppRes.data.data || []);
      if (agentRes) setPendingAgents(agentRes.data.items || agentRes.data.data || []);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [filterQuery]);

  useEffect(() => {
    if (!dashboard) return;
    const timer = window.setTimeout(fetchAnalytics, 0);
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
  const theme = roleTheme[roleSlug || ""] ?? roleTheme[roleKind] ?? roleTheme.admin;
  const permissionSlugs = new Set((dashboard.permissions || []).map((p) => p.slug));
  const canApproveUsers = permissionSlugs.has("update-users");
  const pendingApprovals = dashboard.pending_approvals || [];
  const menuModules = new Set(dashboard.menus.map((m) => m.module));
  const canOpen = (module: string) => menuModules.has(module) || permissionSlugs.has(`${module}.view`) || permissionSlugs.has(`view-${module}`);
  const hrefFor = (module: string) => moduleHref[module] || "/dashboard";

  // Permission helpers for operations roles
  const canViewSuppliers = permissionSlugs.has("suppliers.view") || permissionSlugs.has("view-suppliers");
  const canViewAgents = permissionSlugs.has("agents.view") || permissionSlugs.has("view-agents");
  const canViewAffiliates = permissionSlugs.has("affiliates.view") || permissionSlugs.has("view-affiliates");
  const canViewTours = permissionSlugs.has("tours.view") || permissionSlugs.has("view-tours");
  const showOpsQueue = (roleKind === "admin" || roleKind === "sub-admin") && (canViewSuppliers || canViewAgents || canViewAffiliates);

  const approveUser = async (userId: number, roleId?: number | null) => {
    setApprovalSavingId(userId);
    setApprovalMessage("");
    try {
      await api.post(`/users/${userId}/approve`, { role_id: roleId || undefined });
      setApprovalMessage("User approved successfully.");
      await refetch();
    } catch {
      setApprovalMessage("Could not approve user. Assign a role first.");
    } finally {
      setApprovalSavingId(null);
    }
  };

  const rejectUser = async (userId: number) => {
    if (!confirm("Reject this user registration?")) return;
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

  const approveSupplier = async (id: number) => {
    setOpsSavingId(`s-${id}`);
    setOpsMessage("");
    try {
      await api.patch(`/suppliers/${id}/approve`);
      setPendingSuppliers((prev) => prev.filter((s) => s.id !== id));
      setOpsMessage("Supplier approved.");
    } catch {
      setOpsMessage("Could not approve supplier.");
    } finally {
      setOpsSavingId(null);
    }
  };

  const rejectSupplier = async (id: number) => {
    const reason = window.prompt("Rejection reason:", "Does not meet requirements");
    if (!reason) return;
    setOpsSavingId(`s-${id}`);
    setOpsMessage("");
    try {
      await api.patch(`/suppliers/${id}/reject`, { rejection_reason: reason });
      setPendingSuppliers((prev) => prev.filter((s) => s.id !== id));
      setOpsMessage("Supplier rejected.");
    } catch {
      setOpsMessage("Could not reject supplier.");
    } finally {
      setOpsSavingId(null);
    }
  };

  const approveAgent = async (id: number) => {
    setOpsSavingId(`a-${id}`);
    setOpsMessage("");
    try {
      await api.patch(`/agents/${id}/approve`);
      setPendingAgents((prev) => prev.filter((a) => a.id !== id));
      setOpsMessage("Agent approved.");
    } catch {
      setOpsMessage("Could not approve agent.");
    } finally {
      setOpsSavingId(null);
    }
  };

  const rejectAgent = async (id: number) => {
    const reason = window.prompt("Rejection reason:", "Does not meet requirements");
    if (!reason) return;
    setOpsSavingId(`a-${id}`);
    setOpsMessage("");
    try {
      await api.patch(`/agents/${id}/reject`, { rejection_reason: reason });
      setPendingAgents((prev) => prev.filter((a) => a.id !== id));
      setOpsMessage("Agent rejected.");
    } catch {
      setOpsMessage("Could not reject agent.");
    } finally {
      setOpsSavingId(null);
    }
  };

  // --- Stat cards per role ---
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
      : summary && roleKind === "sub-admin"
      ? [
          ...(canViewSuppliers ? [{ title: "Pending Suppliers", value: summary.pending_suppliers.toLocaleString(), change: `${summary.total_suppliers} total`, icon: Warehouse }] : []),
          ...(canViewAgents ? [{ title: "Pending Agents", value: summary.pending_agents.toLocaleString(), change: `${summary.total_agents} total`, icon: UsersRound }] : []),
          ...(canViewAffiliates ? [{ title: "Pending Affiliates", value: summary.pending_affiliates.toLocaleString(), change: `${summary.total_affiliates} total`, icon: Ticket }] : []),
          ...(canViewTours ? [{ title: "Published Tours", value: summary.published_tours.toLocaleString(), change: `${summary.total_tours} total`, icon: MapPinned }] : []),
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
          { title: "Pending Payout", value: "₹8.4k", change: "Review", icon: WalletCards },
        ]
      : roleKind === "agent-reseller"
      ? [
          { title: "Customers", value: 64, change: "Pipeline", icon: Users },
          { title: "Bookings", value: 27, change: "Active", icon: CalendarCheck },
          { title: "Commission", value: "₹3.2k", change: "Month", icon: CircleDollarSign },
        ]
      : [
          { title: "Total Users", value: dashboard.stats.users.toLocaleString(), change: "Platform", icon: Users },
          { title: "Active Roles", value: dashboard.stats.roles.toLocaleString(), change: "Access", icon: ShieldCheck },
          { title: "Pending Users", value: dashboard.stats.pending_users.toLocaleString(), change: "Approve", icon: KeyRound },
        ];

  // --- Action cards per role ---
  const actionCards =
    roleKind === "sub-admin"
      ? [
          ...(canViewSuppliers ? [{ title: "Suppliers", text: "Review and approve supplier applications.", module: "suppliers", icon: Warehouse }] : []),
          ...(canViewAgents ? [{ title: "Agents", text: "Manage agent approvals and discount settings.", module: "agents", icon: UsersRound }] : []),
          ...(canViewAffiliates ? [{ title: "Affiliates", text: "Track affiliates and API link assignments.", module: "affiliates", icon: Ticket }] : []),
          ...(canViewTours ? [{ title: "Tours", text: "Publish and manage travel packages.", module: "tours", icon: MapPinned }] : []),
        ].slice(0, 3)
      : roleKind === "customer"
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

  // --- Timeline per role ---
  const timeline =
    roleKind === "sub-admin"
      ? ["Pending supplier approvals reviewed", "Agent discount configurations checked", "New tour packages validated"]
      : roleKind === "customer"
      ? ["Booking request received", "Payment verification pending", "Travel profile ready"]
      : roleKind === "supplier"
      ? ["Tour calendar checked", "New booking request assigned", "Payout review pending"]
      : roleKind === "agent-reseller"
      ? ["Customer lead added", "Booking quote prepared", "Commission report updated"]
      : ["User approval queue checked", "Role access reviewed", "Dashboard modules synced"];

  return (
    <ProtectedRoute requiredPermission="dashboard.view">
      <DashboardLayout menus={dashboard.menus} user={dashboard.user}>
        <div className="mx-auto max-w-360 space-y-6">

          {/* Hero banner */}
          <section className={`overflow-hidden rounded-2xl bg-linear-to-br ${theme.accent} p-6 text-white shadow-xl`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-bold text-white/75">{theme.eyebrow}</p>
                <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">{theme.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">{theme.subtitle}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/65">Signed in as</p>
                <p className="mt-1 text-xl font-bold">{dashboard.user.name}</p>
                <p className="text-sm text-white/75">{dashboard.user.role?.name}</p>
              </div>
            </div>
          </section>

          {/* Stat cards */}
          {stats.length > 0 && (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {stats.map((card) => (
                <StatCard key={card.title} title={card.title} value={card.value} change={card.change} icon={card.icon} />
              ))}
            </section>
          )}

          {/* Filter bar — admin only */}
          {roleKind === "admin" && (
            <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#121826]">Dashboard Filters</h3>
                  <p className="text-sm text-[#667085]">Filter operational data by date range and country.</p>
                </div>
                {analyticsLoading && <p className="text-sm font-semibold text-[#238DD7]">Refreshing...</p>}
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Start Date</span>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters((c) => ({ ...c, start_date: e.target.value }))}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">End Date</span>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters((c) => ({ ...c, end_date: e.target.value }))}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Country</span>
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters((c) => ({ ...c, country: e.target.value }))}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  >
                    <option value="">All Countries</option>
                    {countries.map((c) => <option key={c} value={c}>{c}</option>)}
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

          {/* Booking & payment analytics — admin only */}
          {roleKind === "admin" && bookings && payments && (
            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <BarChart3 className="text-[#238DD7]" size={20} />
                  <h3 className="text-lg font-bold text-[#121826]">Booking Analytics</h3>
                </div>
                {(
                  [
                    ["Upcoming", bookings.upcoming_bookings],
                    ["Ongoing", bookings.ongoing_bookings],
                    ["Completed", bookings.completed_bookings],
                    ["Cancelled", bookings.cancelled_bookings],
                    ["Supplier Pending", bookings.pending_supplier_acceptance],
                  ] as [string, number][]
                ).map(([label, value]) => (
                  <div key={label} className="mb-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold text-[#667085]">{label}</span>
                      <b>{value}</b>
                    </div>
                    <ProgressBar value={value} color="bg-[#43A9F6]" />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <WalletCards className="text-[#238DD7]" size={20} />
                  <h3 className="text-lg font-bold text-[#121826]">Payment Status</h3>
                </div>
                {(
                  [
                    ["Full", payments.full_payment_count],
                    ["Partial", payments.partial_payment_count],
                    ["Pending", payments.pending_payment_count],
                    ["Failed", payments.failed_payment_count],
                    ["Refunded", payments.refunded_payment_count],
                  ] as [string, number][]
                ).map(([label, value]) => (
                  <div key={label} className="mb-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold text-[#667085]">{label}</span>
                      <b>{value}</b>
                    </div>
                    <ProgressBar value={value} color="bg-emerald-500" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reports snapshot — admin only */}
          {roleKind === "admin" && reports && (
            <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-[#238DD7]" size={20} />
                    <h3 className="text-lg font-bold text-[#121826]">Reports Snapshot</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Reports", reports.total_reports],
                    ["Scheduled", reports.scheduled_reports],
                    ["Exports", reports.exported_reports],
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-xl bg-[#F7F9FC] px-4 py-3">
                      <p className="text-lg font-bold text-[#121826]">{val}</p>
                      <p className="text-xs font-semibold text-[#667085]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {reports.report_cards.map((r) => (
                    <div key={r.name} className="rounded-xl border border-[#EEF2F6] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-[#121826]">{r.name}</p>
                          <p className="mt-2 text-2xl font-bold text-[#238DD7]">{r.value}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.status === "ready" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-[#667085]">{r.change}</p>
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
                          <span className="rounded-full bg-[#E7F5FF] px-2 py-1 text-xs font-bold text-[#238DD7]">{item.format}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#667085]">{item.generated_at}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Supplier + Agent inline approvals — admin + sub-admin */}
          {showOpsQueue && (canViewSuppliers || canViewAgents) && (
            <section className="space-y-4">
              {opsMessage && (
                <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${opsMessage.includes("Could not") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                  {opsMessage}
                </p>
              )}

              {canViewSuppliers && (
                <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Warehouse size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#121826]">Pending Supplier Approvals</h3>
                        <p className="text-xs text-[#667085]">{pendingSuppliers.length} waiting for review</p>
                      </div>
                    </div>
                    {analyticsLoading && <p className="text-xs font-semibold text-[#238DD7]">Loading...</p>}
                  </div>

                  <div className="space-y-3">
                    {pendingSuppliers.length > 0 ? pendingSuppliers.map((s) => (
                      <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-[#EEF2F6] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-[#121826]">{s.supplier_name}</p>
                          <p className="mt-0.5 truncate text-sm text-[#667085]">{s.email}</p>
                          {s.phone && <p className="mt-0.5 text-xs text-[#98A2B3]">{s.phone}</p>}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={opsSavingId === `s-${s.id}`}
                            onClick={() => approveSupplier(s.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 size={15} />
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={opsSavingId === `s-${s.id}`}
                            onClick={() => rejectSupplier(s.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                          >
                            <XCircle size={15} />
                            Reject
                          </button>
                        </div>
                      </div>
                    )) : (
                      <p className="rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#667085]">No pending supplier approvals.</p>
                    )}
                  </div>
                </div>
              )}

              {canViewAgents && (
                <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UsersRound size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#121826]">Pending Agent Approvals</h3>
                        <p className="text-xs text-[#667085]">{pendingAgents.length} waiting for review</p>
                      </div>
                    </div>
                    {analyticsLoading && <p className="text-xs font-semibold text-[#238DD7]">Loading...</p>}
                  </div>

                  <div className="space-y-3">
                    {pendingAgents.length > 0 ? pendingAgents.map((a) => (
                      <div key={a.id} className="flex flex-col gap-3 rounded-xl border border-[#EEF2F6] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-[#121826]">{a.agent_name}</p>
                          <p className="mt-0.5 truncate text-sm text-[#667085]">{a.email}</p>
                          {a.phone && <p className="mt-0.5 text-xs text-[#98A2B3]">{a.phone}</p>}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={opsSavingId === `a-${a.id}`}
                            onClick={() => approveAgent(a.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 size={15} />
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={opsSavingId === `a-${a.id}`}
                            onClick={() => rejectAgent(a.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                          >
                            <XCircle size={15} />
                            Reject
                          </button>
                        </div>
                      </div>
                    )) : (
                      <p className="rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#667085]">No pending agent approvals.</p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Main content + aside */}
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">

              {/* User approvals — admin + sub-admin with permission */}
              {canApproveUsers && roleKind !== "customer" && (
                <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#121826]">User Approvals</h3>
                      <p className="text-sm text-[#667085]">Pending registrations waiting for admin action</p>
                    </div>
                    <Link href="/users" className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC]">
                      View All
                    </Link>
                  </div>

                  {approvalMessage && (
                    <p className={`mb-4 rounded-xl px-4 py-3 text-sm ${approvalMessage.includes("Could not") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {approvalMessage}
                    </p>
                  )}

                  <div className="space-y-3">
                    {pendingApprovals.length > 0 ? (
                      pendingApprovals.map((user) => (
                        <div key={user.id} className="flex flex-col gap-4 rounded-xl border border-[#EEF2F6] p-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="font-bold text-[#121826]">{user.name}</p>
                            <p className="mt-1 truncate text-sm text-[#667085]">{user.email}</p>
                            <p className="mt-2 text-xs font-semibold text-amber-700">Role: {user.role_name || "Not assigned"}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={approvalSavingId === user.id}
                              onClick={() => approveUser(user.id, user.role_id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <CheckCircle2 size={16} />
                              Approve
                            </button>
                            <button
                              type="button"
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

              {/* Workspace action cards */}
              {actionCards.length > 0 && (
                <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-[#121826]">
                      {roleKind === "customer" ? "Travel Shortcuts" : "Workspace Actions"}
                    </h3>
                    <p className="text-sm text-[#667085]">Role-focused actions for the current account</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {actionCards.map((item) => {
                      const Icon = item.icon;
                      const enabled = canOpen(item.module);
                      return (
                        <Link
                          key={item.title}
                          href={enabled ? hrefFor(item.module) : "/dashboard"}
                          className={`rounded-xl border border-[#EEF2F6] p-4 transition ${enabled ? "hover:border-[#43A9F6] hover:bg-[#F7FBFF]" : "cursor-default opacity-60"}`}
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F5FF] text-[#238DD7]">
                            <Icon size={20} />
                          </div>
                          <p className="mt-4 font-bold text-[#121826]">{item.title}</p>
                          <p className="mt-2 min-h-10 text-sm leading-6 text-[#667085]">{item.text}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                <h3 className="text-lg font-bold text-[#121826]">
                  {roleKind === "customer" ? "Trip Timeline" : "Today's Activity"}
                </h3>
                <div className="mt-5 grid gap-3">
                  {timeline.map((item, i) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl bg-[#F7F9FC] p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#238DD7]">{i + 1}</div>
                      <p className="text-sm font-semibold text-[#121826]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Aside */}
            <aside className="space-y-6">

              {/* Recent admin activity */}
              {(roleKind === "admin" || roleKind === "sub-admin") && (
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
                            {item.entity_type}{item.entity_id ? ` #${item.entity_id}` : ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#667085]">No recent activity yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Alerts — admin only */}
              {roleKind === "admin" && summary && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
                    <div>
                      <h3 className="text-lg font-bold text-[#121826]">Alerts</h3>
                      <p className="mt-2 text-sm leading-6 text-[#667085]">
                        {summary.pending_admin_users} admin approval{summary.pending_admin_users !== 1 ? "s" : ""},{" "}
                        {summary.pending_suppliers} supplier approval{summary.pending_suppliers !== 1 ? "s" : ""}, and{" "}
                        {summary.pending_payments} pending payment{summary.pending_payments !== 1 ? "s" : ""} need attention.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-admin alerts */}
              {roleKind === "sub-admin" && summary && (canViewSuppliers || canViewAgents || canViewAffiliates) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
                    <div>
                      <h3 className="text-lg font-bold text-[#121826]">Pending Actions</h3>
                      <ul className="mt-2 space-y-1 text-sm text-[#667085]">
                        {canViewSuppliers && <li>{summary.pending_suppliers} supplier{summary.pending_suppliers !== 1 ? "s" : ""} awaiting approval</li>}
                        {canViewAgents && <li>{summary.pending_agents} agent{summary.pending_agents !== 1 ? "s" : ""} awaiting approval</li>}
                        {canViewAffiliates && <li>{summary.pending_affiliates} affiliate{summary.pending_affiliates !== 1 ? "s" : ""} awaiting approval</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority / next trip panel */}
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
                        {roleKind === "customer" ? "Kerala Backwater Escape" : "Pending review queue"}
                      </p>
                      <p className="text-xs text-[#667085]">
                        {roleKind === "customer"
                          ? "3 nights, booking confirmation pending"
                          : "Keep today's operational items moving"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account summary */}
              <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
                <h3 className="text-lg font-bold text-[#121826]">Account Summary</h3>
                <div className="mt-5 grid gap-3">
                  {[
                    ["User", dashboard.user.name],
                    ["Role", dashboard.user.role?.name ?? "—"],
                    ["Modules", dashboard.menus.length],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex items-center justify-between rounded-xl bg-[#F7F9FC] p-3">
                      <span className="text-sm font-semibold text-[#667085]">{label}</span>
                      <b>{val}</b>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

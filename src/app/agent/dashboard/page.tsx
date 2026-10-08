"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCalendarCheck as CalendarCheck,
  LuCircleAlert as AlertCircle,
  LuCircleDollarSign as CircleDollarSign,
  LuFileCheck2 as FileCheck,
  LuFileText as FileText,
  LuHeadphones as Headphones,
  LuLock as Lock,
  LuLogOut as LogOut,
  LuCompass as MapPinned,
  LuMessageSquare as MessageSquare,
  LuPackageCheck as PackageCheck,
  LuPencil as Pencil,
  LuStore as Store,
  LuUserPlus as UserPlus,
  LuUsers as Users,
} from "react-icons/lu";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { formatCurrencyCompact } from "@/lib/utils/currency";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import DatePicker from "@/components/ui/DatePicker";
import { AgentMetric, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";

type Summary = {
  total_bookings?: number;
  active_customers?: number;
  monthly_revenue?: number;
  commission_earned?: number;
  upcoming_bookings?: number;
  completed_bookings?: number;
  currency?: string;
  has_mixed_currencies?: boolean;
  currencies?: string[];
};

type Booking = {
  id: number;
  booking_code: string;
  customer_name?: string;
  tour_name?: string;
  booking_status: string;
  final_amount?: string | number;
  currency?: string;
};

type AgentProfile = {
  agent_name?: string;
  agent_type?: string;
  country_name?: string;
  discount_type?: "percentage" | "fixed" | null;
  discount_value?: number;
  commission_request_type?: "percentage" | "fixed" | null;
  commission_request_value?: number | null;
  commission_request_status?: "pending" | "approved" | "rejected" | null;
  approval_status?: string | null;
  pending_requirements?: string | null;
  admin_comments?: string | null;
  documents?: unknown[];
};

type AccountProfile = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type ChartRow = { status: string; count: number };
type MonthRow = { month: string; count: number };
const CHART_COLORS = ["#43A9F6", "#1D3E64", "#F59E0B", "#EF4444", "#10B981"];

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["active", "confirmed", "paid", "completed", "published"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "pending_payment", "pending_credit_approval", "pending_supplier_acceptance", "supplier_reassignment_required", "submitted", "draft"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["rejected", "cancelled", "declined", "failed"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

function humanize(value?: string) {
  if (!value) return "Under review";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AgentDashboardPage() {
  const { user, logout } = useAuthContext();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [monthlyBookings, setMonthlyBookings] = useState<MonthRow[]>([]);
  const [paymentStatusChart, setPaymentStatusChart] = useState<ChartRow[]>([]);
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
  const [commissionValue, setCommissionValue] = useState("");
  const [calcAmount, setCalcAmount] = useState("");
  const [calcResult, setCalcResult] = useState<{ gross_amount: string; commission_amount: string } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [commissionMessage, setCommissionMessage] = useState("");
  const [commissionSubmitting, setCommissionSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ start_date: "", end_date: "", status: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const bookingParams: Record<string, string | number> = { limit: 5 };
      if (filters.start_date) bookingParams.start_date = filters.start_date;
      if (filters.end_date) bookingParams.end_date = filters.end_date;
      if (filters.status) bookingParams.booking_status = filters.status;
      const summaryParams = {
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        booking_status: filters.status || undefined,
      };
      const [sumRes, bookRes, agentRes, chartsRes, profileRes] = await Promise.allSettled([
        api.get("/dashboard/summary", { params: summaryParams }),
        api.get("/bookings", { params: bookingParams }),
        api.get("/agents/me"),
        api.get("/dashboard/charts", { params: summaryParams }),
        api.get("/profile/me"),
      ]);
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
      if (bookRes.status === "fulfilled") setBookings(bookRes.value.data?.items ?? bookRes.value.data?.data ?? []);
      if (agentRes.status === "fulfilled") setAgentProfile(agentRes.value.data?.data ?? null);
      if (chartsRes.status === "fulfilled") {
        const chartData = chartsRes.value.data?.data ?? {};
        setMonthlyBookings(chartData.monthly_bookings ?? []);
        setPaymentStatusChart(chartData.payment_status_chart ?? []);
      }
      if (profileRes.status === "fulfilled") setAccountProfile(profileRes.value.data?.data ?? profileRes.value.data ?? null);

      const rejections = [sumRes, bookRes, agentRes].filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      if (rejections.length > 0) {
        // A 403 (e.g. the agent's account isn't approved yet) carries a
        // specific, actionable message from the backend - surface that
        // instead of a generic "something failed" banner so the agent
        // knows exactly why their dashboard data is missing.
        const approvalError = rejections.find((r) => r.reason?.response?.status === 403);
        setError(getApiErrorMessage((approvalError ?? rejections[0]).reason));
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const requestCommission = async () => {
    const value = Number(commissionValue);
    if (!Number.isFinite(value) || value <= 0 || (commissionType === "percentage" && value > 100)) {
      setCommissionMessage(commissionType === "percentage" ? "Enter a percentage between 0 and 100." : "Enter a valid fixed amount.");
      return;
    }
    setCommissionSubmitting(true);
    setCommissionMessage("");
    try {
      const response = await api.post("/agents/me/commission-request", { discount_type: commissionType, discount_value: value });
      setAgentProfile(response.data?.data ?? null);
      setCommissionValue("");
      setCommissionMessage("Commission request sent for admin approval.");
    } catch {
      setCommissionMessage("Commission request could not be submitted.");
    } finally {
      setCommissionSubmitting(false);
    }
  };

  const runCommissionCalculator = async () => {
    const amount = Number(calcAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setCalcLoading(true);
    try {
      const res = await api.get("/agents/me/commission-calculator", { params: { amount } });
      setCalcResult(res.data?.data ?? null);
    } catch {
      setCalcResult(null);
    } finally {
      setCalcLoading(false);
    }
  };

  const summaryCurrency = summary.currency?.toUpperCase();
  const summaryHasMixedCurrencies = Boolean(summary.has_mixed_currencies);
  const financialValue = (amount: number | undefined) =>
    summaryHasMixedCurrencies ? "Multiple currencies" : formatCurrencyCompact(amount ?? 0, summaryCurrency || "USD");
  const financialNote = summaryHasMixedCurrencies
    ? "Open bookings to view exact totals"
    : summaryCurrency ? `${summaryCurrency} · Filtered` : "Filtered";

  const stats = [
    { label: "Total Bookings", value: summary.total_bookings ?? 0, icon: CalendarCheck, sub: "Filtered", href: "/agent/bookings" },
    { label: "Active Customers", value: summary.active_customers ?? 0, icon: Users, sub: "Filtered", href: "/agent/customers" },
    { label: "Active Bookings", value: summary.upcoming_bookings ?? 0, icon: PackageCheck, sub: "In progress", href: "/agent/bookings" },
    { label: "Paid Revenue", value: financialValue(summary.monthly_revenue), icon: CircleDollarSign, sub: financialNote, href: "/agent/bookings" },
    { label: "Est. Commission", value: financialValue(summary.commission_earned), icon: CircleDollarSign, sub: financialNote, href: "/agent/invoices" },
    { label: "Completed", value: summary.completed_bookings ?? 0, icon: PackageCheck, sub: "Finished", href: "/agent/bookings" },
  ];

  // Until an admin approves the agent, the backend blocks bookings, customers,
  // invoices, etc. (and the layout locks those links) -- so the dashboard
  // shows the approval checklist instead of shortcuts and stats that can't load.
  const isPending = agentProfile != null && (agentProfile.approval_status ?? "").toLowerCase() !== "approved";
  const documentCount = agentProfile?.documents?.length ?? 0;
  const approvalStatus = agentProfile?.approval_status || "pending";

  const checks = [
    Boolean(agentProfile?.agent_name || accountProfile?.name),
    Boolean(agentProfile?.agent_type),
    Boolean(agentProfile?.country_name),
    Boolean(accountProfile?.phone),
    documentCount > 0,
  ];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const missingDocuments = documentCount === 0;
  const lockedModules = ["Tours", "Bookings", "Customers", "Invoices", "Wishlist"];
  const firstName = (user?.name?.trim().split(/\s+/)[0]) || "Partner";

  return (
    <AgentPageShell>
      {/* Hero Control Centre Banner matching Supplier design */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#10213F] via-[#173D7A] to-[#2563EB] px-5 py-6 text-white shadow-[0_20px_55px_-34px_rgba(28,73,135,.8)] sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[42px] border-white/5" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[42%] h-52 w-52 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-blue-50 backdrop-blur">
                Agent Control Centre
              </span>
              <Link
                href="/agent/profile"
                className={`rounded-full px-3 py-1.5 text-[10px] font-black ring-1 ${
                  isPending
                    ? "bg-amber-100 text-amber-800 ring-amber-200"
                    : "bg-emerald-100 text-emerald-800 ring-emerald-200"
                }`}
              >
                {humanize(approvalStatus)} profile
              </Link>
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-[30px]">
              {isPending ? `Welcome, ${firstName}` : `Good morning, ${firstName}`}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50/80">
              {isPending
                ? "Your account is active. Tourvaa is reviewing your agent profile before unlocking operational tools."
                : "Create customer bookings, track sales performance, and manage every traveller relationship from one focused workspace."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={isPending ? "/agent/profile?tab=documents" : "/agent/tours"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#173D7A] shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5"
              >
                {isPending ? <FileText size={15} /> : <MapPinned size={15} />}
                {isPending ? "Upload documents" : "Browse Tours"}
              </Link>
              {!isPending && (
                <Link
                  href="/agent/bookings"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white backdrop-blur transition hover:bg-white/15"
                >
                  <CalendarCheck size={15} /> Review bookings <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
          <div className="grid min-w-[230px] grid-cols-2 gap-3 rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.12em] text-blue-100">Bookings</p>
              <p className="mt-1 text-2xl font-black">{summary.total_bookings ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.12em] text-blue-100">Customers</p>
              <p className="mt-1 text-2xl font-black">{summary.active_customers ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pending Approval Layout matching Supplier Pending Dashboard */}
      {isPending && (
        <div className="mt-5 space-y-5">
          {(agentProfile?.pending_requirements || agentProfile?.admin_comments) && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
              <h2 className="font-black text-sm uppercase tracking-wide">More information required</h2>
              <p className="mt-1 text-sm leading-6 whitespace-pre-line">
                {agentProfile?.pending_requirements || agentProfile?.admin_comments}
              </p>
            </section>
          )}

          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-2xl border border-[#DCE6F5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-dash-text">Complete your agency profile</h2>
                  <p className="mt-1 text-sm text-dash-muted">
                    A complete profile helps the review team approve your agency faster.
                  </p>
                </div>
                <span className="text-2xl font-black text-blue-600">{completion}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
              {missingDocuments && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  <AlertCircle size={17} /> Verification documents are still missing.
                </p>
              )}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/agent/profile"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  <Store size={16} /> Complete profile
                </Link>
                <Link
                  href="/agent/profile?tab=documents"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition"
                >
                  <FileCheck size={16} /> Upload documents
                </Link>
                <Link
                  href="/agent/messages"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Headphones size={16} /> Contact support
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-[#DCE6F5] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-dash-text">What happens next?</h2>
              <ol className="mt-4 space-y-4 text-sm text-dash-muted">
                <li>
                  <b className="text-dash-text">1. Submit details.</b> Complete your agency profile and verification documents.
                </li>
                <li>
                  <b className="text-dash-text">2. Tourvaa reviews.</b> Our operations team reviews your licence and credentials.
                </li>
                <li>
                  <b className="text-dash-text">3. Operations unlock.</b> You will receive an email notice when booking features activate.
                </li>
              </ol>
            </section>
          </div>

          <section className="rounded-2xl border border-[#DCE6F5] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-dash-text">Operational modules</h2>
            <p className="mt-1 text-sm text-dash-muted">These features unlock automatically after profile approval.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lockedModules.map((module) => (
                <div key={module} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                  <Lock size={16} className="text-amber-500" /> {module}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-rose-600 hover:underline"
            >
              <LogOut size={16} /> Sign out
            </button>
          </section>
        </div>
      )}

      {/* Customer / Supplier style shortcuts */}
      {!isPending && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/agent/tours", label: "Browse Tours", icon: MapPinned, tone: "bg-blue-50 text-blue-600" },
            { href: "/agent/bookings", label: "My Bookings", icon: CalendarCheck, tone: "bg-emerald-50 text-emerald-600" },
            { href: "/agent/customers", label: "Add Customer", icon: UserPlus, tone: "bg-violet-50 text-violet-600" },
            { href: "/agent/invoices", label: "View Invoices", icon: FileText, tone: "bg-amber-50 text-amber-600" },
            { href: "/agent/messages", label: "Messages", icon: MessageSquare, tone: "bg-rose-50 text-rose-600" },
          ].map(({ href, label, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-xl border border-[#DFE7F2] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(28,73,135,.75)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={18} />
              </span>
              <span className="flex-1 text-sm font-black text-dash-text">{label}</span>
              <ArrowRight size={15} className="text-dash-brand transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}

      {/* Account Details Section */}
      <AgentSection
        className="mt-4"
        title="Account Details"
        description="Your agency and contact information at a glance."
        action={{ label: "Edit profile", href: "/agent/profile", icon: Pencil }}
      >
        <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Agent / Agency", value: agentProfile?.agent_name || accountProfile?.name || user?.name },
            { label: "Email address", value: accountProfile?.email || user?.email },
            { label: "Phone number", value: accountProfile?.phone },
            { label: "Agency type", value: agentProfile?.agent_type?.replaceAll("_", " ") },
            { label: "Country", value: agentProfile?.country_name },
            { label: "Business address", value: accountProfile?.address, wide: true },
          ].map(({ label, value, wide }) => (
            <div key={label} className={wide ? "sm:col-span-2 lg:col-span-4" : ""}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-dash-muted">{label}</p>
              <div
                className={`mt-1.5 min-h-10 rounded-xl border px-4 py-2.5 text-xs capitalize ${
                  value
                    ? "border-dash-border bg-white font-semibold text-dash-text"
                    : "border-dashed border-dash-border bg-dash-bg italic text-dash-muted"
                }`}
              >
                {value || "Not provided"}
              </div>
            </div>
          ))}
        </div>
      </AgentSection>

      {!isPending && (
        <>
          {error && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg bg-white px-3 py-1.5 font-bold shadow-sm ring-1 ring-amber-200 hover:bg-amber-100"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-dash-border bg-white" />
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {stats.map(({ label, value, icon, sub, href }) => (
                <Link key={label} href={href} className="transition hover:-translate-y-0.5">
                  <AgentMetric label={label} value={value} icon={icon} note={sub} />
                </Link>
              ))}
            </div>
          )}

          {/* Commission Setup Section */}
          <AgentSection
            className="mt-4"
            title="Commission Setup"
            description="Commission is managed in your agent dashboard and is never shown in the public booking checkout."
          >
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.4fr]">
              <div className="rounded-xl border border-dash-border bg-[var(--portal-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-dash-muted">Approved commission</p>
                <p className="mt-2 text-2xl font-black text-dash-text">
                  {Number(agentProfile?.discount_value || 0).toLocaleString()}
                  {agentProfile?.discount_type === "percentage" ? "%" : " fixed"}
                </p>
                <p className="mt-2 text-xs text-dash-muted">Applied by the backend to eligible completed agent bookings.</p>
                {agentProfile?.commission_request_status && (
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      agentProfile.commission_request_status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    Request {agentProfile.commission_request_status}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-dash-text">Request a commission rate</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
                  <select
                    value={commissionType}
                    onChange={(event) => setCommissionType(event.target.value as "percentage" | "fixed")}
                    className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    max={commissionType === "percentage" ? 100 : undefined}
                    step="0.01"
                    value={commissionValue}
                    onChange={(event) => setCommissionValue(event.target.value)}
                    placeholder={commissionType === "percentage" ? "Requested %" : "Requested amount"}
                    className="rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                  />
                  <button
                    type="button"
                    disabled={commissionSubmitting || agentProfile?.commission_request_status === "pending"}
                    onClick={() => void requestCommission()}
                    className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {commissionSubmitting
                      ? "Sending…"
                      : agentProfile?.commission_request_status === "pending"
                      ? "Pending approval"
                      : "Send request"}
                  </button>
                </div>
                {commissionMessage && <p className="mt-2 text-xs font-semibold text-dash-muted">{commissionMessage}</p>}

                <p className="mt-6 text-sm font-bold text-dash-text">Commission calculator</p>
                <p className="mt-1 text-xs text-dash-muted">See what Tourvaa would pay you at your approved rate for a given booking amount.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={calcAmount}
                    onChange={(event) => setCalcAmount(event.target.value)}
                    placeholder="Booking amount"
                    className="rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                  />
                  <button
                    type="button"
                    disabled={calcLoading}
                    onClick={() => void runCommissionCalculator()}
                    className="rounded-xl border border-dash-border px-5 py-2.5 text-sm font-black text-dash-body hover:bg-dash-bg-muted disabled:opacity-50"
                  >
                    {calcLoading ? "Calculating…" : "Calculate"}
                  </button>
                </div>
                {calcResult && (
                  <p className="mt-2 text-sm text-dash-body">
                    You would earn <strong className="text-emerald-700">{calcResult.commission_amount}</strong> on a {calcResult.gross_amount} booking.
                  </p>
                )}
              </div>
            </div>
          </AgentSection>

          {/* Dashboard Filters */}
          <AgentSection className="mt-4" title="Dashboard Filters" description="Filter booking data by date range and status.">
            <div className="flex flex-wrap items-end gap-4 p-5">
              <DatePicker
                label="Start date"
                value={filters.start_date}
                maxDate={filters.end_date || undefined}
                onChange={(date) => setFilters((filters) => ({ ...filters, start_date: date }))}
                className="min-w-52"
              />
              <DatePicker
                label="End date"
                value={filters.end_date}
                minDate={filters.start_date || undefined}
                onChange={(date) => setFilters((filters) => ({ ...filters, end_date: date }))}
                className="min-w-52"
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Booking Status</label>
                <select
                  title="Booking status"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-dash-body outline-none focus:border-dash-brand"
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="pending_credit_approval">Pending Credit Approval</option>
                  <option value="pending_supplier_acceptance">Pending Supplier</option>
                  <option value="supplier_reassignment_required">Supplier Reassignment</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setFilters({ start_date: "", end_date: "", status: "" })}
                className="flex items-center gap-2 rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-bold text-dash-muted hover:bg-[var(--portal-soft)]"
              >
                ⊘ Reset
              </button>
            </div>
          </AgentSection>

          {/* Booking & payment trends */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AgentSection title="Monthly Bookings" description="Bookings you've made over the last 6 months.">
              <div className="p-5">
                {loading ? (
                  <div className="h-48 animate-pulse rounded-xl bg-dash-bg" />
                ) : monthlyBookings.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-dash-muted">No monthly data yet.</div>
                ) : (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyBookings} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EAF0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#667085" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#667085" }} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "#F7F9FC" }} contentStyle={{ borderRadius: "10px", border: "1px solid #E7EAF0" }} />
                        <Bar dataKey="count" fill="#43A9F6" radius={[4, 4, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </AgentSection>

            <AgentSection title="Payment Status" description="Payment status across your customer bookings.">
              <div className="p-5">
                {loading ? (
                  <div className="h-48 animate-pulse rounded-xl bg-dash-bg" />
                ) : paymentStatusChart.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-dash-muted">No payment data yet.</div>
                ) : (
                  <div className="flex h-48 w-full items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentStatusChart} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={4} dataKey="count" nameKey="status">
                          {paymentStatusChart.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E7EAF0" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </AgentSection>
          </div>

          {/* Two-column panels */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Booking Analytics */}
            <AgentSection title="Booking Analytics" action={{ label: "View all", href: "/agent/bookings", icon: ArrowRight }}>
              <div className="p-5">
                {bookings.length === 0 ? (
                  <p className="py-6 text-center text-sm text-dash-muted">No bookings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between rounded-xl border border-dash-border px-4 py-3">
                        <div>
                          <p className="font-semibold text-dash-text">{b.booking_code}</p>
                          <p className="text-xs text-dash-muted">{b.customer_name ?? b.tour_name ?? "-"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors(b.booking_status)}`}>
                            {b.booking_status.replaceAll("_", " ")}
                          </span>
                          <Link href={`/agent/bookings/${b.id}`} className="text-xs font-bold text-dash-brand hover:underline">
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AgentSection>

            {/* Agent finance and operations */}
            <AgentSection title="Finance & Operations" description="Common sales and finance actions.">
              <div className="space-y-3 p-5">
                {[
                  { label: "Booking invoices", href: "/agent/invoices" },
                  { label: "Booking payment status", href: "/agent/bookings" },
                  { label: "Browse tours to book", href: "/agent/tours" },
                  { label: "Manage customer accounts", href: "/agent/customers" },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center justify-between rounded-xl border border-dash-border px-4 py-3 text-sm font-semibold text-dash-body transition hover:bg-[var(--portal-soft)]"
                  >
                    {label} <ArrowRight size={14} className="text-dash-brand" />
                  </Link>
                ))}
              </div>
            </AgentSection>
          </div>

          {/* Quick nav */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/agent/tours", label: "Browse Tours", icon: MapPinned },
              { href: "/agent/customers", label: "My Customers", icon: Users },
              { href: "/agent/invoices", label: "Invoices", icon: FileText },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-dash-border/60 bg-white p-5 text-sm font-bold text-dash-body shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-dash-brand/30 transition-all hover:-translate-y-0.5 hover:text-dash-brand"
              >
                <Icon size={20} className="text-dash-brand group-hover:text-dash-brand transition-colors" /> {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </AgentPageShell>
  );
}

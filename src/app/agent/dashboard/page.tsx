"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuCalendarCheck as CalendarCheck, LuCircleDollarSign as CircleDollarSign, LuFileText as FileText, LuMapPinned as MapPinned, LuPackageCheck as PackageCheck, LuUsers as Users } from "react-icons/lu";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import DatePicker from "@/components/ui/DatePicker";
import { AgentMetric, AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";

type Summary = {
  total_bookings?: number;
  active_customers?: number;
  monthly_revenue?: number;
  commission_earned?: number;
  upcoming_bookings?: number;
  completed_bookings?: number;
  currency?: string;
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
  discount_type?: "percentage" | "fixed" | null;
  discount_value?: number;
  commission_request_type?: "percentage" | "fixed" | null;
  commission_request_value?: number | null;
  commission_request_status?: "pending" | "approved" | "rejected" | null;
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

export default function AgentDashboardPage() {
  const { user } = useAuthContext();
  const { formatCompact } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
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
        const [sumRes, bookRes, agentRes, chartsRes] = await Promise.allSettled([
          api.get("/dashboard/summary", { params: summaryParams }),
          api.get("/bookings", { params: bookingParams }),
          api.get("/agents/me"),
          api.get("/dashboard/charts", { params: summaryParams }),
        ]);
        if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
        if (bookRes.status === "fulfilled") setBookings(bookRes.value.data?.items ?? bookRes.value.data?.data ?? []);
        if (agentRes.status === "fulfilled") setAgentProfile(agentRes.value.data?.data ?? null);
        if (chartsRes.status === "fulfilled") {
          const chartData = chartsRes.value.data?.data ?? {};
          setMonthlyBookings(chartData.monthly_bookings ?? []);
          setPaymentStatusChart(chartData.payment_status_chart ?? []);
        }

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

  useEffect(() => { void load(); }, [load]);

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

  const stats = [
    { label: "Total Bookings", value: summary.total_bookings ?? 0, icon: CalendarCheck, sub: "Filtered", href: "/agent/bookings" },
    { label: "Active Customers", value: summary.active_customers ?? 0, icon: Users, sub: "Filtered", href: "/agent/customers" },
    { label: "Active Bookings", value: summary.upcoming_bookings ?? 0, icon: PackageCheck, sub: "In progress", href: "/agent/bookings" },
    { label: "Paid Revenue", value: formatCompact(summary.monthly_revenue), icon: CircleDollarSign, sub: "Filtered", href: "/agent/bookings" },
    { label: "Est. Commission", value: formatCompact(summary.commission_earned), icon: CircleDollarSign, sub: "Filtered", href: "/agent/invoices" },
    { label: "Completed", value: summary.completed_bookings ?? 0, icon: PackageCheck, sub: "Finished", href: "/agent/bookings" },
  ];

  return (
    <AgentPageShell>
      <AgentPageHeader
        title={`Welcome back, ${user?.name || "Agent"}`}
        description="Create customer bookings, track sales performance, and manage every traveller relationship."
        icon={PackageCheck}
        eyebrow="Agent Dashboard"
        actions={[{ label: "Browse Tours", href: "/agent/tours", icon: MapPinned }]}
      />

      {/* Stat cards */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="rounded-lg bg-white px-3 py-1.5 font-bold shadow-sm ring-1 ring-amber-200 hover:bg-amber-100">Retry</button>
        </div>
      )}
      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-dash-border bg-white" />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, icon, sub, href }) => (
            <Link key={label} href={href} className="transition hover:-translate-y-0.5">
              <AgentMetric label={label} value={value} icon={icon} note={sub} />
            </Link>
          ))}
        </div>
      )}

      <AgentSection className="mt-4" title="Commission Setup" description="Commission is managed in your agent dashboard and is never shown in the public booking checkout.">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-xl border border-dash-border bg-[var(--portal-soft)] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-dash-muted">Approved commission</p>
            <p className="mt-2 text-2xl font-black text-dash-text">{Number(agentProfile?.discount_value || 0).toLocaleString()}{agentProfile?.discount_type === "percentage" ? "%" : " fixed"}</p>
            <p className="mt-2 text-xs text-dash-muted">Applied by the backend to eligible completed agent bookings.</p>
            {agentProfile?.commission_request_status && <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${agentProfile.commission_request_status === "pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>Request {agentProfile.commission_request_status}</span>}
          </div>
          <div>
            <p className="text-sm font-bold text-dash-text">Request a commission rate</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
              <select value={commissionType} onChange={(event) => setCommissionType(event.target.value as "percentage" | "fixed")} className="rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
              <input type="number" min="0" max={commissionType === "percentage" ? 100 : undefined} step="0.01" value={commissionValue} onChange={(event) => setCommissionValue(event.target.value)} placeholder={commissionType === "percentage" ? "Requested %" : "Requested amount"} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
              <button type="button" disabled={commissionSubmitting || agentProfile?.commission_request_status === "pending"} onClick={() => void requestCommission()} className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{commissionSubmitting ? "Sending…" : agentProfile?.commission_request_status === "pending" ? "Pending approval" : "Send request"}</button>
            </div>
            {commissionMessage && <p className="mt-2 text-xs font-semibold text-dash-muted">{commissionMessage}</p>}

            <p className="mt-6 text-sm font-bold text-dash-text">Commission calculator</p>
            <p className="mt-1 text-xs text-dash-muted">See what Tourvaa would pay you at your approved rate for a given booking amount.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input type="number" min="0" step="0.01" value={calcAmount} onChange={(event) => setCalcAmount(event.target.value)} placeholder="Booking amount" className="rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
              <button type="button" disabled={calcLoading} onClick={() => void runCommissionCalculator()} className="rounded-xl border border-dash-border px-5 py-2.5 text-sm font-black text-dash-body hover:bg-dash-bg-muted disabled:opacity-50">{calcLoading ? "Calculating…" : "Calculate"}</button>
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
          <DatePicker label="Start date" value={filters.start_date} maxDate={filters.end_date || undefined} onChange={(date) => setFilters((filters) => ({ ...filters, start_date: date }))} className="min-w-52" />
          <DatePicker label="End date" value={filters.end_date} minDate={filters.start_date || undefined} onChange={(date) => setFilters((filters) => ({ ...filters, end_date: date }))} className="min-w-52" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Booking Status</label>
            <select title="Booking status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-dash-body outline-none focus:border-dash-brand">
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
          <button type="button" onClick={() => setFilters({ start_date: "", end_date: "", status: "" })}
            className="flex items-center gap-2 rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-bold text-dash-muted hover:bg-[var(--portal-soft)]">
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
                      {paymentStatusChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
                    <Link href={`/agent/bookings/${b.id}`} className="text-xs font-bold text-dash-brand hover:underline">View</Link>
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
              <Link key={label} href={href}
                className="flex items-center justify-between rounded-xl border border-dash-border px-4 py-3 text-sm font-semibold text-dash-body transition hover:bg-[var(--portal-soft)]">
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
          <Link key={label} href={href} className="group flex items-center gap-3 rounded-2xl border border-dash-border/60 bg-white p-5 text-sm font-bold text-dash-body shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-dash-brand/30 transition-all hover:-translate-y-0.5 hover:text-dash-brand">
            <Icon size={20} className="text-dash-brand group-hover:text-dash-brand transition-colors" /> {label}
          </Link>
        ))}
      </div>
    </AgentPageShell>
  );
}

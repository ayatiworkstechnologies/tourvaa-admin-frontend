"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  MapPinned,
  PackageCheck,
  Users,
  Warehouse,
  XCircle,
  Mail,
  Headset,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  FileJson,
  UserPlus,
  Shield,
  Activity,
  AlertTriangle,
  Clock,
  RefreshCw,
  Sun,
  XCircle as CancelIcon,
  UserX,
  CheckCircle2 as ConfirmIcon,
  CheckSquare,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/api";
import { useCurrency } from "@/hooks/useCurrency";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

type Summary = {
  total_bookings?: number;
  total_customers?: number;
  total_suppliers?: number;
  total_agents?: number;
  total_tours?: number;
  total_revenue?: number;
  pending_suppliers?: number;
  pending_agents?: number;
};

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  booking_status: string;
  final_amount?: string | number;
  currency?: string;
};

type PendingSupplier = { id: number; supplier_name: string; email: string };
type PendingAgent = { id: number; agent_name: string; email: string };

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["active", "confirmed", "paid", "completed", "published"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "pending_payment", "submitted", "draft"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["rejected", "cancelled", "declined", "failed"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

function AdminDashboardContent() {
  const { formatCompact } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingSuppliers, setPendingSuppliers] = useState<PendingSupplier[]>([]);
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [charts, setCharts] = useState<any>({});
  const [activities, setActivities] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, bookRes, suppRes, agentRes, chartRes, actRes] = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/bookings", { params: { limit: 5 } }),
        api.get("/suppliers/", { params: { approval_status: "pending", limit: 10 } }),
        api.get("/agents/", { params: { approval_status: "pending", limit: 10 } }),
        api.get("/dashboard/charts"),
        api.get("/dashboard/recent-activities"),
      ]);
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
      if (bookRes.status === "fulfilled") setBookings(bookRes.value.data?.items ?? bookRes.value.data?.data ?? []);
      if (suppRes.status === "fulfilled") setPendingSuppliers(suppRes.value.data?.items ?? suppRes.value.data?.data ?? []);
      if (agentRes.status === "fulfilled") setPendingAgents(agentRes.value.data?.items ?? agentRes.value.data?.data ?? []);
      if (chartRes.status === "fulfilled") setCharts(chartRes.value.data?.data ?? {});
      if (actRes.status === "fulfilled") setActivities(actRes.value.data?.data?.recent_admin_actions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approveSupplier = async (id: number) => {
    setSavingId(`s-${id}`);
    try {
      await api.patch(`/suppliers/${id}/approve`);
      setPendingSuppliers((p) => p.filter((s) => s.id !== id));
      setMsg("Supplier approved.");
    } catch { setMsg("Could not approve supplier."); }
    finally { setSavingId(null); }
  };

  const rejectSupplier = async (id: number) => {
    const reason = window.prompt("Rejection reason:", "Does not meet requirements");
    if (!reason) return;
    setSavingId(`s-${id}`);
    try {
      await api.patch(`/suppliers/${id}/reject`, { rejection_reason: reason });
      setPendingSuppliers((p) => p.filter((s) => s.id !== id));
      setMsg("Supplier rejected.");
    } catch { setMsg("Could not reject supplier."); }
    finally { setSavingId(null); }
  };

  const approveAgent = async (id: number) => {
    setSavingId(`a-${id}`);
    try {
      await api.patch(`/agents/${id}/approve`);
      setPendingAgents((p) => p.filter((a) => a.id !== id));
      setMsg("Agent approved.");
    } catch { setMsg("Could not approve agent."); }
    finally { setSavingId(null); }
  };

  const rejectAgent = async (id: number) => {
    const reason = window.prompt("Rejection reason:", "Does not meet requirements");
    if (!reason) return;
    setSavingId(`a-${id}`);
    try {
      await api.patch(`/agents/${id}/reject`, { rejection_reason: reason });
      setPendingAgents((p) => p.filter((a) => a.id !== id));
      setMsg("Agent rejected.");
    } catch { setMsg("Could not reject agent."); }
    finally { setSavingId(null); }
  };

  const stats = [
    { label: "Total Bookings", value: summary.total_bookings ?? 0, icon: CalendarCheck, sub: "Filtered" },
    { label: "Total Customers", value: summary.total_customers ?? 7, icon: Users, sub: "Platform" },
    { label: "Pending Payments", value: 0, icon: Mail, sub: "Review" },
    { label: "Total Revenue", value: formatCompact(summary.total_revenue), icon: CircleDollarSign, sub: "Revenue" },
    { label: "Suppliers", value: summary.total_suppliers ?? 0, icon: PackageCheck, sub: `${summary.pending_suppliers ?? 0} pending` },
    { label: "Agents", value: summary.total_agents ?? 0, icon: Headset, sub: `${summary.pending_agents ?? 0} pending` },
  ];

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* 1. Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1120] via-[#1D3E64] to-[#43A9F6] p-10 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#43A9F6] bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">Admin Control Center</span>
          <h2 className="mt-4 text-[32px] leading-tight font-black tracking-tight text-white">Platform operations at a glance</h2>
          <p className="mt-2 text-sm text-white/80 max-w-lg">Manage approvals, users, roles, and system activity from one workspace.</p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex flex-col items-center justify-center rounded-2xl bg-white/10 px-8 py-5 backdrop-blur-md border border-white/20 shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">SIGNED IN AS</span>
          <span className="text-xl font-black text-white leading-none">Super Admin</span>
          <span className="text-xs text-white/70 mt-1">Super Admin</span>
        </div>
        
        {/* Subtle background flare */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { label: "Total Bookings", value: summary.total_bookings ?? 0, icon: CalendarCheck, badge: "Filtered" },
          { label: "Total Customers", value: summary.total_customers ?? 7, icon: Users, badge: "Platform" },
          { label: "Pending Payments", value: 0, icon: Mail, badge: "Review" },
          { label: "Total Revenue", value: formatCompact(summary.total_revenue), icon: CircleDollarSign, badge: "Revenue" },
          { label: "Suppliers", value: summary.total_suppliers ?? 0, icon: PackageCheck, badge: `${summary.pending_suppliers ?? 0} pending` },
          { label: "Agents", value: summary.total_agents ?? 0, icon: Headset, badge: `${summary.pending_agents ?? 0} pending` },
        ].map((stat, idx) => (
          <div key={idx} className="group flex items-center gap-5 rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-[#43A9F6]/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F0F7FF] text-[#43A9F6] group-hover:bg-[#43A9F6] group-hover:text-white transition-colors duration-300 shadow-sm">
              <stat.icon size={24} strokeWidth={2} />
            </div>
            <div className="flex flex-1 flex-col justify-between self-stretch">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#667085] uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between mt-1">
                <span className="text-2xl font-black text-[#121826]">{stat.value}</span>
                <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-[#667085] border border-slate-100">{stat.badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Dashboard Filters */}
      <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="mb-6">
          <h2 className="text-lg font-black text-[#121826]">Dashboard Filters</h2>
          <p className="text-sm text-[#667085] font-medium mt-1">Filter operational data by date range and country.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="w-full">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#667085]">Start Date</label>
            <div className="relative">
              <input type="text" placeholder="dd-mm-yyyy" className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-semibold text-[#121826] outline-none focus:border-[#43A9F6] focus:ring-1 focus:ring-[#43A9F6]" />
              <CalendarIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
            </div>
          </div>
          <div className="w-full">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#667085]">End Date</label>
            <div className="relative">
              <input type="text" placeholder="dd-mm-yyyy" className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-semibold text-[#121826] outline-none focus:border-[#43A9F6] focus:ring-1 focus:ring-[#43A9F6]" />
              <CalendarIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
            </div>
          </div>
          <div className="w-full">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#667085]">Country</label>
            <select className="w-full appearance-none rounded-xl border border-[#E7EAF0] bg-white px-4 py-2.5 text-sm font-semibold text-[#121826] outline-none focus:border-[#43A9F6] focus:ring-1 focus:ring-[#43A9F6]">
              <option>All Countries</option>
            </select>
          </div>
          <button className="flex w-full h-[42px] items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-6 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F3F8FC] transition-colors">
            <Filter size={16} /> Reset
          </button>
        </div>
      </div>

      {/* 4. Booking Analytics & Payment Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-6 flex items-center gap-2 text-[#121826]">
            <BarChart3 size={20} className="text-[#43A9F6]" />
            <h2 className="text-base font-black">Booking Analytics</h2>
          </div>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.booking_status_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EAF0" />
                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
                <Tooltip cursor={{ fill: '#F7F9FC' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E7EAF0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="count" fill="#43A9F6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-6 flex items-center gap-2 text-[#121826]">
            <CreditCard size={20} className="text-[#43A9F6]" />
            <h2 className="text-base font-black">Payment Status</h2>
          </div>
          <div className="h-[250px] w-full mt-4 flex items-center justify-center">
            {(!charts.payment_status_chart || charts.payment_status_chart.length === 0) ? (
              <p className="text-sm text-[#667085]">No payment data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.payment_status_chart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {(charts.payment_status_chart || []).map((entry: any, index: number) => {
                      const colors = ['#43A9F6', '#1D3E64', '#F59E0B', '#EF4444', '#10B981'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E7EAF0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      {/* 5. Reports Snapshot & Recent Exports */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-6 flex items-center gap-2 text-[#121826]">
            <TrendingUp size={20} className="text-[#43A9F6]" />
            <h2 className="text-base font-black">Reports Snapshot</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Booking Performance", value: "128", sub: "+12%", status: "ready" },
              { label: "Revenue Summary", value: "₹4.8L", sub: "+8%", status: "ready" },
              { label: "Supplier Approval", value: "14", sub: "5 pending", status: "review" },
              { label: "Agent Sales", value: "36", sub: "+6%", status: "ready" },
              { label: "Payment Collection", value: "92%", sub: "8% pending", status: "review" },
              { label: "Country-wise Bookings", value: "9", sub: "countries", status: "ready" },
            ].map((card) => (
              <div key={card.label} className="flex flex-col justify-between rounded-xl border border-[#E7EAF0] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#121826] leading-tight">{card.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${card.status === 'ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {card.status}
                  </span>
                </div>
                <p className="text-2xl font-black text-[#43A9F6]">{card.value}</p>
                <p className="text-[10px] font-semibold text-[#667085] mt-1">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[#F7F9FC] rounded-xl border border-[#E7EAF0] p-2 shadow-sm">
            {[
              { num: "6", label: "Reports" },
              { num: "3", label: "Scheduled" },
              { num: "18", label: "Exports" },
            ].map((tab, idx) => (
              <div key={tab.label} className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg ${idx === 0 ? 'bg-white shadow-sm' : ''}`}>
                <span className="text-lg font-black text-[#121826]">{tab.num}</span>
                <span className="text-[10px] font-semibold text-[#667085]">{tab.label}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <h2 className="mb-4 text-sm font-black text-[#121826]">Recent Exports</h2>
            <div className="space-y-3">
              {[
                { label: "Monthly Booking Report", date: "2026-06-15 09:30", type: "XLSX" },
                { label: "Supplier Pending Approval", date: "2026-06-14 17:10", type: "PDF" },
                { label: "Payment Collection Summary", date: "2026-06-14 11:45", type: "CSV" },
              ].map((exp) => (
                <div key={exp.label} className="flex items-center justify-between p-3 rounded-xl border border-[#E7EAF0]">
                  <div>
                    <p className="text-xs font-bold text-[#121826] leading-tight">{exp.label}</p>
                    <p className="text-[10px] font-semibold text-[#667085] mt-0.5">{exp.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded bg-[#F0F7FF] text-[10px] font-bold text-[#43A9F6]`}>
                    {exp.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Approval Queues */}
      <div className="space-y-6">
        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Warehouse size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#121826]">Pending Supplier Approvals</h2>
              <p className="text-xs font-semibold text-[#667085]">{pendingSuppliers.length} waiting for review</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-[#F7F9FC] p-4 text-sm font-semibold text-[#667085]">
            {pendingSuppliers.length === 0 ? "No pending supplier approvals." : (
              <ul className="space-y-2">
                {pendingSuppliers.map((s) => (
                  <li key={s.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#E7EAF0]">
                    <div>
                      <span className="font-bold text-[#121826]">{s.supplier_name}</span>
                      <span className="ml-2 text-xs text-[#667085]">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => approveSupplier(s.id)} disabled={savingId === `s-${s.id}`} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100">Approve</button>
                      <button onClick={() => rejectSupplier(s.id)} disabled={savingId === `s-${s.id}`} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F7FF] text-[#43A9F6]">
              <Users size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#121826]">Pending Agent Approvals</h2>
              <p className="text-xs font-semibold text-[#667085]">{pendingAgents.length} waiting for review</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-[#F7F9FC] p-4 text-sm font-semibold text-[#667085]">
            {pendingAgents.length === 0 ? "No pending agent approvals." : (
              <ul className="space-y-2">
                {pendingAgents.map((a) => (
                  <li key={a.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#E7EAF0]">
                    <div>
                      <span className="font-bold text-[#121826]">{a.agent_name}</span>
                      <span className="ml-2 text-xs text-[#667085]">{a.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => approveAgent(a.id)} disabled={savingId === `a-${a.id}`} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100">Approve</button>
                      <button onClick={() => rejectAgent(a.id)} disabled={savingId === `a-${a.id}`} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 7. Bottom Sections (User Approvals, Workspace Actions, Activity) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-[#121826]">User Approvals</h2>
                <p className="text-xs font-semibold text-[#667085]">Pending registrations waiting for admin action</p>
              </div>
              <button className="px-4 py-2 rounded-xl border border-[#E7EAF0] text-xs font-bold text-[#344054] hover:bg-[#F3F8FC]">View All</button>
            </div>
            <div className="rounded-xl bg-[#F7F9FC] p-4 text-sm font-semibold text-[#667085]">
              No pending user approvals right now.
            </div>
          </div>

          <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <div className="mb-4">
              <h2 className="text-base font-black text-[#121826]">Workspace Actions</h2>
              <p className="text-xs font-semibold text-[#667085]">Role focused actions for the current account</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: UserPlus, title: "Users", desc: "Create users, assign roles, and approve accounts." },
                { icon: Shield, title: "Roles", desc: "Manage role access and module permissions." },
                { icon: Headset, title: "Email Templates", desc: "Update system email communication." },
              ].map((act) => (
                <div key={act.title} className="rounded-xl border border-[#E7EAF0] p-4 flex flex-col">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F7FF] text-[#43A9F6]">
                    <act.icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-[#121826]">{act.title}</h3>
                  <p className="text-[11px] font-semibold text-[#667085] mt-1 leading-snug">{act.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <h2 className="mb-6 text-base font-black text-[#121826]">Today's Activity</h2>
            <div className="space-y-4">
              {[
                { num: "1", text: "User approval queue checked" },
                { num: "2", text: "Role access reviewed" },
                { num: "3", text: "Dashboard modules synced" },
              ].map((item) => (
                <div key={item.num} className="flex items-center gap-4 rounded-xl bg-[#F7F9FC] p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E1EFFF] text-xs font-black text-[#43A9F6]">
                    {item.num}
                  </div>
                  <p className="text-sm font-semibold text-[#121826]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <div className="mb-4 flex items-center gap-2 text-[#121826]">
              <Activity size={20} className="text-[#43A9F6]" />
              <h2 className="text-base font-black">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm font-semibold text-[#667085]">No recent activities.</p>
              ) : (
                activities.slice(0, 5).map((log: any, i: number) => (
                  <div key={i} className="rounded-xl bg-[#F7F9FC] p-3">
                    <p className="text-xs font-bold text-[#121826]">{log.action}</p>
                    <p className="text-[10px] font-semibold text-[#667085] mt-0.5">{log.entity_type} #{log.entity_id}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-[#FFFCF5] p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <div className="mb-2 flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} strokeWidth={2.5} />
              <h2 className="text-sm font-black">Alerts</h2>
            </div>
            <p className="text-xs font-semibold text-amber-800 leading-relaxed">
              0 admin approvals, {pendingSuppliers.length} supplier approvals, and 0 pending payments need attention.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <h2 className="mb-3 text-sm font-black text-[#121826]">Priority Panel</h2>
            <div className="rounded-xl bg-[#F0F7FF] p-4 flex items-start gap-3">
              <Clock size={18} className="text-[#43A9F6] mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#121826]">Pending review queue</p>
                <p className="text-[10px] font-semibold text-[#667085] mt-0.5">Keep today's operational items moving</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardShell() {
  const { dashboard, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <p className="text-sm text-red-500">{error || "Could not load dashboard."}</p>
        <button type="button" onClick={() => void refetch()} className="ml-3 text-sm font-bold text-[#43A9F6]">Retry</button>
      </div>
    );
  }

  return (
    <DashboardLayout title="Dashboard" menus={dashboard.menus} user={dashboard.user}>
      <AdminDashboardContent />
    </DashboardLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardShell />
    </ProtectedRoute>
  );
}

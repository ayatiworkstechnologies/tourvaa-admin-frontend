"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import api from "@/lib/api/client";

type CheckoutSession = {
  id: number;
  session_key: string;
  user_id?: number | null;
  customer_id?: number | null;
  tour_id?: number | null;
  step: string;
  status: string;
  booking_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const PAGE_SIZE = 20;

function statusCls(status: string) {
  const v = (status || "").toLowerCase();
  if (v === "completed") return "bg-emerald-50 text-emerald-700";
  if (v === "abandoned") return "bg-red-50 text-red-600";
  return "bg-amber-50 text-amber-700";
}

export default function CheckoutSessionsPage() {
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (status) params.status = status;
      const res = await api.get("/checkout/admin/sessions", { params });
      setSessions(res.data?.items ?? res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
      setTotalPages(res.data?.total_pages ?? 1);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [page, status]);

  const columns: DataTableColumn<CheckoutSession>[] = [
    { key: "session_key", header: "Session Key", className: "font-mono text-xs text-dash-subtle" },
    { key: "step", header: "Step", className: "capitalize" },
    { key: "status", header: "Status", render: (s) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCls(s.status)}`}>{s.status}</span> },
    { key: "tour_id", header: "Tour", render: (s) => (s.tour_id ? `#${s.tour_id}` : "-") },
    { key: "booking_id", header: "Booking", render: (s) => (s.booking_id ? `#${s.booking_id}` : "-") },
    { key: "updated_at", header: "Last Updated", className: "text-xs text-dash-muted", render: (s) => (s.updated_at ? new Date(s.updated_at).toLocaleString() : "-") },
  ];

  return (
    <ModuleWrapper title="Checkout Sessions" requiredPermission="bookings.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Checkout Sessions</h1>
          <p className="text-sm text-dash-muted">Monitor in-progress, completed, and abandoned checkout funnels.</p>
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-dash-border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
        </select>

        <div className="rounded-xl border border-dash-border bg-white shadow-sm">
          <DataTable
            ariaLabel="Checkout sessions table"
            columns={columns}
            rows={sessions}
            loading={loading}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No checkout sessions found"
          />
        </div>
      </div>
    </ModuleWrapper>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type AuditLog = { id: number; action: string; entity_type?: string; entity_id?: number; user_name?: string; user_email?: string; details?: string; ip_address?: string; created_at?: string };

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-sky-50 text-sky-700",
  delete: "bg-red-50 text-red-600",
  approve: "bg-purple-50 text-purple-700",
  reject: "bg-orange-50 text-orange-700",
  login: "bg-slate-50 text-slate-600",
};

function actionCls(action: string) {
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : "bg-slate-50 text-slate-600";
}

export default function AuditLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("");
  const limit = 30;

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit, page };
      if (search) params.search = search;
      if (entity) params.entity_type = entity;
      const res = await api.get("/audit-logs", { params });
      const data = res.data?.data ?? res.data ?? {};
      setLogs(Array.isArray(data) ? data : data.items ?? []);
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      toast.error("Could not load audit logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [page, entity]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void load();
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      className: "text-xs text-[#667085] whitespace-nowrap",
      render: (log) => log.created_at ? new Date(log.created_at).toLocaleString() : "—",
    },
    {
      key: "user",
      header: "User",
      className: "text-xs",
      render: (log) => (
        <>
          <p className="font-semibold text-[#344054]">{log.user_name || "—"}</p>
          {log.user_email && <p className="text-[#98A2B3]">{log.user_email}</p>}
        </>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${actionCls(log.action)}`}>
          {log.action}
        </span>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      className: "text-xs text-[#667085]",
      render: (log) => log.entity_type ? <span>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}</span> : "—",
    },
    {
      key: "ip",
      header: "IP",
      className: "font-mono text-xs text-[#98A2B3]",
      render: (log) => log.ip_address || "—",
    },
    {
      key: "details",
      header: "Details",
      className: "max-w-xs truncate text-xs text-[#667085]",
      render: (log) => log.details || "—",
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#121826]">Audit Logs</h1>
          <p className="mt-1 text-sm text-[#667085]">System-wide record of all admin actions and changes.</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold hover:bg-[#F5F7FA]">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or action"
            className="rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-[#0284C7] w-64" />
          <button type="submit" className="rounded-xl bg-[#121826] px-4 py-2 text-sm font-bold text-white">Search</button>
        </form>
        <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}
          className="rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm">
          <option value="">All entities</option>
          {["tour", "booking", "supplier", "agent", "affiliate", "user", "payout", "refund"].map(e => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="rounded-xl border border-[#E7EAF0] bg-white shadow-sm p-0">
        <DataTable
          ariaLabel="Audit Logs table"
          columns={columns}
          rows={logs}
          loading={loading}
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No audit logs found"
          emptyDescription="Try adjusting your search filters."
        />
      </div>
    </div>
  );
}

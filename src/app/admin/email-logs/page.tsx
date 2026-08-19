"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import api from "@/lib/api/client";

type EmailLog = {
  id: number;
  recipient_email: string;
  subject: string;
  template_key?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  status: string;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
};

const PAGE_SIZE = 20;

function statusCls(status: string) {
  const v = (status || "").toLowerCase();
  if (v === "sent") return "bg-emerald-50 text-emerald-700";
  if (v === "failed") return "bg-red-50 text-red-600";
  return "bg-amber-50 text-amber-700";
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const limit = PAGE_SIZE;

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.get("/email-logs", { params });
      const data = res.data ?? {};
      setLogs(data.items ?? data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  // `search` is intentionally excluded -- it's applied only via the manual
  // handleSearch submit below, not on every keystroke.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [page, status]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void load();
  }

  const columns: DataTableColumn<EmailLog>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * limit + index + 1,
    },
    { key: "recipient_email", header: "Recipient" },
    { key: "subject", header: "Subject", className: "max-w-xs truncate" },
    { key: "template_key", header: "Template", className: "text-dash-muted", render: (log) => log.template_key || "-" },
    {
      key: "status",
      header: "Status",
      render: (log) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCls(log.status)}`}>{log.status}</span>,
    },
    { key: "error_message", header: "Error", className: "max-w-xs truncate text-xs text-red-600", render: (log) => log.error_message || "-" },
    { key: "created_at", header: "Created", className: "text-xs text-dash-muted whitespace-nowrap", render: (log) => (log.created_at ? new Date(log.created_at).toLocaleString() : "-") },
  ];

  return (
    <ModuleWrapper title="Email Logs" requiredPermission="activity_logs.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Email Logs</h1>
          <p className="text-sm text-dash-muted">Delivery history for every system email (approvals, resets, notifications).</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by recipient email"
              className="w-64 rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand"
            />
            <button type="submit" className="rounded-xl bg-dash-text px-4 py-2 text-sm font-bold text-white">Search</button>
          </form>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-xl border border-dash-border px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="sending">Sending</option>
          </select>
        </div>

        <div className="rounded-xl border border-dash-border bg-white shadow-sm">
          <DataTable
            ariaLabel="Email logs table"
            columns={columns}
            rows={logs}
            loading={loading}
            page={page}
            pageSize={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No email logs found"
          />
        </div>
      </div>
    </ModuleWrapper>
  );
}

"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Click = { id: number; ip_address?: string; user_agent?: string; referrer?: string; clicked_at?: string; link_label?: string; ref_code?: string };

export default function ClicksPage() {
  const toast = useToast();
  const { dashboard } = useAuthContext();
  const affiliateId = dashboard?.user?.affiliate_id ?? null;
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (!affiliateId) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/affiliates/${affiliateId}/clicks`, { params: { limit, page } });
        const data = res.data?.data ?? res.data ?? {};
        setClicks(Array.isArray(data) ? data : data.items ?? []);
        setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
      } catch {
        toast.error("Could not load click data.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [affiliateId, page, toast]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const columns: DataTableColumn<Click>[] = [
    { key: "date", header: "Date", className: "text-xs text-dash-body", render: (c) => c.clicked_at ? new Date(c.clicked_at).toLocaleString() : "—" },
    { key: "link", header: "Link / Code", className: "font-mono text-xs text-purple-600", render: (c) => c.link_label || c.ref_code || "—" },
    { key: "ip", header: "IP Address", className: "text-xs text-dash-muted", render: (c) => c.ip_address || "—" },
    { key: "referrer", header: "Referrer", className: "max-w-xs truncate text-xs text-dash-muted", render: (c) => c.referrer || "Direct" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-text">Click Tracking</h1>
        <p className="mt-1 text-sm text-dash-muted">Every click on your referral links is recorded here.</p>
      </div>

      <div className="rounded-xl border border-dash-border bg-white shadow-sm p-0">
        <div className="flex items-center justify-between border-b border-dash-border px-5 py-4">
          <p className="text-sm font-bold text-dash-body">Total: {total.toLocaleString()} clicks</p>
        </div>

        <DataTable
          ariaLabel="Clicks"
          columns={columns}
          rows={clicks}
          loading={loading}
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No clicks yet"
          emptyDescription="Share your referral links to start tracking clicks."
        />
      </div>
    </div>
  );
}

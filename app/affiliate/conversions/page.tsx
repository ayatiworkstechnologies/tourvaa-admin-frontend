"use client";

import { useEffect, useState } from "react";
import { LuTrendingUp as TrendingUp } from "react-icons/lu";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Conversion = { id: number; booking_code?: string; booking_amount?: string; commission_percentage?: number; commission_amount: string; currency: string; status: string; created_at?: string };

function statusCls(s: string) {
  const v = (s || "").toLowerCase();
  if (["approved", "paid"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending"].includes(v)) return "bg-amber-50 text-amber-700";
  return "bg-slate-50 text-slate-600";
}

export default function ConversionsPage() {
  const toast = useToast();
  const { dashboard } = useAuthContext();
  const affiliateId = (dashboard?.user as Record<string, unknown>)?.affiliate_id ?? dashboard?.user?.id;
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const totalCommission = conversions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
  const currency = conversions[0]?.currency || "AED";

  useEffect(() => {
    if (!affiliateId) return;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/affiliates/${affiliateId}/conversions`, { params: { limit, page } });
        const data = res.data?.data ?? res.data ?? {};
        setConversions(Array.isArray(data) ? data : data.items ?? []);
        setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
      } catch {
        toast.error("Could not load conversions.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [affiliateId, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const columns: DataTableColumn<Conversion>[] = [
    { key: "date", header: "Date", className: "text-xs text-[#344054]", render: (c) => c.created_at ? new Date(c.created_at).toLocaleDateString() : "—" },
    { key: "booking", header: "Booking", className: "font-mono text-xs text-[#344054]", render: (c) => c.booking_code || `#${c.id}` },
    { key: "booking_amount", header: "Booking Amount", className: "text-xs text-[#344054]", render: (c) => `${c.currency} ${Number(c.booking_amount || 0).toLocaleString()}` },
    { key: "commission_perc", header: "Commission %", className: "text-xs text-[#344054]", render: (c) => `${c.commission_percentage ?? "—"}%` },
    { key: "commission", header: "Commission", className: "text-sm font-bold text-purple-700", render: (c) => `${c.currency} ${Number(c.commission_amount).toLocaleString()}` },
    { key: "status", header: "Status", render: (c) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCls(c.status)}`}>{c.status}</span> },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">Conversions</h1>
        <p className="mt-1 text-sm text-[#667085]">Bookings made through your referral links.</p>
      </div>

      {!loading && conversions.length > 0 && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Conversions", value: total },
            { label: "Total Commission", value: `${currency} ${totalCommission.toLocaleString()}` },
            { label: "Pending", value: conversions.filter(c => c.status === "pending").length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-[#667085]">{label}</p>
              <p className="mt-2 text-2xl font-black text-[#121826]">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-[#E7EAF0] bg-white shadow-sm p-0">
        <DataTable
          ariaLabel="Conversions"
          columns={columns}
          rows={conversions}
          loading={loading}
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No conversions yet"
          emptyDescription="When someone books through your referral link, it appears here."
        />
      </div>
    </div>
  );
}

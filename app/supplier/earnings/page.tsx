"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  TrendingUp,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type LedgerEntry = {
  id: number;
  booking_code?: string;
  tour_name?: string;
  gross_amount?: number | string;
  commission_amount?: number | string;
  net_amount?: number | string;
  status?: string;
  currency?: string;
  transaction_date?: string;
  created_at?: string;
  description?: string;
};

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["settled", "paid", "completed"].includes(v))
    return "bg-emerald-50 text-emerald-700";
  if (["pending", "processing"].includes(v))
    return "bg-amber-50 text-amber-700";
  if (["failed", "cancelled"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

function money(v: number | string | undefined, cur = "AED") {
  return `${cur} ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function EarningsPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/supplier-ledgers", { params: { limit: 20 } });
      setEntries(res.data?.items ?? res.data?.data ?? res.data ?? []);
    } catch {
      setError("Failed to load earnings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currency =
    entries.find((e) => e.currency)?.currency ?? "AED";

  const totalGross = entries.reduce(
    (sum, e) => sum + Number(e.gross_amount ?? 0),
    0
  );
  const totalCommission = entries.reduce(
    (sum, e) => sum + Number(e.commission_amount ?? 0),
    0
  );
  const totalNet = entries.reduce(
    (sum, e) => sum + Number(e.net_amount ?? 0),
    0
  );
  const totalPaid = entries
    .filter((e) => ["settled", "paid"].includes((e.status ?? "").toLowerCase()))
    .reduce((sum, e) => sum + Number(e.net_amount ?? 0), 0);
  const totalPending = totalNet - totalPaid;

  const summaryCards = [
    {
      label: "Total Gross",
      value: money(totalGross, currency),
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Commission Deducted",
      value: money(totalCommission, currency),
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Net Payable",
      value: money(totalNet, currency),
      icon: Wallet,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Total Paid",
      value: money(totalPaid, currency),
      icon: Banknote,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Pending Payout",
      value: money(totalPending, currency),
      icon: Wallet,
      color: "text-rose-600 bg-rose-50",
    },
  ];

  const columns: DataTableColumn<LedgerEntry>[] = [
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap text-xs text-[#667085]",
      render: (e) => (e.transaction_date ?? e.created_at ?? "").split("T")[0] || "—",
    },
    {
      key: "booking",
      header: "Booking / Description",
      render: (e) => (
        <>
          <p className="font-semibold text-[#121826]">
            {e.booking_code ?? e.description ?? "Ledger entry"}
          </p>
          {e.tour_name && <p className="text-xs text-[#98A2B3]">{e.tour_name}</p>}
        </>
      ),
    },
    {
      key: "gross",
      header: "Gross",
      className: "text-right font-semibold text-[#121826]",
      render: (e) => money(e.gross_amount, e.currency ?? currency),
    },
    {
      key: "commission",
      header: "Commission",
      className: "text-right font-semibold text-amber-600",
      render: (e) => `-${money(e.commission_amount, e.currency ?? currency)}`,
    },
    {
      key: "net",
      header: "Net",
      className: "text-right font-black text-emerald-700",
      render: (e) => money(e.net_amount, e.currency ?? currency),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors(e.status ?? "")}`}>
          {e.status ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#121826]">Earnings</h1>
          <p className="mt-1 text-sm text-[#667085]">
            View your tour earnings and ledger entries.
          </p>
        </div>
        <Link
          href="/supplier/payouts"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
        >
          <Banknote size={16} />
          Request Payout
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-[#E7EAF0] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-[#667085]">
                {label}
              </p>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
              >
                <Icon size={15} />
              </div>
            </div>
            <p className="mt-2 text-sm font-black text-[#121826]">{value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </span>
          <button
            type="button"
            onClick={load}
            className="text-xs font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-xl border border-[#E7EAF0] bg-white shadow-sm p-0">
          <DataTable
            ariaLabel="Earnings table"
            columns={columns}
            rows={entries}
            emptyTitle="No ledger entries yet"
            emptyDescription="Earnings from confirmed bookings will appear here."
          />
        </div>
      )}
    </div>
  );
}

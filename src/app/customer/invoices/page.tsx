"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuReceiptText as ReceiptText } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { CustomerPageHeader, CustomerPageShell } from "@/components/customer/CustomerPage";

type Invoice = {
  id: number;
  invoice_number?: string;
  booking_id?: number;
  booking_code?: string;
  invoice_status?: string;
  total_amount?: string | number;
  grand_total?: string | number;
  currency?: string;
  created_at?: string;
  due_date?: string;
};

function money(value?: string | number, currency = "USD") {
  if (value == null || value === "") return "-";
  const amount = Number(value);
  return Number.isNaN(amount) ? String(value) : `${currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function dateText(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CustomerInvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/customer/invoices", { params: { page, limit } })
      .then((res) => {
        if (!active) return;
        setRows(res.data?.items ?? res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page]);

  const columns: DataTableColumn<Invoice>[] = [
    { key: "invoice", header: "Invoice", render: (i) => i.invoice_number || `#${i.id}`, className: "font-bold text-dash-text" },
    { key: "booking", header: "Booking", render: (i) => i.booking_id ? <Link className="font-semibold text-dash-brand hover:underline" href={`/customer/bookings/${i.booking_id}`}>{i.booking_code || `Booking #${i.booking_id}`}</Link> : "-" },
    { key: "status", header: "Status", render: (i) => <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold capitalize text-slate-700">{(i.invoice_status || "issued").replaceAll("_", " ")}</span> },
    { key: "amount", header: "Amount", render: (i) => money(i.grand_total ?? i.total_amount, i.currency), className: "text-right font-bold text-dash-text" },
    { key: "date", header: "Date", render: (i) => dateText(i.created_at), className: "hidden text-dash-muted md:table-cell" },
  ];

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Invoices"
        description="View and access invoices generated for your confirmed Tourvaa bookings."
        icon={ReceiptText}
        action={{ label: "View Bookings", href: "/customer/bookings" }}
      />
      <div className="mt-4">
        <DataTable ariaLabel="Customer invoices" columns={columns} rows={rows} loading={loading} page={page} pageSize={limit} total={total} totalPages={Math.ceil(total / limit) || 1} onPageChange={setPage} emptyTitle="No invoices found" emptyDescription="Invoices will appear here after booking confirmation." actions={(i) => i.booking_id ? <Link href={`/customer/bookings/${i.booking_id}`} className="inline-flex items-center gap-1 rounded-lg border border-[#D5E1EF] bg-white px-3 py-1.5 text-xs font-bold text-[#315174] hover:border-blue-300 hover:text-[#0865D9]">Booking</Link> : null} />
      </div>
    </CustomerPageShell>
  );
}

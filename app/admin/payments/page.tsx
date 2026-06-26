"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import axios from "axios";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Payment, capturePayment, getPayments, processRefund, voidPayment } from "@/lib/services/paymentService";
import api from "@/lib/api";

const PAGE_SIZE = 15;

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const cls =
    s === "paid" || s === "captured" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
    s === "authorized" || s === "partially_paid" ? "bg-amber-50 text-amber-700 border border-amber-100" :
    s === "pending" ? "bg-blue-50 text-blue-700 border border-blue-100" :
    s === "refunded" || s === "partially_refunded" ? "bg-purple-50 text-purple-700 border border-purple-100" :
    s === "failed" || s === "voided" ? "bg-red-50 text-red-600 border border-red-100" :
    "bg-[#F2F4F7] text-[#475467] border border-[#E7EAF0]";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${cls}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

// ── Action modal ──────────────────────────────────────────────────────────────
type ModalAction = "capture" | "void" | "refund";

function ActionModal({
  payment,
  action,
  onClose,
  onDone,
}: {
  payment: Payment;
  action: ModalAction;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(
    action === "capture" ? String(payment.authorized_amount ?? payment.total_amount) :
    action === "refund" ? String(payment.captured_amount ?? payment.paid_amount) :
    ""
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (action === "capture") {
        await capturePayment(payment.id, parseFloat(amount));
      } else if (action === "void") {
        await voidPayment(payment.id, reason || undefined);
      } else {
        await processRefund(payment.id, parseFloat(amount), reason || undefined);
      }
      onDone();
      onClose();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.message || e.response?.data?.detail || "Action failed.")
        : "Action failed.";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  }

  const titles: Record<ModalAction, string> = {
    capture: "Capture Payment",
    void: "Void Payment",
    refund: "Process Refund",
  };
  const colors: Record<ModalAction, string> = {
    capture: "bg-emerald-600 hover:bg-emerald-700",
    void: "bg-red-600 hover:bg-red-700",
    refund: "bg-purple-600 hover:bg-purple-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[#E7EAF0] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-black text-[#121826]">{titles[action]}</h3>
          <button type="button" onClick={onClose} aria-label="Close" disabled={saving}
            className="rounded-xl p-1.5 text-[#667085] hover:bg-[#F7F9FC]">
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-xs text-[#667085]">
          Payment: <strong className="text-[#121826]">{payment.payment_code}</strong>
          {" · "}Gateway: <strong className="text-[#121826]">{payment.gateway || "manual"}</strong>
        </p>

        {err && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle size={13} className="mt-0.5 shrink-0" /> {err}
          </div>
        )}

        {(action === "capture" || action === "refund") && (
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
              {action === "capture" ? "Capture Amount" : "Refund Amount"}
            </span>
            <input
              type="number" step="0.01" min="0.01" required
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        )}

        {(action === "void" || action === "refund") && (
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Reason (optional)</span>
            <input
              type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Reason for this action"
              className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        )}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60 transition-colors ${colors[action]}`}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {titles[action]}
          </button>
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-bold text-[#667085] hover:bg-[#F7F9FC] disabled:opacity-60">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Status update popover ─────────────────────────────────────────────────────
const STATUSES = ["pending", "authorized", "paid", "partially_paid", "failed", "refunded", "partially_refunded", "voided"];

function StatusSelect({ payment, onDone }: { payment: Payment; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function choose(s: string) {
    setSaving(true);
    try {
      await api.patch(`/payments/${payment.id}/status`, { payment_status: s });
      onDone();
    } catch {
      // silent — DataTable will refresh on done anyway
    } finally {
      setSaving(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)} disabled={saving}
        className="rounded-lg border border-[#E7EAF0] px-2 py-1 text-[10px] font-bold text-[#667085] hover:border-[#B0B8C9] hover:bg-[#F7F9FC] disabled:opacity-50">
        {saving ? <Loader2 size={10} className="animate-spin" /> : "Status ▾"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-[#E7EAF0] bg-white py-1 shadow-lg">
          {STATUSES.map(s => (
            <button key={s} type="button" onClick={() => choose(s)}
              className="w-full px-3 py-1.5 text-left text-xs font-bold capitalize text-[#344054] hover:bg-[#F7F9FC]">
              {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [modal, setModal] = useState<{ payment: Payment; action: ModalAction } | null>(null);

  async function fetchPayments() {
    setIsLoading(true);
    try {
      const res = await getPayments({ page: currentPage, limit: PAGE_SIZE, search: searchTerm });
      setPayments(res.items ?? (res as { data?: Payment[] }).data ?? []);
      setTotalPayments(res.total ?? 0);
      setTotalPages(res.total_pages ?? 1);
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not load payments.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void fetchPayments(); }, [currentPage, searchTerm]);

  function openModal(payment: Payment, action: ModalAction) {
    setModal({ payment, action });
  }

  const columns: DataTableColumn<Payment>[] = [
    { key: "payment_code", header: "Code" },
    { key: "booking_id", header: "Booking" },
    {
      key: "gateway",
      header: "Gateway",
      render: p => <span className="capitalize">{p.gateway || "manual"}</span>,
    },
    { key: "payment_method", header: "Method" },
    {
      key: "payment_status",
      header: "Status",
      render: p => <StatusBadge status={p.payment_status} />,
    },
    {
      key: "total_amount",
      header: "Total",
      render: p => <span className="font-mono text-xs">{Number(p.total_amount).toLocaleString()}</span>,
    },
    {
      key: "captured_amount",
      header: "Captured",
      render: p => <span className="font-mono text-xs text-emerald-700">{Number(p.captured_amount ?? 0).toLocaleString()}</span>,
    },
    {
      key: "refunded_amount",
      header: "Refunded",
      render: p => <span className="font-mono text-xs text-purple-700">{Number(p.refunded_amount ?? 0).toLocaleString()}</span>,
    },
    {
      key: "pending_amount",
      header: "Pending",
      render: p => <span className={`font-mono text-xs ${Number(p.pending_amount) > 0 ? "font-bold text-red-600" : "text-[#667085]"}`}>{Number(p.pending_amount).toLocaleString()}</span>,
    },
    {
      key: "id",
      header: "Actions",
      render: p => {
        const s = p.payment_status.toLowerCase();
        return (
          <div className="flex items-center gap-1.5">
            {(s === "authorized") && (
              <button type="button" onClick={() => openModal(p, "capture")}
                className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                Capture
              </button>
            )}
            {["authorized", "pending"].includes(s) && (
              <button type="button" onClick={() => openModal(p, "void")}
                className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 border border-red-200">
                Void
              </button>
            )}
            {["paid", "partially_paid", "captured"].includes(s) && (
              <button type="button" onClick={() => openModal(p, "refund")}
                className="rounded-lg bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700 hover:bg-purple-100 border border-purple-200">
                Refund
              </button>
            )}
            <StatusSelect payment={p} onDone={fetchPayments} />
          </div>
        );
      },
    },
  ];

  return (
    <ModuleWrapper title="Payments" requiredPermission="payments.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121826]">Payments</h1>
          <p className="text-sm text-[#667085]">
            Monitor authorizations, captures, refunds, and transaction history.
          </p>
        </div>

        <DataTable
          ariaLabel="Payments"
          columns={columns}
          rows={payments}
          loading={isLoading}
          error={errorMessage}
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalPayments}
          totalPages={totalPages}
          search={searchTerm}
          onSearchChange={s => { setCurrentPage(1); setSearchTerm(s); }}
          onPageChange={setCurrentPage}
          emptyTitle="No payments found"
        />
      </div>

      {modal && (
        <ActionModal
          payment={modal.payment}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={fetchPayments}
        />
      )}
    </ModuleWrapper>
  );
}

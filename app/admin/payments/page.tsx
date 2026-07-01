"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, RotateCcw, Wallet, X } from "lucide-react";
import axios from "axios";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Payment, capturePayment, getPayments, processRefund, voidPayment } from "@/lib/services/paymentService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useDebounce } from "@/hooks/useDebounce";
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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function reposition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 192;
      setCoords({
        top: rect.bottom + 4,
        left: Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      });
    }

    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    function handleClickOutside(event: MouseEvent) {
      if (
        !buttonRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

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
    <>
      <button ref={buttonRef} type="button" onClick={() => setOpen(v => !v)} disabled={saving}
        className="rounded-lg border border-[#E7EAF0] px-2 py-1 text-[10px] font-bold text-[#667085] hover:border-[#B0B8C9] hover:bg-[#F7F9FC] disabled:opacity-50">
        {saving ? <Loader2 size={10} className="animate-spin" /> : "Status ▾"}
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            className="z-50 w-48 rounded-xl border border-[#E7EAF0] bg-white py-1 shadow-lg"
          >
            {STATUSES.map(s => (
              <button key={s} type="button" onClick={() => choose(s)}
                className="w-full px-3 py-1.5 text-left text-xs font-bold capitalize text-[#344054] hover:bg-[#F7F9FC]">
                {s.replaceAll("_", " ")}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { hasPermission } = useAuthContext();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [modal, setModal] = useState<{ payment: Payment; action: ModalAction } | null>(null);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, refunded: 0 });

  const debouncedSearch = useDebounce(searchTerm, 350);
  const canCapture = hasPermission("payments.capture") || hasPermission("update-payments");
  const canVoid = hasPermission("payments.void") || hasPermission("update-payments");
  const canRefund = hasPermission("payments.refund") || hasPermission("update-payments");
  const canEdit = hasPermission("payments.edit") || hasPermission("update-payments");

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPayments({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch });
      setPayments(res.items ?? (res as { data?: Payment[] }).data ?? []);
      setTotalPayments(res.total ?? 0);
      setTotalPages(res.total_pages ?? 1);
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not load payments.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => { void fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  const fetchStats = useCallback(async () => {
    try {
      const [allRes, paidRes, pendingRes, refundedRes] = await Promise.all([
        getPayments({ page: 1, limit: 1 }),
        getPayments({ page: 1, limit: 1, payment_status: "paid" }),
        getPayments({ page: 1, limit: 1, payment_status: "pending" }),
        getPayments({ page: 1, limit: 1, payment_status: "refunded" }),
      ]);
      setStats({
        total: allRes.total ?? 0,
        paid: paidRes.total ?? 0,
        pending: pendingRes.total ?? 0,
        refunded: refundedRes.total ?? 0,
      });
    } catch {
      // Non-critical — stat cards just stay at zero.
    }
  }, []);

  useEffect(() => { void fetchStats(); }, [fetchStats]);

  function openModal(payment: Payment, action: ModalAction) {
    setModal({ payment, action });
  }

  async function refreshAll() {
    await Promise.all([fetchPayments(), fetchStats()]);
  }

  const statCards = useMemo(
    () => [
      { label: "Total Payments", value: stats.total, icon: Wallet, accent: "text-[#2F9FE9] bg-[#EDF5FF]" },
      { label: "Paid", value: stats.paid, icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-50" },
      { label: "Pending", value: stats.pending, icon: Clock, accent: "text-amber-700 bg-amber-50" },
      { label: "Refunded", value: stats.refunded, icon: RotateCcw, accent: "text-purple-600 bg-purple-50" },
    ],
    [stats]
  );

  const columns: DataTableColumn<Payment>[] = [
    { key: "payment_code", header: "Code", className: "font-bold text-[#121826]" },
    {
      key: "customer_name",
      header: "Customer",
      render: p => (
        <div>
          <p className="font-semibold text-[#121826]">{p.customer_name || `Customer #${p.customer_id}`}</p>
          {p.customer_email && <p className="text-xs text-[#98A2B3]">{p.customer_email}</p>}
        </div>
      ),
    },
    {
      key: "booking_id",
      header: "Booking",
      render: p => (
        <Link href={`/admin/bookings/${p.booking_id}`} className="font-semibold text-[#2F9FE9] hover:underline">
          {p.booking_code || `#${p.booking_id}`}
        </Link>
      ),
    },
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
            {canCapture && s === "authorized" && (
              <button type="button" onClick={() => openModal(p, "capture")}
                className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                Capture
              </button>
            )}
            {canVoid && ["authorized", "pending"].includes(s) && (
              <button type="button" onClick={() => openModal(p, "void")}
                className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 border border-red-200">
                Void
              </button>
            )}
            {canRefund && ["paid", "partially_paid", "captured"].includes(s) && (
              <button type="button" onClick={() => openModal(p, "refund")}
                className="rounded-lg bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700 hover:bg-purple-100 border border-purple-200">
                Refund
              </button>
            )}
            {canEdit && <StatusSelect payment={p} onDone={refreshAll} />}
          </div>
        );
      },
    },
  ];

  return (
    <ModuleWrapper title="Payments" requiredPermission="payments.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#121826]">Payments</h1>
          <p className="mt-1 text-sm font-medium text-[#667085]">
            Monitor authorizations, captures, refunds, and transaction history.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#98A2B3]">{label}</p>
              <p className="mt-1 text-xl font-black text-[#121826]">{value}</p>
            </div>
          ))}
        </section>

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
          onSearchChange={s => setSearchTerm(s)}
          onPageChange={setCurrentPage}
          emptyTitle="No payments found"
        />
      </div>

      {modal && (
        <ActionModal
          payment={modal.payment}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={refreshAll}
        />
      )}
    </ModuleWrapper>
  );
}

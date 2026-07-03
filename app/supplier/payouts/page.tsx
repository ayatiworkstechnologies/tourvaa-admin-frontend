"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";
import api from "@/lib/api";

type Payout = {
  id: number;
  payout_code?: string;
  amount?: number | string;
  total_amount?: number | string;
  currency?: string;
  status?: string;
  payment_method?: string;
  bank_name?: string;
  account_number?: string;
  notes?: string;
  created_at?: string;
  paid_at?: string;
};

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["paid", "completed", "settled"].includes(v))
    return "bg-emerald-50 text-emerald-700";
  if (["pending", "processing", "approved"].includes(v))
    return "bg-amber-50 text-amber-700";
  if (["failed", "rejected", "cancelled"].includes(v))
    return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

function money(v: number | string | undefined, cur = "AED") {
  return `${cur} ${Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const inputCls =
  "w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelCls = "block text-xs font-bold text-[#344054] mb-1.5";

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/supplier-payouts", { params: { limit: 20 } });
      setPayouts(res.data?.items ?? res.data?.data ?? res.data ?? []);
    } catch {
      setError("Failed to load payouts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRequestPayout = async () => {
    if (!amount || Number(amount) <= 0) {
      setFormError("Please enter a valid amount.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    setFormSuccess(false);
    try {
      await api.post("/supplier-payouts", {
        amount: Number(amount),
        currency,
        payment_method: paymentMethod,
        bank_name: bankName || undefined,
        account_number: accountNumber || undefined,
        notes: notes || undefined,
      });
      setFormSuccess(true);
      setShowForm(false);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setNotes("");
      void load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string; message?: string } } })
          ?.response?.data?.detail ??
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Failed to request payout.";
      setFormError(typeof msg === "string" ? msg : "Failed to request payout.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-emerald-800 p-7 text-white shadow-xl shadow-emerald-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">Payouts</h1>
            <p className="mt-2 max-w-md text-sm font-medium text-emerald-100">
              Request and track your payout batches.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setFormError("");
              setFormSuccess(false);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-all"
          >
            <Plus size={16} />
            Request Payout
          </button>
        </div>
      </div>

      {/* Success message */}
      {formSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} />
          Payout request submitted successfully!
        </div>
      )}

      {/* Payout request form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <h2 className="mb-4 text-base font-black text-[#121826]">
            Request Payout
          </h2>
          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                className={inputCls}
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select
                title="Currency"
                className={inputCls}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="AED">AED</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Payment Method</label>
              <select
                title="Payment method"
                className={inputCls}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online Payment</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Bank Name</label>
              <input
                className={inputCls}
                placeholder="e.g. Emirates NBD"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Account Number / IBAN</label>
              <input
                className={inputCls}
                placeholder="Account or IBAN"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input
                className={inputCls}
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleRequestPayout}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F5F7FA]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[#E7EAF0] bg-white"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && payouts.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#D0D5DD] py-16 text-center">
          <Banknote size={36} className="mx-auto text-[#D0D5DD]" />
          <p className="mt-4 text-base font-bold text-[#667085]">
            No payout requests yet
          </p>
          <p className="mt-1 text-sm text-[#98A2B3]">
            Submit a payout request and it will appear here.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <Plus size={16} />
            Request Payout
          </button>
        </div>
      )}

      {/* Payouts list */}
      {!loading && payouts.length > 0 && (
        <div className="space-y-3">
          {payouts.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-[#E7EAF0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Banknote size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-[#121826]">
                    {p.payout_code ?? `Payout #${p.id}`}
                  </p>
                  <p className="text-xs text-[#667085]">
                    {p.payment_method?.replace(/_/g, " ") ?? "Bank Transfer"}
                    {p.bank_name ? ` - ${p.bank_name}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-[#98A2B3]">
                    Requested:{" "}
                    {(p.created_at ?? "").split("T")[0] || "-"}
                    {p.paid_at
                      ? ` - Paid: ${p.paid_at.split("T")[0]}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-black text-[#121826]">
                    {money(p.total_amount ?? p.amount, p.currency)}
                  </p>
                  {p.notes && (
                    <p className="max-w-[160px] truncate text-xs text-[#98A2B3]">
                      {p.notes}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors(p.status ?? "")}`}
                >
                  {p.status ?? "pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



"use client";

import { useEffect, useState } from "react";
import { LuCalculator as Calculator, LuPercent as Percent, LuSend as Send } from "react-icons/lu";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type AgentProfile = {
  discount_type?: "percentage" | "fixed" | null;
  discount_value?: number | null;
  commission_request_type?: "percentage" | "fixed" | null;
  commission_request_value?: number | null;
  commission_request_status?: "pending" | "approved" | "rejected" | null;
};

export default function AgentCommissionTab() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
  const [commissionValue, setCommissionValue] = useState("");
  const [calcAmount, setCalcAmount] = useState("");
  const [calcResult, setCalcResult] = useState<{ gross_amount: string; commission_amount: string } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/agents/me")
      .then((res) => setProfile(res.data?.data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const requestCommission = async () => {
    const value = Number(commissionValue);
    if (!Number.isFinite(value) || value <= 0 || (commissionType === "percentage" && value > 100)) {
      setMessage(
        commissionType === "percentage"
          ? "Enter a percentage between 0 and 100."
          : "Enter a valid fixed amount."
      );
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await api.post("/agents/me/commission-request", {
        discount_type: commissionType,
        discount_value: value,
      });
      setProfile(response.data?.data ?? null);
      setCommissionValue("");
      setMessage("Commission request sent for admin approval.");
    } catch {
      setMessage("Commission request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  const runCalculator = async () => {
    const amount = Number(calcAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setCalcLoading(true);
    try {
      const res = await api.get("/agents/me/commission-calculator", { params: { amount } });
      setCalcResult(res.data?.data ?? null);
    } catch {
      setCalcResult(null);
    } finally {
      setCalcLoading(false);
    }
  };

  if (loading) return <Loader label="Loading commission..." />;

  const approvedRate = profile?.discount_value ?? 0;
  const isPercent = profile?.discount_type === "percentage" || !profile?.discount_type;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-dash-text">
          <Percent size={18} /> Tourvaa Agent Commission
        </h2>
        <p className="mt-1 text-sm text-dash-muted">
          Your approved agent commission is deducted from checkout prices or credited towards your completed bookings. Commission details remain private to your agent dashboard and are never revealed to travellers.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Approved Rate Card */}
        <div className="rounded-2xl border border-dash-border bg-[#F8FAFD] p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-dash-muted">Approved Commission Rate</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-dash-brand">
              {Number(approvedRate).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-dash-muted">
              {isPercent ? "% percentage" : "fixed amount per booking"}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-dash-muted">
            Automatically applied by Tourvaa backend to all eligible completed tour bookings.
          </p>

          {profile?.commission_request_status && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-3 py-1.5 text-xs font-bold">
              <span className="text-dash-muted">Status:</span>
              <span
                className={`capitalize ${
                  profile.commission_request_status === "approved"
                    ? "text-emerald-700"
                    : profile.commission_request_status === "pending"
                    ? "text-amber-700"
                    : "text-rose-600"
                }`}
              >
                Request {profile.commission_request_status}
              </span>
            </div>
          )}
        </div>

        {/* Request Rate Card */}
        <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black text-dash-text">Request a Commission Rate Change</h3>
          <p className="mt-1 text-xs text-dash-muted">
            Submit a commission rate revision to Tourvaa admin for review and contract update.
          </p>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <select
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value as "percentage" | "fixed")}
                className="rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
              <input
                type="number"
                min="0"
                max={commissionType === "percentage" ? 100 : undefined}
                step="0.01"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder={commissionType === "percentage" ? "e.g. 12" : "e.g. 50"}
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand"
              />
            </div>

            <button
              type="button"
              disabled={submitting || profile?.commission_request_status === "pending"}
              onClick={() => void requestCommission()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-dash-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={15} />
              {submitting
                ? "Submitting…"
                : profile?.commission_request_status === "pending"
                ? "Request Pending Review"
                : "Submit Commission Request"}
            </button>

            {message && <p className="text-xs font-semibold text-dash-brand">{message}</p>}
          </div>
        </div>
      </div>

      {/* Calculator Section */}
      <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm sm:p-6">
        <h3 className="flex items-center gap-2 text-sm font-black text-dash-text">
          <Calculator size={16} /> Commission Calculator
        </h3>
        <p className="mt-1 text-xs text-dash-muted">
          Simulate what you would earn based on your approved commission rate for any tour booking value.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="number"
            min="0"
            step="0.01"
            value={calcAmount}
            onChange={(e) => setCalcAmount(e.target.value)}
            placeholder="Enter total booking amount"
            className="w-full max-w-xs rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
          />
          <button
            type="button"
            disabled={calcLoading || !calcAmount}
            onClick={() => void runCalculator()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {calcLoading ? "Calculating…" : "Calculate Earnings"}
          </button>
        </div>

        {calcResult && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            You will earn <strong className="font-black text-emerald-700">{calcResult.commission_amount}</strong> on a {calcResult.gross_amount} booking.
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <aside className="rounded-2xl border border-dash-border bg-[#F8FAFD] p-5 text-xs leading-5 text-dash-muted">
        <h4 className="font-black uppercase tracking-wider text-dash-text">Agent Terms &amp; Conditions</h4>
        <p className="mt-2">
          Commission is applied in accordance with the signed Tourvaa Agency Partner Agreement. Payouts are made after booking confirmation and trip completion. Tourvaa reserves the right to adjust commercial rates during seasonal campaigns with mutual agreement.
        </p>
      </aside>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { LuCircleCheck as CircleCheck, LuLoaderCircle as Loader2, LuPercent as Percent } from "react-icons/lu";
import api from "@/lib/api/client";

type Props = {
  /** AppSetting key to read the default commission % from (GET /settings/public). */
  settingsKey: string;
  /** Endpoint to POST when the user clicks "Yes" (e.g. "/suppliers/me/accept-commission"). */
  acceptEndpoint: string;
  /** e.g. "Your Default Commission to Tourvaa" (supplier -- they pay Tourvaa)
   * vs "Your Default Commission from Tourvaa" (agent/affiliate -- Tourvaa
   * pays them). Passed in per-portal rather than derived here, since the
   * direction of the money flow differs by role. */
  title: string;
  /** Short explanation of what the rate means for this role, e.g. "This is
   * the commission Tourvaa deducts from your price on every booking." */
  description: string;
  onAccepted: () => void;
};

/** Mandatory, non-dismissable popup shown right after login (before
 * document upload / general portal access) until the user accepts the
 * platform's default commission rate. Modeled on the existing
 * "approvalNotice" dialog pattern in supplier/layout.tsx. */
export default function CommissionConsentModal({ settingsKey, acceptEndpoint, title, description, onAccepted }: Props) {
  const [percentage, setPercentage] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/settings/public")
      .then((res) => {
        if (cancelled) return;
        setPercentage(res.data?.data?.[settingsKey] ?? "0");
      })
      .catch(() => {
        if (!cancelled) setPercentage("0");
      });
    return () => {
      cancelled = true;
    };
  }, [settingsKey]);

  const submit = async () => {
    if (!agreed) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(acceptEndpoint);
      onAccepted();
    } catch {
      setError("Could not save your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="commission-consent-title">
      <section className="animate-in fade-in zoom-in-95 duration-200 relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-7 shadow-2xl">
        <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-dash-bg-muted blur-2xl" />

        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dash-brand text-white shadow-lg">
            <Percent size={24} />
          </span>
          <h2 id="commission-consent-title" className="mt-4 text-xl font-black leading-tight text-dash-text">
            {title}
          </h2>

          <div className="mt-4 rounded-2xl border border-dash-border bg-dash-bg px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-dash-subtle">Your rate</p>
            <p className="mt-1 text-4xl font-black text-dash-brand">
              {percentage === null ? <Loader2 size={28} className="animate-spin text-dash-subtle" /> : `${percentage}%`}
            </p>
          </div>

          <p className="mt-4 text-sm leading-6 text-dash-muted">{description}</p>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-dash-border bg-white p-3.5 transition hover:border-dash-brand/40">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-dash-brand"
            />
            <span className="text-sm font-semibold text-dash-body">
              Do you agree to the above commission percentage?
            </span>
          </label>

          {error && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600">{error}</p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!agreed || submitting || percentage === null}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-dash-brand-hover disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CircleCheck size={16} />}
            {submitting ? "Saving…" : "Yes, I agree"}
          </button>
        </div>
      </section>
    </div>
  );
}

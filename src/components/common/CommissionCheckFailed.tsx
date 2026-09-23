"use client";

import { LuRefreshCw as RefreshCw, LuShieldAlert as ShieldAlert } from "react-icons/lu";

// Shown by the supplier, agent and affiliate layouts when the commission
// agreement status can't be loaded. Commission consent is a financial
// agreement, so a failed check must block the portal (fail closed) instead
// of being treated as "accepted".
export default function CommissionCheckFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
      <div role="alert" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow ring-1 ring-dash-border">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert size={24} />
        </span>
        <h1 className="mt-4 text-lg font-black text-dash-text">Unable to verify your commission agreement</h1>
        <p className="mt-2 text-sm text-dash-muted">
          We couldn&apos;t confirm whether you&apos;ve accepted Tourvaa&apos;s commission terms. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover"
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    </div>
  );
}

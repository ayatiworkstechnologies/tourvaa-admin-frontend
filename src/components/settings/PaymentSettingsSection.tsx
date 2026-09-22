"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type PaymentSummary = {
  stripe_enabled: boolean;
  stripe_public_key: string;
  stripe_secret_key: string; // masked, display-only
  paypal_enabled: boolean;
  paypal_client_id: string;
  paypal_secret: string; // masked, display-only
  paypal_webhook_id: string;
  payment_surcharge_percentage: string;
  default_payment_mode: string;
  stripe_last_test_status?: string | null;
  stripe_last_test_at?: string | null;
  stripe_last_test_error?: string | null;
  paypal_last_test_status?: string | null;
  paypal_last_test_at?: string | null;
  paypal_last_test_error?: string | null;
};

type ConnectionTestResult = {
  provider: string;
  connected: boolean;
  mode: string | null;
  error: string | null;
  checked_at: string;
};

const inputClass = "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand";

function ConnectionStatusBadge({
  status,
  error,
  mode,
  checkedAt,
}: {
  status: string | null | undefined;
  error?: string | null;
  mode?: string | null;
  checkedAt?: string | null;
}) {
  const normalized = (status || "").toLowerCase();
  const tone =
    normalized === "connected"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "failed"
      ? "bg-red-50 text-red-600"
      : "bg-slate-100 text-slate-600";
  const label =
    normalized === "connected"
      ? "Connected"
      : normalized === "failed"
      ? `Failed${error ? `: ${error}` : ""}`
      : "Not configured";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span title={error || undefined} className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
        {label}
      </span>
      {mode && <span className="text-xs font-semibold uppercase text-dash-muted">{mode}</span>}
      {checkedAt && (
        <span className="text-xs text-dash-muted">Checked {new Date(checkedAt).toLocaleString()}</span>
      )}
    </div>
  );
}

export default function PaymentSettingsSection() {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Non-secret fields mirror the server directly. Secret fields are always
  // typed fresh here (start blank) - the GET response's masked value (e.g.
  // "sk_test************") is shown only as a hint, never as the field's
  // actual value, so re-saving without changing it can't accidentally
  // overwrite the real stored secret with the masked placeholder text.
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [paypalWebhookId, setPaypalWebhookId] = useState("");
  const [surcharge, setSurcharge] = useState("0");
  const [mode, setMode] = useState("test");
  const [testing, setTesting] = useState<"stripe" | "paypal" | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings/payment/summary");
      const data: PaymentSummary = res.data.data;
      setSummary(data);
      setStripeEnabled(data.stripe_enabled);
      setStripePublicKey(data.stripe_public_key || "");
      setStripeSecretKey("");
      setPaypalEnabled(data.paypal_enabled);
      setPaypalClientId(data.paypal_client_id || "");
      setPaypalSecret("");
      setPaypalWebhookId(data.paypal_webhook_id || "");
      setSurcharge(data.payment_surcharge_percentage || "0");
      setMode(data.default_payment_mode || "test");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload: Record<string, unknown> = {
        stripe_enabled: stripeEnabled,
        stripe_public_key: stripePublicKey,
        paypal_enabled: paypalEnabled,
        paypal_client_id: paypalClientId,
        paypal_webhook_id: paypalWebhookId,
        payment_surcharge_percentage: surcharge,
        default_payment_mode: mode,
      };
      // Only send secrets the admin actually typed - omitting them entirely
      // leaves the existing encrypted value untouched server-side.
      if (stripeSecretKey.trim()) payload.stripe_secret_key = stripeSecretKey.trim();
      if (paypalSecret.trim()) payload.paypal_secret = paypalSecret.trim();

      await api.put("/settings/payment", payload);
      setMessage("Payment settings updated successfully.");
      await load();
    } catch {
      setMessage("Could not update payment settings.");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider: "stripe" | "paypal") => {
    setTesting(provider);
    setMessage("");
    try {
      const res = await api.post(`/settings/payment/${provider}/test-connection`);
      const result: ConnectionTestResult = res.data.data;
      setTestResults((prev) => ({ ...prev, [provider]: result }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          provider,
          connected: false,
          mode: null,
          error: "Could not run the connection test.",
          checked_at: new Date().toISOString(),
        },
      }));
    } finally {
      setTesting(null);
    }
  };

  if (loading) return <Loader label="Loading payment settings..." />;
  if (!summary) return null;

  const stripeResult = testResults.stripe;
  const paypalResult = testResults.paypal;

  return (
    <form onSubmit={save} className="space-y-6">
      {message && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-dash-brand-hover">{message}</p>}

      <div className="rounded-xl border border-dash-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-bold text-dash-text">Stripe</h4>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={stripeEnabled} onChange={(e) => setStripeEnabled(e.target.checked)} /> Enabled
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Publishable key</span><input value={stripePublicKey} onChange={(e) => setStripePublicKey(e.target.value)} className={inputClass} /></label>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Secret key</span>
            <input type="password" value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} placeholder={summary.stripe_secret_key ? `Saved: ${summary.stripe_secret_key} (leave blank to keep)` : "Not set"} className={inputClass} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dash-border pt-4">
          <ConnectionStatusBadge
            status={stripeResult ? (stripeResult.connected ? "connected" : "failed") : summary.stripe_last_test_status}
            error={stripeResult ? stripeResult.error : summary.stripe_last_test_error}
            mode={stripeResult ? stripeResult.mode : null}
            checkedAt={stripeResult ? stripeResult.checked_at : summary.stripe_last_test_at}
          />
          <button
            type="button"
            disabled={testing === "stripe"}
            onClick={() => testConnection("stripe")}
            className="rounded-lg border border-dash-border px-4 py-2 text-xs font-bold text-dash-text hover:bg-dash-bg-subtle disabled:opacity-60"
          >
            {testing === "stripe" ? "Testing..." : "Test Connection"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dash-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-bold text-dash-text">PayPal</h4>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={paypalEnabled} onChange={(e) => setPaypalEnabled(e.target.checked)} /> Enabled
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Client ID</span><input value={paypalClientId} onChange={(e) => setPaypalClientId(e.target.value)} className={inputClass} /></label>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Secret</span>
            <input type="password" value={paypalSecret} onChange={(e) => setPaypalSecret(e.target.value)} placeholder={summary.paypal_secret ? `Saved: ${summary.paypal_secret} (leave blank to keep)` : "Not set"} className={inputClass} />
          </label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Webhook ID</span><input value={paypalWebhookId} onChange={(e) => setPaypalWebhookId(e.target.value)} className={inputClass} /></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dash-border pt-4">
          <ConnectionStatusBadge
            status={paypalResult ? (paypalResult.connected ? "connected" : "failed") : summary.paypal_last_test_status}
            error={paypalResult ? paypalResult.error : summary.paypal_last_test_error}
            mode={paypalResult ? paypalResult.mode : null}
            checkedAt={paypalResult ? paypalResult.checked_at : summary.paypal_last_test_at}
          />
          <button
            type="button"
            disabled={testing === "paypal"}
            onClick={() => testConnection("paypal")}
            className="rounded-lg border border-dash-border px-4 py-2 text-xs font-bold text-dash-text hover:bg-dash-bg-subtle disabled:opacity-60"
          >
            {testing === "paypal" ? "Testing..." : "Test Connection"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Surcharge %</span><input type="number" value={surcharge} onChange={(e) => setSurcharge(e.target.value)} className={inputClass} /></label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Default mode</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <button disabled={saving} className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
          {saving ? "Saving..." : "Save Payment Settings"}
        </button>
      </div>
    </form>
  );
}

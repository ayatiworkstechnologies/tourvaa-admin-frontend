"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type SmtpSummary = {
  is_enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string; // masked, display-only
  from_name: string;
  from_email: string;
  reply_to: string;
  use_ssl: boolean;
  use_starttls: boolean;
  timeout_seconds: number;
};

const inputClass = "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand";

export default function SmtpSettingsSection() {
  const [summary, setSummary] = useState<SmtpSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [isEnabled, setIsEnabled] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("465");
  const [username, setUsername] = useState("");
  // Password always starts blank -- the GET response's masked value is a
  // hint only, never the field's actual value (same contract as Stripe/
  // PayPal secrets above), so re-saving without changing it can't
  // accidentally overwrite the real stored password with masked text.
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState("Tourvaa");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [useSsl, setUseSsl] = useState(true);
  const [useStarttls, setUseStarttls] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState("20");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings/smtp");
      const data: SmtpSummary = res.data.data;
      setSummary(data);
      setIsEnabled(data.is_enabled);
      setHost(data.host || "");
      setPort(String(data.port ?? 465));
      setUsername(data.username || "");
      setPassword("");
      setFromName(data.from_name || "Tourvaa");
      setFromEmail(data.from_email || "");
      setReplyTo(data.reply_to || "");
      setUseSsl(data.use_ssl);
      setUseStarttls(data.use_starttls);
      setTimeoutSeconds(String(data.timeout_seconds ?? 20));
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
        is_enabled: isEnabled,
        host,
        port: Number(port) || 465,
        username,
        from_name: fromName,
        from_email: fromEmail,
        reply_to: replyTo,
        use_ssl: useSsl,
        use_starttls: useStarttls,
        timeout_seconds: Number(timeoutSeconds) || 20,
      };
      // Only send the password if the admin actually typed one - omitting
      // it entirely leaves the existing encrypted value untouched server-side.
      if (password.trim()) payload.password = password.trim();

      await api.put("/settings/smtp", payload);
      setMessage("SMTP settings updated successfully.");
      await load();
    } catch {
      setMessage("Could not update SMTP settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading SMTP settings..." />;
  if (!summary) return null;

  return (
    <form onSubmit={save} className="space-y-6">
      {message && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-dash-brand-hover">{message}</p>}

      <div className="rounded-xl border border-dash-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-bold text-dash-text">SMTP Server</h4>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} /> Use this configuration
          </label>
        </div>
        <p className="mb-4 text-xs text-dash-subtle">
          When disabled (or left empty), the platform falls back to its default environment-configured mail server.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Host</span><input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.example.com" className={inputClass} /></label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Port</span><input type="number" value={port} onChange={(e) => setPort(e.target.value)} className={inputClass} /></label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Username</span><input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} /></label>
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={summary.password ? `Saved: ${summary.password} (leave blank to keep)` : "Not set"} className={inputClass} />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-dash-border p-5">
        <h4 className="mb-4 font-bold text-dash-text">Sender</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">From name</span><input value={fromName} onChange={(e) => setFromName(e.target.value)} className={inputClass} /></label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">From email</span><input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className={inputClass} /></label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Reply-to</span><input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} className={inputClass} /></label>
        </div>
      </div>

      <div className="rounded-xl border border-dash-border p-5">
        <h4 className="mb-4 font-bold text-dash-text">Connection</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={useSsl} onChange={(e) => setUseSsl(e.target.checked)} /> Use SSL
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={useStarttls} onChange={(e) => setUseStarttls(e.target.checked)} /> Use STARTTLS
          </label>
          <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Timeout (seconds)</span><input type="number" value={timeoutSeconds} onChange={(e) => setTimeoutSeconds(e.target.value)} className={inputClass} /></label>
        </div>
      </div>

      <div className="flex justify-end">
        <button disabled={saving} className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
          {saving ? "Saving..." : "Save SMTP Settings"}
        </button>
      </div>
    </form>
  );
}

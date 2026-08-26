"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type ApiSummary = {
  google_map_api_key: string; // masked, display-only
  email_api_key: string; // masked, display-only
  sms_api_key: string; // masked, display-only
  brightlane_external_link: string;
  viator_api_key: string; // masked, display-only
  viator_affiliate_pid: string; // not a secret - shown in full
};

const inputClass = "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand";

export default function ApiSettingsSection() {
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Same masked-secret pattern as PaymentSettingsSection: secret fields start
  // blank, GET's masked value is shown only as a hint via placeholder text.
  const [googleMapsKey, setGoogleMapsKey] = useState("");
  const [emailApiKey, setEmailApiKey] = useState("");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [brightlaneLink, setBrightlaneLink] = useState("");
  const [viatorApiKey, setViatorApiKey] = useState("");
  const [viatorAffiliatePid, setViatorAffiliatePid] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings/api/summary");
      const data: ApiSummary = res.data.data;
      setSummary(data);
      setGoogleMapsKey("");
      setEmailApiKey("");
      setSmsApiKey("");
      setBrightlaneLink(data.brightlane_external_link || "");
      setViatorApiKey("");
      setViatorAffiliatePid(data.viator_affiliate_pid || "");
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
        brightlane_external_link: brightlaneLink,
        viator_affiliate_pid: viatorAffiliatePid,
      };
      if (googleMapsKey.trim()) payload.google_map_api_key = googleMapsKey.trim();
      if (emailApiKey.trim()) payload.email_api_key = emailApiKey.trim();
      if (smsApiKey.trim()) payload.sms_api_key = smsApiKey.trim();
      if (viatorApiKey.trim()) payload.viator_api_key = viatorApiKey.trim();

      await api.put("/settings/api", payload);
      setMessage("API settings updated successfully.");
      await load();
    } catch {
      setMessage("Could not update API settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading API settings..." />;
  if (!summary) return null;

  return (
    <form onSubmit={save} className="space-y-6">
      {message && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-dash-brand-hover">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Google Maps API key</span>
          <input type="password" value={googleMapsKey} onChange={(e) => setGoogleMapsKey(e.target.value)} placeholder={summary.google_map_api_key ? `Saved: ${summary.google_map_api_key} (leave blank to keep)` : "Not set"} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Email service API key</span>
          <input type="password" value={emailApiKey} onChange={(e) => setEmailApiKey(e.target.value)} placeholder={summary.email_api_key ? `Saved: ${summary.email_api_key} (leave blank to keep)` : "Not set"} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">SMS service API key</span>
          <input type="password" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} placeholder={summary.sms_api_key ? `Saved: ${summary.sms_api_key} (leave blank to keep)` : "Not set"} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Brightlane external link</span>
          <input value={brightlaneLink} onChange={(e) => setBrightlaneLink(e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Viator API key (exp-api-key)</span>
          <input type="password" value={viatorApiKey} onChange={(e) => setViatorApiKey(e.target.value)} placeholder={summary.viator_api_key ? `Saved: ${summary.viator_api_key} (leave blank to keep)` : "Not set"} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Viator affiliate Partner ID (PID)</span>
          <input value={viatorAffiliatePid} onChange={(e) => setViatorAffiliatePid(e.target.value)} placeholder="P00000000" className={inputClass} />
        </label>
      </div>
      <div className="flex justify-end">
        <button disabled={saving} className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
          {saving ? "Saving..." : "Save API Settings"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type ApiSummary = {
  google_map_api_key: string; // masked, display-only
  email_api_key: string; // masked, display-only
  sms_api_key: string; // masked, display-only
  brightlane_external_link: string;
  viator_api_key: string; // masked, display-only
  viator_affiliate_pid: string; // not a secret - shown in full
  viator_enabled: boolean;
};

const inputClass = "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand";

// Same badge look as the Security Status section on the General tab
// (rounded-full px-2.5 py-1 text-xs font-bold) -- reused here instead of
// inventing new styling, just with a neutral (not configured/missing) color
// since "not implemented" isn't a pass/fail state.
function NotImplementedBadge() {
  return (
    <span
      title="This integration is seeded in Settings but has no working backend implementation yet -- configuring credentials here has no effect."
      className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500"
    >
      Not Implemented
    </span>
  );
}

function UnimplementedRow({ label }: { label: string }) {
  return (
    <label className="opacity-60">
      <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-dash-muted">
        {label}
        <NotImplementedBadge />
      </span>
      <input type="password" value="" disabled placeholder="Not wired up to any backend functionality" className={`${inputClass} cursor-not-allowed bg-gray-50`} />
    </label>
  );
}

export default function ApiSettingsSection() {
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Same masked-secret pattern as PaymentSettingsSection: secret fields start
  // blank, GET's masked value is shown only as a hint via placeholder text.
  // google_maps / email_service / sms_service are seeded ApiSetting rows with
  // no real backend consumer (see app/services/settings.py DEFAULT_API_SETTINGS
  // vs. app/utils/mailer.py which uses the separate SmtpSetting table) -- they
  // render as disabled "Not Implemented" rows below instead of live inputs,
  // so no local state is needed for them.
  const [brightlaneLink, setBrightlaneLink] = useState("");
  const [viatorApiKey, setViatorApiKey] = useState("");
  const [viatorAffiliatePid, setViatorAffiliatePid] = useState("");
  const [viatorEnabled, setViatorEnabled] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings/api/summary");
      const data: ApiSummary = res.data.data;
      setSummary(data);
      setBrightlaneLink(data.brightlane_external_link || "");
      setViatorApiKey("");
      setViatorAffiliatePid(data.viator_affiliate_pid || "");
      setViatorEnabled(Boolean(data.viator_enabled));
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
        viator_enabled: viatorEnabled,
      };
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
        <UnimplementedRow label="Google Maps API key" />
        <UnimplementedRow label="Email service API key" />
        <UnimplementedRow label="SMS service API key" />
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
      <label className="flex items-center gap-3 rounded-xl border border-dash-border px-4 py-3">
        <input type="checkbox" checked={viatorEnabled} onChange={(e) => setViatorEnabled(e.target.checked)} className="h-4 w-4 rounded border-dash-border" />
        <span>
          <span className="block text-sm font-bold text-dash-text">Enable Viator</span>
          <span className="block text-xs text-dash-muted">
            Turns on Viator day tours &amp; experiences (homepage option, country pages, free itinerary days). Test the connection, sync destinations and choose where experiences appear in{" "}
            <Link href="/admin/integrations/viator" className="font-bold text-dash-brand underline">Integrations → Viator</Link>. The sandbox/production API host is set by VIATOR_ENV on the server.
          </span>
        </span>
      </label>
      <div className="flex justify-end">
        <button disabled={saving} className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
          {saving ? "Saving..." : "Save API Settings"}
        </button>
      </div>
    </form>
  );
}

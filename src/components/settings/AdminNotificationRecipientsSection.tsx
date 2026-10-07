"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type RecipientSettings = {
  admin_notification_to: string;
  admin_notification_cc: string;
  admin_notification_bcc: string;
};

const inputClass = "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand";

export default function AdminNotificationRecipientsSection() {
  const [settings, setSettings] = useState<RecipientSettings | null>(null);
  const [adminTo, setAdminTo] = useState("");
  const [adminCc, setAdminCc] = useState("");
  const [adminBcc, setAdminBcc] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await api.get("/settings/smtp");
      const data: RecipientSettings = response.data.data;
      setSettings(data);
      setAdminTo(data.admin_notification_to || "");
      setAdminCc(data.admin_notification_cc || "");
      setAdminBcc(data.admin_notification_bcc || "");
    } catch {
      setSettings(null);
      setMessage("Could not load notification recipients.");
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
      await api.put("/settings/smtp", {
        admin_notification_to: adminTo,
        admin_notification_cc: adminCc,
        admin_notification_bcc: adminBcc,
      });
      setMessage("Admin notification recipients updated successfully.");
      await load();
    } catch {
      setMessage("Could not update notification recipients.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading notification recipients..." />;
  if (!settings) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{message || "Could not load notification recipients."}</p>
        <button type="button" onClick={() => void load()} className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100">Retry</button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-dash-border bg-white p-6">
      <h3 className="mb-1 text-lg font-bold text-dash-text">Admin Notification Recipients</h3>
      <p className="mb-5 text-sm text-dash-muted">Optional comma-separated addresses for Tourvaa operational booking, payment, cancellation and refund alerts.</p>
      {message && <p className="mb-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-dash-brand-hover">{message}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Admin To</span><input type="text" value={adminTo} onChange={(event) => setAdminTo(event.target.value)} placeholder="ops@example.com" className={inputClass} /></label>
        <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Admin CC</span><input type="text" value={adminCc} onChange={(event) => setAdminCc(event.target.value)} placeholder="manager@example.com" className={inputClass} /></label>
        <label><span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Admin BCC</span><input type="text" value={adminBcc} onChange={(event) => setAdminBcc(event.target.value)} placeholder="audit@example.com" className={inputClass} /></label>
      </div>
      <div className="mt-5 flex justify-end">
        <button disabled={saving} className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
          {saving ? "Saving..." : "Save Notification Recipients"}
        </button>
      </div>
    </form>
  );
}

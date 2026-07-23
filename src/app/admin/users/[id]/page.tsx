"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowLeft as ArrowLeft, LuCircleCheckBig as Check, LuPower as Power } from "react-icons/lu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Loader from "@/components/ui/Loader";
import api from "@/lib/api/client";
import { useDashboard } from "@/hooks/useDashboard";
import { User } from "@/types/user";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { dashboard, loading: dashboardLoading } = useDashboard();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try { const response = await api.get(`/users/${id}`); setUser(response.data.data); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function activate() {
    setSaving(true); setMessage("");
    try { await api.post(`/users/${id}/activate`, { role_id: user?.role_id }); setMessage("Account activated."); await load(); }
    catch { setMessage("Could not activate this account."); } finally { setSaving(false); }
  }
  async function deactivate() {
    if (reason.trim().length < 3) return setMessage("Enter a deactivation reason.");
    setSaving(true); setMessage("");
    try { await api.post(`/users/${id}/deactivate`, { reason }); setReason(""); setMessage("Account deactivated and sessions revoked."); await load(); }
    catch { setMessage("Could not deactivate this account."); } finally { setSaving(false); }
  }

  if (dashboardLoading || loading) return <Loader label="Loading user..." fullScreen />;
  if (!dashboard || !user) return null;
  const fields = [
    ["User type", user.user_type || user.role?.name || "—"],
    ["Email", user.email],
    ["Mobile", user.phone || "—"],
    ["Email verified", user.email_verified ? "Yes" : "No"],
    ["Password created", user.password_created ? "Yes" : "No"],
    ["Admin verified", user.admin_verified ? "Yes" : "No"],
    ["Registered", new Date(user.created_at).toLocaleString()],
    ["Last login", user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"],
  ];
  return <DashboardLayout title="User details" menus={dashboard.menus} user={dashboard.user}><div className="space-y-6">
    <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-dash-brand"><ArrowLeft size={16} />Back to users</Link>
    <section className="rounded-2xl border border-dash-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-black text-dash-text">{user.name}</h1><p className="mt-1 text-sm text-dash-muted">{user.email}</p></div><span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">{(user.account_status || "ACTIVE").replaceAll("_", " ")}</span></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([label, value]) => <div key={label} className="rounded-xl bg-dash-bg p-4"><p className="text-xs font-bold uppercase tracking-wide text-dash-muted">{label}</p><p className="mt-2 break-words text-sm font-semibold text-dash-text">{value}</p></div>)}</div>
      {message && <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</p>}
      <div className="mt-6 border-t border-dash-border pt-6">
        {user.account_status === "ACTIVE" ? <div className="max-w-xl"><label className="text-xs font-bold text-dash-text">Reason for deactivation</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-dash-border p-3 text-sm" rows={3} /><button onClick={() => void deactivate()} disabled={saving} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"><Power size={15} />Deactivate account</button></div> : <button onClick={() => void activate()} disabled={saving || !user.password_created || !user.email_verified} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Check size={16} />{user.deactivated_at ? "Reactivate account" : "Activate account"}</button>}
      </div>
    </section>
    <section className="rounded-2xl border border-dash-border bg-white p-6"><h2 className="font-black text-dash-text">Account history</h2><div className="mt-4 space-y-3">{(user.status_history || []).map((entry) => <div key={entry.id} className="border-l-2 border-blue-200 pl-4"><p className="text-sm font-bold text-dash-text">{entry.to_status.replaceAll("_", " ")}</p><p className="text-xs text-dash-muted">{entry.reason || "Status updated"} · {new Date(entry.created_at).toLocaleString()}</p></div>)}{!user.status_history?.length && <p className="text-sm text-dash-muted">No status changes recorded.</p>}</div></section>
  </div></DashboardLayout>;
}

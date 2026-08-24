"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCircleCheck as CircleCheck, LuPencil as Pencil, LuPercent as Percent, LuPlus as Plus, LuX as X } from "react-icons/lu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";

type UserType = "affiliate" | "agent" | "supplier";

// Maps each user type to the AppSetting key that stores its default
// commission %. Supplier's key is also the platform-minimum floor (see
// app/services/settings.py get_commission_percentage) - editing it here is
// the same write as the "Tourvaa Tour Commission (Minimum)" field on the
// main Settings page. Dot colors mirror each portal's own brand color
// (src/lib/constants/portalThemes.ts) so a row is recognizable at a glance.
const USER_TYPES: { value: UserType; label: string; key: string; dot: string; chip: string }[] = [
  { value: "affiliate", label: "Affiliate", key: "affiliate_default_commission_value", dot: "bg-[#7E22CE]", chip: "bg-[#F3E8FD] text-[#7E22CE]" },
  { value: "agent", label: "Agent", key: "agent_default_commission_percentage", dot: "bg-[#2563EB]", chip: "bg-[#EFF6FF] text-[#2563EB]" },
  { value: "supplier", label: "Supplier", key: "supplier_commission_percentage", dot: "bg-[#16833A]", chip: "bg-emerald-50 text-emerald-700" },
];

export default function DefaultCommissionsPage() {
  const { dashboard, loading: dashboardLoading } = useDashboard();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [editing, setEditing] = useState<{ userType: UserType; percentage: string } | null>(null);

  const fetchValues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/settings/");
      const items: { key: string; value: string | null }[] = response.data.data || [];
      const byKey = new Map(items.map((item) => [item.key, item.value ?? ""]));
      setValues(
        USER_TYPES.reduce<Record<string, string>>((acc, type) => {
          acc[type.key] = byKey.get(type.key) ?? "";
          return acc;
        }, {})
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchValues();
  }, [fetchValues]);

  const openRule = (userType: UserType) => {
    const type = USER_TYPES.find((t) => t.value === userType)!;
    setEditing({ userType, percentage: values[type.key] ?? "" });
    setMessage("");
  };

  const saveRule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const type = USER_TYPES.find((t) => t.value === editing.userType)!;
    const percentage = Number(editing.percentage);
    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      setMessageTone("error");
      setMessage("Enter a percentage between 0 and 100.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await api.put("/settings/", { settings: { [type.key]: String(percentage) } });
      setEditing(null);
      setMessageTone("success");
      setMessage(`${type.label} default commission updated to ${percentage}%.`);
      await fetchValues();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      setMessageTone("error");
      setMessage(detail?.message ?? detail?.detail ?? "Could not update the default commission.");
    } finally {
      setSaving(false);
    }
  };

  if (dashboardLoading || loading) {
    return <Loader label="Loading default commissions..." fullScreen />;
  }
  if (!dashboard) return null;

  return (
    <ProtectedRoute requiredPermission="settings.view">
      <DashboardLayout title="Default Commissions" menus={dashboard.menus} user={dashboard.user}>
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="relative overflow-hidden rounded-2xl border border-[#DCE6F5] bg-white p-6 shadow-[0_14px_40px_-32px_rgba(24,76,140,.6)]">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#EAF3FF] blur-2xl" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#2989F2] to-[#1755C6] text-white shadow-lg shadow-blue-200">
                  <Percent size={24} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#2563C7]">Platform Settings</p>
                  <h1 className="mt-1 text-[22px] font-black leading-tight tracking-tight text-dash-text">Default Commissions</h1>
                  <p className="mt-1 max-w-xl text-[13px] leading-5 text-dash-muted">
                    The commission percentage a new Affiliate, Agent, or Supplier is shown and asked to accept right
                    after they log in for the first time, before they can upload verification documents.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openRule("supplier")}
                className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-dash-brand-hover"
              >
                <Plus size={15} /> New Rule
              </button>
            </div>

            {message && (
              <div className={`relative mt-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold ${
                messageTone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"
              }`}>
                {messageTone === "success" && <CircleCheck size={16} className="shrink-0" />}
                {message}
              </div>
            )}

            <div className="relative mt-5 overflow-hidden rounded-xl border border-dash-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-dash-bg text-[11px] font-black uppercase tracking-wide text-dash-muted">
                  <tr>
                    <th className="px-4 py-3">User Type</th>
                    <th className="px-4 py-3">Commission Type</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border">
                  {USER_TYPES.map((type) => (
                    <tr key={type.value} className="transition-colors hover:bg-dash-bg/60">
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-2 font-bold text-dash-text">
                          <span className={`h-2 w-2 rounded-full ${type.dot}`} />
                          {type.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${type.chip}`}>Percentage</span>
                      </td>
                      <td className="px-4 py-3.5 text-base font-black text-dash-text">{values[type.key] || "0"}%</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openRule(type.value)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border px-3 py-1.5 text-xs font-bold text-dash-body transition-colors hover:bg-dash-bg"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {editing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <form onSubmit={saveRule} className="animate-in fade-in zoom-in-95 duration-200 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-lg font-black text-dash-text">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF5FF] text-dash-brand-hover"><Percent size={16} /></span>
                  New Rule
                </h2>
                <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="text-dash-subtle hover:text-dash-text">
                  <X size={18} />
                </button>
              </div>

              <label className="mt-5 block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">User Type</span>
                <select
                  value={editing.userType}
                  onChange={(event) => {
                    const userType = event.target.value as UserType;
                    const type = USER_TYPES.find((t) => t.value === userType)!;
                    setEditing({ userType, percentage: values[type.key] ?? "" });
                  }}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                >
                  {USER_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Percentage</span>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={editing.percentage}
                    onChange={(event) => setEditing({ ...editing, percentage: event.target.value })}
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 pr-9 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-dash-muted">%</span>
                </div>
              </label>

              {editing.userType === "supplier" && (
                <p className="mt-3 rounded-lg bg-dash-bg px-3 py-2 text-xs text-dash-subtle">
                  This is also the platform-wide minimum supplier commission -- the same field shown on the main Settings page.
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-dash-brand-hover disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Rule"}
              </button>
            </form>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

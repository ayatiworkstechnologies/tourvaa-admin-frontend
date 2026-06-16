"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import api from "@/lib/api";
import Loader from "@/components/ui/Loader";

const groupLabels: Record<string, string> = {
  general: "System Settings",
  system: "System Controls",
  booking: "Booking Defaults",
  payment: "Payment Placeholders",
  api: "API Placeholders",
};

const booleanSettingKeys = new Set([
  "maintenance_mode",
  "stripe_enabled",
  "paypal_enabled",
]);

const secretSettingKeys = new Set([
  "stripe_secret_key",
  "paypal_secret",
  "google_map_api_key",
  "email_api_key",
  "sms_api_key",
  "third_party_api_key",
]);

type Setting = {
  id: number;
  key: string;
  value: string | null;
  label: string;
  group: string;
  is_public: boolean;
};

export default function SettingsPage() {
  const { dashboard, loading: dashboardLoading } = useDashboard();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeGroup, setActiveGroup] = useState("general");

  const grouped = useMemo(() => {
    return settings.reduce<Record<string, Setting[]>>((groups, setting) => {
      groups[setting.group] = groups[setting.group] || [];
      groups[setting.group].push(setting);
      return groups;
    }, {});
  }, [settings]);

  const groupEntries = useMemo(() => Object.entries(grouped), [grouped]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/settings/");
      const items: Setting[] = response.data.data || [];
      setSettings(items);
      setForm(
        items.reduce<Record<string, string>>((values, item) => {
          values[item.key] = item.value || "";
          return values;
        }, {})
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await api.put("/settings/", { settings: form });
      setMessage("Settings updated successfully.");
      await fetchSettings();
    } catch {
      setMessage("Could not update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (dashboardLoading || loading) {
    return <Loader label="Loading settings..." fullScreen />;
  }
  if (!dashboard) return null;

  return (
    <ProtectedRoute requiredPermission="settings.view">
    <DashboardLayout title="Settings" menus={dashboard.menus} user={dashboard.user}>
      <form onSubmit={saveSettings} className="space-y-6">
        <section className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
          <h2 className="text-2xl font-bold text-[#121826]">General Settings</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Manage system settings, payment placeholders, and API placeholders.
          </p>
          {message && (
            <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-[#238DD7]">
              {message}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-[#E7EAF0] bg-white p-3">
          <div className="flex flex-wrap gap-2">
            {groupEntries.map(([group]) => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeGroup === group
                    ? "bg-[#43A9F6] text-white"
                    : "text-[#667085] hover:bg-[#F7F9FC]"
                }`}
              >
                {groupLabels[group] || group}
              </button>
            ))}
          </div>
        </section>

        {groupEntries
          .filter(([group]) => group === activeGroup)
          .map(([group, items]) => (
          <section key={group} className="rounded-2xl border border-[#E7EAF0] bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-[#121826]">
              {groupLabels[group] || group}
            </h3>
            <p className="mb-5 text-sm text-[#667085]">
              {group === "payment"
                ? "Store payment provider placeholders until full payment integration is ready."
                : group === "api"
                ? "Keep third-party API placeholders ready for future integrations."
                : "Update platform defaults used by the admin and customer experience."}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((setting) => (
                <label key={setting.key} className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                    {setting.label}
                  </span>
                  {booleanSettingKeys.has(setting.key) ? (
                    <select
                      value={form[setting.key] || "false"}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [setting.key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                  ) : setting.key === "default_payment_mode" ? (
                    <select
                      value={form[setting.key] || "test"}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [setting.key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    >
                      <option value="test">Test</option>
                      <option value="live">Live</option>
                    </select>
                  ) : (
                    <input
                      type={secretSettingKeys.has(setting.key) ? "password" : "text"}
                      value={form[setting.key] || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [setting.key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}

        <div className="flex justify-end">
          <button
            disabled={saving}
            className="rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </DashboardLayout>
    </ProtectedRoute>
  );
}

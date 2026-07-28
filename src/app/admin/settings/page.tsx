"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import api from "@/lib/api/client";
import Loader from "@/components/ui/Loader";
import { invalidateCurrencyCache } from "@/hooks/useCurrency";
import CurrencySelect from "@/components/ui/CurrencySelect";
import PaymentSettingsSection from "@/components/settings/PaymentSettingsSection";
import ApiSettingsSection from "@/components/settings/ApiSettingsSection";
import SmtpSettingsSection from "@/components/settings/SmtpSettingsSection";
import CurrencyRatesSection from "@/components/settings/CurrencyRatesSection";

const groupLabels: Record<string, string> = {
  general: "System Settings",
  system: "System Controls",
  booking: "Booking Defaults",
  payment: "Payment Settings",
  api: "API Settings",
  smtp: "Email / SMTP",
  currency: "Currency",
};

const booleanSettingKeys = new Set([
  "maintenance_mode",
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
    return settings
      // "default_currency" is a legacy duplicate of "currency" (Booking
      // Defaults) -- the backend keeps them mirrored automatically, so only
      // show the one currency picker to avoid a confusing second field.
      // "payment"/"api" groups are excluded here on purpose: those AppSetting
      // rows are a disconnected, unencrypted copy that the real payment
      // gateway code never reads - PaymentSettingsSection/ApiSettingsSection
      // below talk to the actual encrypted PaymentSetting/ApiSetting tables.
      .filter((setting) => setting.key !== "default_currency" && setting.group !== "payment" && setting.group !== "api")
      .reduce<Record<string, Setting[]>>((groups, setting) => {
        groups[setting.group] = groups[setting.group] || [];
        groups[setting.group].push(setting);
        return groups;
      }, {});
  }, [settings]);

  const groupEntries = useMemo(() => Object.entries(grouped), [grouped]);
  // Payment/API/SMTP tabs are always shown (backed by dedicated components,
  // not the fetched AppSetting list), appended after whatever general/system/
  // booking groups the backend returns.
  const tabKeys = useMemo(() => [...groupEntries.map(([group]) => group), "payment", "api", "smtp", "currency"], [groupEntries]);

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
    void fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await api.put("/settings/", { settings: form });
      invalidateCurrencyCache();
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

  const activeGenericGroup = grouped[activeGroup];

  return (
    <ProtectedRoute requiredPermission="settings.view">
    <DashboardLayout title="Settings" menus={dashboard.menus} user={dashboard.user}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-dash-border bg-white p-6">
          <h2 className="text-2xl font-bold text-dash-text">General Settings</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage system defaults, payment provider values, and API credentials.
          </p>
          {message && (
            <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-dash-brand-hover">
              {message}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-dash-border bg-white p-3">
          <div className="flex flex-wrap gap-2">
            {tabKeys.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeGroup === group
                    ? "bg-dash-brand text-white"
                    : "text-dash-muted hover:bg-dash-bg"
                }`}
              >
                {groupLabels[group] || group}
              </button>
            ))}
          </div>
        </section>

        {activeGroup === "payment" && (
          <section className="rounded-2xl border border-dash-border bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-dash-text">Payment Settings</h3>
            <p className="mb-5 text-sm text-dash-muted">Live Stripe/PayPal credentials used by the actual checkout flow.</p>
            <PaymentSettingsSection />
          </section>
        )}

        {activeGroup === "api" && (
          <section className="rounded-2xl border border-dash-border bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-dash-text">API Settings</h3>
            <p className="mb-5 text-sm text-dash-muted">Third-party API credentials used by connected services.</p>
            <ApiSettingsSection />
          </section>
        )}

        {activeGroup === "smtp" && (
          <section className="rounded-2xl border border-dash-border bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-dash-text">Email / SMTP</h3>
            <p className="mb-5 text-sm text-dash-muted">Mail server used to send password resets, approvals, and notifications.</p>
            <SmtpSettingsSection />
          </section>
        )}

        {activeGroup === "currency" && (
          <section className="rounded-2xl border border-dash-border bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-dash-text">Currency</h3>
            <p className="mb-5 text-sm text-dash-muted">Live exchange rates used for display conversion (booking/payment amounts always stay in their original currency).</p>
            <CurrencyRatesSection />
          </section>
        )}

        {activeGenericGroup && (
          <form onSubmit={saveSettings}>
            <section className="rounded-2xl border border-dash-border bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-dash-text">
                {groupLabels[activeGroup] || activeGroup}
              </h3>
              <p className="mb-5 text-sm text-dash-muted">
                Update platform defaults used by the admin and customer experience.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {activeGenericGroup.map((setting) => (
                  <label key={setting.key} className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
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
                        className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                      >
                        <option value="false">Disabled</option>
                        <option value="true">Enabled</option>
                      </select>
                    ) : setting.key === "currency" ? (
                      <CurrencySelect
                        value={form[setting.key] || "USD"}
                        onChange={(code) =>
                          setForm((current) => ({
                            ...current,
                            [setting.key]: code,
                          }))
                        }
                      />
                    ) : (
                      <input
                        value={form[setting.key] || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [setting.key]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>

            <div className="mt-6 flex justify-end">
              <button
                disabled={saving}
                className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}

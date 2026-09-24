"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuSlidersHorizontal as SlidersHorizontal,
} from "react-icons/lu";
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
import DefaultCancellationPolicySection from "@/components/settings/DefaultCancellationPolicySection";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";

const groupLabels: Record<string, string> = {
  general: "System Settings",
  system: "System Controls",
  pricing: "Pricing & Commission",
  booking_rules: "Booking Rules",
  agent: "Agent Settings",
  affiliate: "Affiliate Settings",
  payment: "Payment Settings",
  api: "API Settings",
  smtp: "Email / SMTP",
  currency: "Currency",
  security: "Security Status",
};

const booleanSettingKeys = new Set([
  "maintenance_mode",
  "force_site_currency",
]);

const imageSettingKeys = new Set(["logo", "favicon"]);

// Two AppSetting rows whose values are fixed in Python code (money rounding
// is hardcoded, not actually driven by these settings) -- the backend now
// hard-rejects any PUT that changes them, so the UI must show them as
// read-only instead of letting an admin edit-then-fail.
const readOnlySystemKeys = new Set(["money_decimal_places", "money_rounding_method"]);

const TIMEZONE_OPTIONS = [
  ["Pacific/Auckland", "Auckland (NZST/NZDT)"],
  ["Pacific/Fiji", "Fiji (FJT)"],
  ["Australia/Sydney", "Sydney (AEST/AEDT)"],
  ["Australia/Perth", "Perth (AWST)"],
  ["Asia/Tokyo", "Tokyo (JST)"],
  ["Asia/Singapore", "Singapore (SGT)"],
  ["Asia/Kolkata", "India (IST)"],
  ["Asia/Dubai", "Dubai (GST)"],
  ["Asia/Karachi", "Pakistan (PKT)"],
  ["Asia/Dhaka", "Dhaka (BST)"],
  ["Asia/Bangkok", "Bangkok (ICT)"],
  ["Asia/Shanghai", "China (CST)"],
  ["Asia/Hong_Kong", "Hong Kong (HKT)"],
  ["Europe/London", "London (GMT/BST)"],
  ["Europe/Paris", "Paris (CET/CEST)"],
  ["Europe/Berlin", "Berlin (CET/CEST)"],
  ["Europe/Istanbul", "Istanbul (TRT)"],
  ["Africa/Johannesburg", "Johannesburg (SAST)"],
  ["Africa/Nairobi", "Nairobi (EAT)"],
  ["America/New_York", "New York (EST/EDT)"],
  ["America/Chicago", "Chicago (CST/CDT)"],
  ["America/Denver", "Denver (MST/MDT)"],
  ["America/Los_Angeles", "Los Angeles (PST/PDT)"],
  ["America/Toronto", "Toronto (EST/EDT)"],
  ["America/Sao_Paulo", "São Paulo (BRT)"],
  ["UTC", "UTC (Coordinated Universal Time)"],
] as const;

const LEGACY_TIMEZONE_ALIASES: Record<string, string> = {
  India: "Asia/Kolkata",
  IST: "Asia/Kolkata",
  "New Zealand": "Pacific/Auckland",
  NZST: "Pacific/Auckland",
  Auckland: "Pacific/Auckland",
  GMT: "UTC",
};

function normalizeTimezone(value: string) {
  return LEGACY_TIMEZONE_ALIASES[value.trim()] || value.trim();
}

function TimezoneSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const known = TIMEZONE_OPTIONS.some(([zone]) => zone === value);
  let preview = "Select a timezone";
  if (value) {
    try {
      preview = new Intl.DateTimeFormat("en-GB", {
        timeZone: value,
        dateStyle: "full",
        timeStyle: "medium",
      }).format(now);
    } catch {
      preview = "Invalid timezone";
    }
  }

  return (
    <>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
      >
        <option value="" disabled>Select timezone</option>
        {!known && value && <option value={value}>{value}</option>}
        {TIMEZONE_OPTIONS.map(([zone, label]) => <option key={zone} value={zone}>{label} — {zone}</option>)}
      </select>
      <p className="mt-2 text-xs text-dash-subtle">Current platform time: <span className="font-semibold text-dash-muted">{preview}</span></p>
    </>
  );
}

// Clearer admin-facing labels/help copy for the three related currency
// settings, without touching the underlying AppSetting `key` values sent to
// the API (renaming the DB keys is out of scope / too risky right now).
const currencyDisplayOverrides: Record<string, { label: string; helper: string }> = {
  currency: {
    label: "Platform Currency",
    helper: "The base currency all tours, bookings and financial calculations are stored in.",
  },
  default_currency: {
    label: "Default Display Currency",
    helper: "The currency shown to visitors by default before any auto-detection or manual override.",
  },
  force_site_currency: {
    label: "Auto-detect visitor currency",
    helper: "",
  },
};

const commissionSettingKeys: { key: string; label: string; description: string }[] = [
  { key: "supplier_commission_percentage", label: "Tourvaa Tour Commission (Minimum)", description: "Tourvaa's own platform commission on every tour booking, deducted from the supplier's price. This is the floor - suppliers may agree to a higher rate, but it can never go lower." },
];
const commissionSettingKeySet = new Set(commissionSettingKeys.map((c) => c.key));

// Agent-only settings, all grouped together under the dedicated "Agent
// Settings" tab instead of being split between Pricing & Commission (the
// percentage fields) and the generic "affiliate"/other group loop.
const agentPercentageKeys: { key: string; label: string; description: string }[] = [
  { key: "agent_default_commission_percentage", label: "Default Agent Commission", description: "The commission percentage shown to a new agent and asked to be accepted right after they log in for the first time." },
  { key: "agent_commission_max_percentage", label: "Maximum Agent Commission", description: "The ceiling on what Tourvaa pays an agent per booking. Agent commission requests above this are rejected." },
];
const agentBooleanKeys: { key: string; label: string; description: string }[] = [
  { key: "allow_agent_markup", label: "Allow Agent Markup", description: "Whether agents are permitted to add their own markup on top of the supplier price when booking on behalf of a customer." },
  { key: "allow_agent_and_affiliate_commission_same_booking", label: "Allow Agent + Affiliate Commission on Same Booking", description: "Whether both an agent's and an affiliate's commission can be paid out on the same booking, or whether only one applies." },
];
const agentSettingKeySet = new Set([...agentPercentageKeys.map((c) => c.key), ...agentBooleanKeys.map((c) => c.key)]);

// Affiliate-only settings, all grouped together under the dedicated
// "Affiliate Settings" tab instead of being split between Pricing &
// Commission and the generic "affiliate" group loop.
const affiliatePercentageKeys: { key: string; label: string; description: string }[] = [
  { key: "affiliate_default_commission_value", label: "Default Affiliate Commission", description: "The commission percentage shown to a new affiliate and asked to be accepted right after they log in for the first time." },
  { key: "affiliate_commission_max_percentage", label: "Maximum Affiliate Commission", description: "The ceiling on what Tourvaa pays an affiliate per booking, whether set as their base rate or in a commission rule." },
];
const affiliateNumberKeys: { key: string; label: string; description: string; suffix: string }[] = [
  { key: "affiliate_default_attribution_window_days", label: "Default Attribution Window", description: "How many days after a click an affiliate link stays credited for a resulting booking, when the link itself doesn't override this.", suffix: "days" },
  { key: "affiliate_minimum_payout", label: "Minimum Affiliate Payout", description: "The minimum accrued commission balance an affiliate must reach before a payout can be processed.", suffix: "" },
];
const affiliateSelectKeys: { key: string; label: string; description: string; options: { value: string; label: string }[] }[] = [
  {
    key: "affiliate_default_commission_type",
    label: "Default Affiliate Commission Type",
    description: "Whether a new affiliate's default commission is expressed as a percentage of the booking or a fixed amount.",
    options: [
      { value: "percentage", label: "Percentage" },
      { value: "fixed", label: "Fixed Amount" },
    ],
  },
  {
    key: "affiliate_default_attribution_model",
    label: "Default Attribution Model",
    description: "Which click gets credit for a booking when a customer follows more than one affiliate link before booking, when the link itself doesn't override this.",
    options: [
      { value: "last_click", label: "Last Click" },
      { value: "first_click", label: "First Click" },
    ],
  },
];
const affiliateBooleanKeys: { key: string; label: string; description: string }[] = [
  { key: "affiliate_allow_self_link_creation", label: "Allow Affiliate Self-Service Link Creation", description: "Whether affiliates can create their own tracking links directly, without an admin creating one for them." },
  { key: "affiliate_allow_custom_alias", label: "Allow Custom Alias", description: "Whether affiliates can choose a custom alias/slug for their tracking links instead of only an auto-generated one." },
  { key: "affiliate_auto_approve_commission", label: "Auto-Approve Affiliate Commission", description: "Whether affiliate commission on a completed booking is approved automatically, or requires manual admin review first." },
];
const affiliateSettingKeySet = new Set([
  ...affiliatePercentageKeys.map((c) => c.key),
  ...affiliateNumberKeys.map((c) => c.key),
  ...affiliateSelectKeys.map((c) => c.key),
  ...affiliateBooleanKeys.map((c) => c.key),
]);

const depositSettingKeys: { key: string; label: string; description: string; suffix: string; max?: number }[] = [
  { key: "default_deposit_percentage", label: "Default Deposit Percentage", description: "Used only when a tour's own deposit settings (in the tour editor) are left blank. A supplier's per-tour deposit configuration always takes priority over this platform default.", suffix: "%", max: 100 },
  { key: "default_deposit_cutoff_days", label: "Default Deposit Cutoff", description: "How many days before departure a deposit is still offered, when the tour itself doesn't set its own cutoff. Booking within this window requires full payment.", suffix: "days" },
  { key: "default_balance_payment_deadline_days", label: "Default Final Payment Due", description: "How many days before departure the remaining balance must be paid, when the tour itself doesn't set its own deadline.", suffix: "days" },
];
const depositSettingKeySet = new Set(depositSettingKeys.map((c) => c.key));
const setupFlagKeys = new Set([
  "company_setup_completed", "pricing_setup_completed", "booking_rules_completed", "payment_setup_completed",
  "email_setup_completed", "storage_setup_completed", "security_check_completed",
]);
// The supplier default commission % (supplier_commission_percentage) is
// managed only here, in Pricing & Commission. The old Default Commissions
// page (/admin/settings/default-commissions) now just redirects here; the
// agent/affiliate defaults live in the "Agent Settings"/"Affiliate Settings"
// tabs below (see agentSettingKeySet/affiliateSettingKeySet).

type Setting = {
  id: number;
  key: string;
  value: string | null;
  label: string;
  group: string;
  is_public: boolean;
};

type CommissionPreviewData = {
  sample_price: string;
  tourvaa_commission_percentage: string;
  direct: { supplier: string; tourvaa: string };
  agent: { supplier: string; agent_commission_percentage: string; agent: string; tourvaa: string };
  affiliate: { supplier: string; affiliate_commission_percentage: string; affiliate: string; tourvaa: string };
};

type SecurityStatus = {
  jwt_secrets: Record<string, string>;
  redis: string;
  cloudinary: string;
  settings_encryption_key: string;
};

function isConfigured(status: string) {
  return status.toLowerCase().startsWith("configured");
}

function StatusBadge({ status }: { status: string }) {
  const ok = isConfigured(status);
  return (
    <span
      title={status}
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
    >
      {ok ? "Configured" : "Missing"}
    </span>
  );
}

export default function SettingsPage() {
  const { dashboard, loading: dashboardLoading } = useDashboard();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  // /admin/settings/api and /admin/settings/payment re-export this page
  // (see their page.tsx) purely so those URLs exist as deep links -- read
  // the sub-tab straight from the path so landing on either opens the
  // matching tab instead of always defaulting to General.
  const pathname = usePathname();
  const initialGroup = pathname === "/admin/settings/api" ? "api" : pathname === "/admin/settings/payment" ? "payment" : "general";
  const [activeGroup, setActiveGroup] = useState(initialGroup);
  // Deep link to a tab with a hash, e.g. /admin/settings#pricing (used by the
  // retired /admin/settings/default-commissions page).
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && hash !== "affiliate" && groupLabels[hash]) setActiveGroup(hash);
  }, []);
  const [previewInput, setPreviewInput] = useState("120");
  const [previewPrice, setPreviewPrice] = useState("120");
  const [preview, setPreview] = useState<CommissionPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  const grouped = useMemo(() => {
    return settings
      // "default_currency" is a legacy duplicate of "currency" (Booking
      // Defaults) -- the backend keeps them mirrored automatically, so only
      // show the one currency picker to avoid a confusing second field.
      // "payment"/"api" groups are excluded here on purpose: those AppSetting
      // rows are a disconnected, unencrypted copy that the real payment
      // gateway code never reads - PaymentSettingsSection/ApiSettingsSection
      // below talk to the actual encrypted PaymentSetting/ApiSetting tables.
      // The Platform Setup *_completed flags are no longer shown: setup
      // progress is now derived from real configuration checks
      // (GET /settings/setup-progress), so toggling a flag changes nothing.
      .filter((setting) => !setupFlagKeys.has(setting.key))
      .filter((setting) => setting.key !== "default_currency" && setting.group !== "payment" && setting.group !== "api" && !commissionSettingKeySet.has(setting.key) && !agentSettingKeySet.has(setting.key) && !affiliateSettingKeySet.has(setting.key) && !depositSettingKeySet.has(setting.key))
      .reduce<Record<string, Setting[]>>((groups, setting) => {
        groups[setting.group] = groups[setting.group] || [];
        groups[setting.group].push(setting);
        return groups;
      }, {});
  }, [settings]);

  const groupEntries = useMemo(() => Object.entries(grouped), [grouped]);
  // Pricing/Booking Rules/Payment/API/SMTP/Security tabs are always shown
  // (backed by their own hardcoded sections below, not the generic grouped
  // AppSetting list), appended after whatever general/system groups the
  // backend returns.
  const tabKeys = useMemo(() => [...groupEntries.map(([group]) => group), "pricing", "booking_rules", "agent", "payment", "api", "smtp", "currency", "security"], [groupEntries]);

  const fetchPreview = useCallback(async (price: string) => {
    setPreviewLoading(true);
    try {
      const response = await api.get("/settings/pricing/commission-preview", { params: { sample_price: price } });
      setPreview(response.data?.data ?? null);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeGroup === "pricing") {
      void fetchPreview(previewPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup, previewPrice]);

  useEffect(() => {
    if (activeGroup !== "security" || securityStatus || securityLoading) return;
    setSecurityLoading(true);
    api
      .get("/settings/security-status")
      .then((response) => setSecurityStatus(response.data?.data ?? null))
      .finally(() => setSecurityLoading(false));
  }, [activeGroup, securityStatus, securityLoading]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/settings/");
      const items: Setting[] = response.data.data || [];
      setSettings(items);
      setForm(
        items.reduce<Record<string, string>>((values, item) => {
          values[item.key] = item.key === "timezone"
            ? normalizeTimezone(item.value || "")
            : item.value || "";
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

        {activeGroup === "pricing" && (
          <>
            <form onSubmit={saveSettings}>
              <section className="rounded-2xl border border-dash-border bg-white p-6">
                <h3 className="mb-1 text-lg font-bold text-dash-text">Commission Settings</h3>
                <p className="mb-5 text-sm text-dash-muted">
                  Set Tourvaa&apos;s own platform commission floor. Agent and Affiliate commission settings now live under their own dedicated tabs.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {commissionSettingKeys.map(({ key, label, description }) => (
                    <label key={key} className="block rounded-xl border border-dash-border bg-dash-bg p-4">
                      <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={form[key] ?? ""}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-dash-border bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-dash-brand"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-dash-muted">%</span>
                      </div>
                      <p className="mt-2 text-xs text-dash-subtle">{description}</p>
                    </label>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    disabled={saving}
                    className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Commission Settings"}
                  </button>
                </div>
              </section>
            </form>

            <section className="mt-6 rounded-2xl border border-dash-border bg-white p-4">
              <h3 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-dash-muted">
                Related Settings
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href="/admin/affiliates/commission-rules"
                  className="group flex items-center gap-3 rounded-xl border border-dash-border bg-dash-bg p-3.5 transition hover:border-dash-brand hover:bg-white"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-dash-brand shadow-2xs">
                    <SlidersHorizontal size={18} />
                  </span>
                  <span className="flex-1 text-sm font-bold text-dash-text">
                    Commission Rules
                  </span>
                  <ArrowRight size={16} className="text-dash-muted transition group-hover:translate-x-0.5 group-hover:text-dash-brand" />
                </Link>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-dash-border bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-dash-text">Commission Preview</h3>
              <p className="mb-5 text-sm text-dash-muted">
                Enter a sample tour price to see how it splits across supplier, Tourvaa, agent and affiliate under the settings above.
              </p>
              <label className="mb-5 block max-w-xs">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Example Price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={previewInput}
                  onChange={(event) => setPreviewInput(event.target.value)}
                  onBlur={() => previewInput && setPreviewPrice(previewInput)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (previewInput) setPreviewPrice(previewInput);
                    }
                  }}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                />
              </label>

              {previewLoading && !preview ? (
                <p className="text-sm text-dash-muted">Loading preview...</p>
              ) : preview ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-dash-border bg-dash-bg p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-dash-muted">Direct</p>
                    <p className="text-sm text-dash-text">Supplier <span className="font-bold">{preview.direct.supplier}</span></p>
                    <p className="text-sm text-dash-text">Tourvaa <span className="font-bold">{preview.direct.tourvaa}</span></p>
                  </div>
                  <div className="rounded-xl border border-dash-border bg-dash-bg p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-dash-muted">Agent</p>
                    <p className="text-sm text-dash-text">Supplier <span className="font-bold">{preview.agent.supplier}</span></p>
                    <p className="text-sm text-dash-text">Agent <span className="font-bold">{preview.agent.agent}</span></p>
                    <p className="text-sm text-dash-text">Tourvaa <span className="font-bold">{preview.agent.tourvaa}</span></p>
                  </div>
                  <div className="rounded-xl border border-dash-border bg-dash-bg p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-dash-muted">Affiliate</p>
                    <p className="text-sm text-dash-text">Supplier <span className="font-bold">{preview.affiliate.supplier}</span></p>
                    <p className="text-sm text-dash-text">Affiliate <span className="font-bold">{preview.affiliate.affiliate}</span></p>
                    <p className="text-sm text-dash-text">Tourvaa <span className="font-bold">{preview.affiliate.tourvaa}</span></p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-dash-muted">Could not load a preview.</p>
              )}
            </section>
          </>
        )}

        {activeGroup === "agent" && (
          <form onSubmit={saveSettings}>
            <section className="rounded-2xl border border-dash-border bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-dash-text">Agent Settings</h3>
              <p className="mb-5 text-sm text-dash-muted">
                All commission and markup settings that apply to the Agent portal.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {agentPercentageKeys.map(({ key, label, description }) => (
                  <label key={key} className="block rounded-xl border border-dash-border bg-dash-bg p-4">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={form[key] ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-dash-border bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-dash-brand"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-dash-muted">%</span>
                    </div>
                    <p className="mt-2 text-xs text-dash-subtle">{description}</p>
                  </label>
                ))}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {agentBooleanKeys.map(({ key, label, description }) => (
                  <label key={key} className="block rounded-xl border border-dash-border bg-dash-bg p-4">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
                    <select
                      value={form[key] || "false"}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                    <p className="mt-2 text-xs text-dash-subtle">{description}</p>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={saving}
                  className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Agent Settings"}
                </button>
              </div>
            </section>
          </form>
        )}

        {activeGroup === "affiliate" && (
          <form onSubmit={saveSettings}>
            <section className="rounded-2xl border border-dash-border bg-white p-6">
              <h3 className="mb-1 text-lg font-bold text-dash-text">Affiliate Settings</h3>
              <p className="mb-5 text-sm text-dash-muted">
                All commission, attribution and self-service settings that apply to the Affiliate portal.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {affiliatePercentageKeys.map(({ key, label, description }) => (
                  <label key={key} className="block rounded-xl border border-dash-border bg-dash-bg p-4">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={form[key] ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-dash-border bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-dash-brand"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-dash-muted">%</span>
                    </div>
                    <p className="mt-2 text-xs text-dash-subtle">{description}</p>
                  </label>
                ))}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {affiliateNumberKeys.map(({ key, label, description, suffix }) => (
                  <label key={key} className="block rounded-xl border border-dash-border bg-dash-bg p-4">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={form[key] ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        className={`w-full rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm outline-none focus:border-dash-brand ${suffix ? "pr-14" : ""}`}
                      />
                      {suffix && (
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-dash-muted">{suffix}</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-dash-subtle">{description}</p>
                  </label>
                ))}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {affiliateSelectKeys.map(({ key, label, description, options }) => (
                  <label key={key} className="block rounded-xl border border-dash-border bg-dash-bg p-4">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
                    <select
                      value={form[key] || options[0].value}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                    >
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-dash-subtle">{description}</p>
                  </label>
                ))}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {affiliateBooleanKeys.map(({ key, label, description }) => (
                  <label key={key} className="block rounded-xl border border-dash-border bg-dash-bg p-4">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
                    <select
                      value={form[key] || "false"}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                    <p className="mt-2 text-xs text-dash-subtle">{description}</p>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={saving}
                  className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Affiliate Settings"}
                </button>
              </div>
            </section>
          </form>
        )}

        {activeGroup === "booking_rules" && (
          <>
            <form onSubmit={saveSettings}>
              <section className="rounded-2xl border border-dash-border bg-white p-6">
                <h3 className="mb-1 text-lg font-bold text-dash-text">Deposit Settings</h3>
                <p className="mb-5 text-sm text-dash-muted">
                  Platform-wide fallback for tours where the supplier hasn&apos;t set their own deposit terms.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {depositSettingKeys.map(({ key, label, description, suffix, max }) => (
                    <label key={key} className="block rounded-xl border border-dash-border bg-dash-bg p-4">
                      <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={max}
                          step={suffix === "%" ? "0.01" : "1"}
                          value={form[key] ?? ""}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-dash-border bg-white px-4 py-2.5 pr-14 text-sm outline-none focus:border-dash-brand"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-dash-muted">{suffix}</span>
                      </div>
                      <p className="mt-2 text-xs text-dash-subtle">{description}</p>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    disabled={saving}
                    className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Deposit Settings"}
                  </button>
                </div>
              </section>
            </form>

            <DefaultCancellationPolicySection />
          </>
        )}

        {activeGroup === "security" && (
          <section className="rounded-2xl border border-dash-border bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-dash-text">Security Status</h3>
            <p className="mb-5 text-sm text-dash-muted">
              Read-only visibility into which secrets and integrations are configured. No secret values are ever shown here.
            </p>
            {securityLoading && !securityStatus ? (
              <p className="text-sm text-dash-muted">Loading security status...</p>
            ) : securityStatus ? (
              <div className="overflow-hidden rounded-xl border border-dash-border divide-y divide-dash-border">
                {Object.entries(securityStatus.jwt_secrets).map(([portal, status]) => (
                  <div key={portal} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-bold capitalize text-dash-text">{portal} JWT Secret</span>
                    <StatusBadge status={status} />
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-dash-text">Redis</span>
                  <StatusBadge status={securityStatus.redis} />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-dash-text">Cloudinary</span>
                  <StatusBadge status={securityStatus.cloudinary} />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-dash-text">Settings Encryption Key</span>
                  <StatusBadge status={securityStatus.settings_encryption_key} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-dash-muted">Could not load security status.</p>
            )}
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
                {activeGenericGroup.map((setting) => {
                  const override = currencyDisplayOverrides[setting.key];
                  const displayLabel = override?.label || setting.label;
                  return (
                  <div key={setting.key} className="block">
                    {!imageSettingKeys.has(setting.key) && (
                      <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                        {displayLabel}
                      </span>
                    )}
                    {readOnlySystemKeys.has(setting.key) ? (
                      <>
                        <input
                          value={form[setting.key] || ""}
                          disabled
                          readOnly
                          title="Fixed system value - not configurable."
                          className="w-full cursor-not-allowed rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-muted outline-none"
                        />
                        <p className="mt-2 text-xs text-dash-subtle">
                          Fixed system value — money is always rounded to 2 decimal places using standard rounding. Not configurable.
                        </p>
                      </>
                    ) : imageSettingKeys.has(setting.key) ? (
                      <AdminAssetUpload
                        label={setting.label}
                        value={form[setting.key] || ""}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            [setting.key]: value,
                          }))
                        }
                      />
                    ) : setting.key === "force_site_currency" ? (
                      <>
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
                          <option value="false">Auto-detect ON</option>
                          <option value="true">Auto-detect OFF (currency locked)</option>
                        </select>
                        <p className="mt-2 text-xs text-dash-subtle">
                          Auto-detect ON lets each visitor&apos;s currency be detected automatically. Auto-detect OFF locks the same currency for every visitor.
                        </p>
                      </>
                    ) : booleanSettingKeys.has(setting.key) ? (
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
                    ) : setting.key === "timezone" ? (
                      <TimezoneSelect
                        value={form[setting.key] || "Pacific/Auckland"}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, [setting.key]: value }))
                        }
                      />
                    ) : setting.key === "currency" ? (
                      <>
                        <CurrencySelect
                          value={form[setting.key] || "USD"}
                          onChange={(code) =>
                            setForm((current) => ({
                              ...current,
                              [setting.key]: code,
                            }))
                          }
                        />
                        {override?.helper && (
                          <p className="mt-2 text-xs text-dash-subtle">{override.helper}</p>
                        )}
                      </>
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
                    {override?.helper && setting.key !== "currency" && setting.key !== "force_site_currency" && (
                      <p className="mt-2 text-xs text-dash-subtle">{override.helper}</p>
                    )}
                  </div>
                  );
                })}
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

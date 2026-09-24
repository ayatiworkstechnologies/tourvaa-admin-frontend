"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuPencil as Pencil,
  LuPlugZap as PlugZap,
  LuRefreshCw as Refresh,
  LuSearch as Search,
} from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import api from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import { useAuthContext } from "@/providers/AuthProvider";

type Status = {
  provider_name: string;
  public_category: string;
  status: "connected" | "error" | "disabled" | "unknown";
  enabled: boolean;
  admin_enabled: boolean;
  env_enabled: boolean;
  environment: "sandbox" | "production";
  api_base_url: string;
  api_key_configured: boolean;
  api_key_masked: string;
  pid_configured: boolean;
  pid_masked: string;
  campaign_prefix: string;
  tracking_enabled: boolean;
  last_connection_message: string | null;
  last_connection_at: string | null;
  last_destination_sync_at: string | null;
  last_destination_sync_status: string | null;
  destination_count: number;
  destinations_linked_to_tourvaa: number;
  destination_mapping: "configured" | "missing";
  clicks_last_30_days: number;
  settings: Record<SettingKey, boolean> & { show_in_search?: boolean };
};

type SettingKey = "show_on_homepage" | "show_on_destination_pages" | "show_on_itinerary";

type Mapping = {
  id: number;
  slug: string;
  name: string;
  type: string | null;
  provider_destination_id: string;
  parent_name: string | null;
  tourvaa_country_id: number | null;
  tourvaa_country_name: string | null;
  tourvaa_city_id: number | null;
  tourvaa_city_name: string | null;
  mapping_source: "auto" | "manual" | null;
  is_active: boolean;
};

type ClickSummary = {
  total: number;
  logged_in: number;
  agents: number;
  by_source: { key: string | null; clicks: number }[];
  by_destination: { key: string | null; name: string | null; clicks: number }[];
  top_products: { product_code: string; title: string | null; clicks: number }[];
};

const SETTINGS: { key: SettingKey; label: string; hint: string }[] = [
  { key: "show_on_homepage", label: "Homepage search", hint: "Adds a \"Viator Day Tours & Experiences\" option to the homepage search duration list (Tourvaa's own Day Tours stay separate)." },
  { key: "show_on_destination_pages", label: "Destination pages", hint: "\"Things to do in …\" section after Tourvaa's own tours on country pages." },
  { key: "show_on_itinerary", label: "Free itinerary days", hint: "Suggestions on itinerary days marked \"Free day\" in the tour editor." },
];

const BASE = "/integrations/external-tours/viator";

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

function StatusBadge({ status }: { status: Status["status"] }) {
  const map = {
    connected: ["Connected", "bg-emerald-50 text-emerald-700"],
    error: ["Error", "bg-red-50 text-red-700"],
    disabled: ["Disabled", "bg-slate-100 text-slate-600"],
    unknown: ["Not tested", "bg-amber-50 text-amber-700"],
  } as const;
  const [label, cls] = map[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dash-border bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-dash-muted">{label}</p>
      <div className="mt-1 text-sm font-semibold text-dash-text">{children}</div>
    </div>
  );
}

function MappingEditor({ row, onSaved, onCancel }: { row: Mapping; onSaved: (m: Mapping) => void; onCancel: () => void }) {
  const toast = useToast();
  const [countries, setCountries] = useState<{ id: number; country_name: string }[]>([]);
  const [countryId, setCountryId] = useState<number | "">(row.tourvaa_country_id ?? "");
  const [cityQuery, setCityQuery] = useState(row.tourvaa_city_name ?? "");
  const [cityId, setCityId] = useState<number | null>(row.tourvaa_city_id);
  const [cities, setCities] = useState<{ id: number; city_name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/countries", { params: { limit: 300 } }).then((res) => setCountries(res.data.items ?? [])).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    if (!countryId || cityQuery.trim().length < 2 || cityId) {
      setCities([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get("/cities", { params: { country_id: countryId, search: cityQuery.trim(), limit: 10 } })
        .then((res) => setCities(res.data.items ?? []))
        .catch(() => setCities([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [countryId, cityQuery, cityId]);

  const save = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await api.put(`${BASE}/mappings/${row.id}`, payload);
      onSaved(res.data.data);
      toast.success("Destination mapping saved.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-xl border border-dash-brand/40 bg-sky-50/40 p-4 md:grid-cols-[1fr_1fr_auto]">
      <label className="block">
        <span className="mb-1 block text-[11px] font-bold uppercase text-dash-muted">Tourvaa country</span>
        <select
          value={countryId}
          onChange={(e) => {
            setCountryId(e.target.value ? Number(e.target.value) : "");
            setCityId(null);
            setCityQuery("");
          }}
          className="w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm"
        >
          <option value="">- Not linked -</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.country_name}</option>)}
        </select>
      </label>
      <label className="relative block">
        <span className="mb-1 block text-[11px] font-bold uppercase text-dash-muted">Tourvaa city (optional)</span>
        <input
          value={cityQuery}
          disabled={!countryId}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setCityId(null);
          }}
          placeholder={countryId ? "Type to search cities" : "Choose a country first"}
          className="w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm disabled:bg-slate-50"
        />
        {cities.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-dash-border bg-white shadow-lg">
            {cities.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => { setCityId(c.id); setCityQuery(c.city_name); setCities([]); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50">
                  {c.city_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>
      <div className="flex items-end gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save({ tourvaa_country_id: countryId || null, tourvaa_state_id: null, tourvaa_city_id: cityId })}
          className="rounded-lg bg-dash-brand px-3 py-2 text-xs font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
        >
          Save
        </button>
        <button type="button" disabled={saving} onClick={() => void save({ reset_to_auto: true })} className="rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-text hover:bg-slate-50" title="Clear and let the next sync match it automatically">
          Reset to auto
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-2 py-2 text-xs font-bold text-dash-muted hover:text-dash-text">Cancel</button>
      </div>
    </div>
  );
}

export default function ViatorIntegrationPage() {
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const canUpdate = hasPermission("settings.update") || hasPermission("update-settings");
  const [status, setStatus] = useState<Status | null>(null);
  const [clicks, setClicks] = useState<ClickSummary | null>(null);
  const [busy, setBusy] = useState<"" | "test" | "sync" | SettingKey>("");
  const [mappings, setMappings] = useState<{ items: Mapping[]; total: number; total_pages: number } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<number | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([api.get(`${BASE}/status`), api.get(`${BASE}/clicks/summary`, { params: { days: 30 } })]);
      setStatus(s.data.data);
      setClicks(c.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }, [toast]);

  const loadMappings = useCallback(async () => {
    try {
      const res = await api.get(`${BASE}/mappings`, { params: { search, status: filter, type, page, limit: 25 } });
      setMappings(res.data);
    } catch {
      setMappings({ items: [], total: 0, total_pages: 1 });
    }
  }, [search, filter, type, page]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);
  useEffect(() => {
    const t = setTimeout(() => void loadMappings(), 250);
    return () => clearTimeout(t);
  }, [loadMappings]);

  const testConnection = async () => {
    setBusy("test");
    try {
      const res = await api.post(`${BASE}/test-connection`);
      setStatus(res.data.data);
      if (res.data.data.status === "connected") toast.success("Connected to Viator.");
      else toast.error(res.data.data.last_connection_message || "Connection failed.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const syncDestinations = async () => {
    setBusy("sync");
    try {
      const res = await api.post(`${BASE}/sync-destinations`, undefined, { timeout: 120_000 });
      const r = res.data.data;
      toast.success(`Synced ${r.total.toLocaleString()} destinations (${r.created} new, ${r.linked_to_tourvaa.toLocaleString()} linked to Tourvaa).`);
      await Promise.all([loadStatus(), loadMappings()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const toggleSetting = async (key: SettingKey, value: boolean) => {
    setBusy(key);
    try {
      const res = await api.put(`${BASE}/settings`, { [key]: value });
      setStatus(res.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const toggleActive = async (row: Mapping) => {
    try {
      const res = await api.put(`${BASE}/mappings/${row.id}`, { is_active: !row.is_active });
      setMappings((m) => m && { ...m, items: m.items.map((i) => (i.id === row.id ? res.data.data : i)) });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <ModuleWrapper title="Integrations" requiredPermission={["settings.view", "view-settings"]}>
      <div className="space-y-5">
        {/* Overview */}
        <section className="rounded-xl border border-dash-border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><PlugZap size={22} /></span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-dash-text">Viator Integration</h2>
                  {status && <StatusBadge status={status.status} />}
                </div>
                <p className="mt-1 max-w-2xl text-sm text-dash-muted">
                  Viator Partner API (Basic Access). Experiences are shown as <strong>{status?.public_category || "Day Tours & Experiences"}</strong> and
                  booked on viator.com through the affiliate link. They never enter Tourvaa&apos;s tours, pricing, checkout, bookings or payouts.
                </p>
              </div>
            </div>
            {canUpdate && (
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!!busy} onClick={() => void testConnection()} className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border px-3.5 py-2 text-sm font-bold text-dash-text hover:bg-slate-50 disabled:opacity-60">
                  <PlugZap size={15} /> {busy === "test" ? "Testing…" : "Test Connection"}
                </button>
                <button type="button" disabled={!!busy} onClick={() => void syncDestinations()} className="inline-flex items-center gap-1.5 rounded-xl bg-dash-brand px-3.5 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
                  <Refresh size={15} className={busy === "sync" ? "animate-spin" : ""} /> {busy === "sync" ? "Syncing…" : "Sync Destinations"}
                </button>
              </div>
            )}
          </div>

          {status && (
            <>
              {!status.enabled && (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Viator is disabled{!status.env_enabled ? " by the VIATOR_ENABLED server setting" : !status.admin_enabled ? "" : " (no API key)"}.
                  {" "}Turn it on and set the API key and Partner ID in{" "}
                  <Link href="/admin/settings/api" className="font-bold underline">Settings → API</Link>.
                </p>
              )}
              {status.status === "error" && status.last_connection_message && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Last connection test failed: {status.last_connection_message}</p>
              )}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Fact label="Provider">{status.provider_name}</Fact>
                <Fact label="Environment">
                  <span className="capitalize">{status.environment}</span>
                  <span className="block truncate text-xs font-normal text-dash-muted">{status.api_base_url}</span>
                </Fact>
                <Fact label="API key">{status.api_key_configured ? <span className="font-mono">{status.api_key_masked}</span> : <span className="text-red-600">Not set</span>}</Fact>
                <Fact label="Partner ID (PID)">{status.pid_configured ? <span className="font-mono">{status.pid_masked}</span> : <span className="text-amber-700">Not set - clicks won&apos;t earn commission</span>}</Fact>
                <Fact label="Destination mapping">
                  <span className={status.destination_mapping === "configured" ? "text-emerald-700" : "text-amber-700"}>
                    {status.destination_mapping === "configured" ? "Configured" : "Missing - run Sync Destinations"}
                  </span>
                  <span className="block text-xs font-normal text-dash-muted">
                    {status.destinations_linked_to_tourvaa.toLocaleString()} of {status.destination_count.toLocaleString()} linked to Tourvaa
                  </span>
                </Fact>
                <Fact label="Last sync">
                  {fmtDate(status.last_destination_sync_at)}
                  {status.last_destination_sync_status === "error" && <span className="block text-xs text-red-600">Last sync failed</span>}
                </Fact>
                <Fact label="Last connection test">{fmtDate(status.last_connection_at)}</Fact>
                <Fact label="Click tracking">
                  Enabled <span className="text-xs font-normal text-dash-muted">· campaign {status.campaign_prefix}-…</span>
                </Fact>
              </div>
            </>
          )}
        </section>

        {/* Placements */}
        {status && (
          <section className="rounded-xl border border-dash-border bg-white p-5">
            <h3 className="text-base font-bold text-dash-text">Where experiences appear</h3>
            <p className="mt-1 text-sm text-dash-muted">Each placement only shows while the integration itself is enabled.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {SETTINGS.map(({ key, label, hint }) => {
                const on = status.settings[key];
                return (
                  <label key={key} className="flex items-start justify-between gap-4 rounded-xl border border-dash-border px-4 py-3">
                    <span>
                      <span className="block text-sm font-bold text-dash-text">{label}</span>
                      <span className="block text-xs text-dash-muted">{hint}</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={label}
                      disabled={!canUpdate || busy === key}
                      onClick={() => void toggleSetting(key, !on)}
                      className={`relative mt-1 inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-60 ${on ? "bg-emerald-500" : "bg-slate-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${on ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* Click analytics */}
        {clicks && (
          <section className="rounded-xl border border-dash-border bg-white p-5">
            <h3 className="text-base font-bold text-dash-text">Outbound clicks - last 30 days</h3>
            <p className="mt-1 text-sm text-dash-muted">Clicks to Viator recorded by Tourvaa. Bookings and commission are reported in your Viator Partner dashboard, not here.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Fact label="Total clicks">{clicks.total.toLocaleString()}</Fact>
              <Fact label="Signed-in visitors">{clicks.logged_in.toLocaleString()}</Fact>
              <Fact label="From agents">{clicks.agents.toLocaleString()}</Fact>
            </div>
            {clicks.total > 0 && (
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-dash-muted">By source</p>
                  <ul className="space-y-1 text-sm">
                    {clicks.by_source.map((s) => <li key={s.key ?? "none"} className="flex justify-between"><span>{s.key || "-"}</span><strong>{s.clicks}</strong></li>)}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-dash-muted">By destination</p>
                  <ul className="space-y-1 text-sm">
                    {clicks.by_destination.map((d) => <li key={d.key ?? "none"} className="flex justify-between gap-2"><span className="truncate">{d.name || d.key || "-"}</span><strong>{d.clicks}</strong></li>)}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-dash-muted">Top experiences</p>
                  <ul className="space-y-1 text-sm">
                    {clicks.top_products.map((p) => <li key={p.product_code} className="flex justify-between gap-2"><span className="truncate" title={p.title || p.product_code}>{p.title || p.product_code}</span><strong>{p.clicks}</strong></li>)}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Destination mapping */}
        <section className="rounded-xl border border-dash-border bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-dash-text">Destination mapping</h3>
              <p className="mt-1 max-w-2xl text-sm text-dash-muted">
                Viator destinations linked to Tourvaa countries and cities. Sync matches them by name automatically; edit a row to fix a wrong or missing link (manual links are never overwritten by sync).
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="relative min-w-[220px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dash-subtle" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search Viator destinations" className="w-full rounded-lg border border-dash-border py-2 pl-8 pr-3 text-sm" />
            </label>
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="rounded-lg border border-dash-border px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="linked">Linked to Tourvaa</option>
              <option value="unlinked">Not linked</option>
              <option value="manual">Manually linked</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="rounded-lg border border-dash-border px-3 py-2 text-sm">
              <option value="">All types</option>
              <option value="COUNTRY">Countries</option>
              <option value="CITY">Cities</option>
              <option value="REGION">Regions</option>
            </select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-dash-border text-[11px] uppercase tracking-wide text-dash-muted">
                  <th className="py-2 pr-3">Viator destination</th>
                  <th className="py-2 pr-3">Tourvaa country / city</th>
                  <th className="py-2 pr-3">Link</th>
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {mappings === null ? (
                  <tr><td colSpan={5} className="py-6 text-center text-dash-muted">Loading…</td></tr>
                ) : mappings.items.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-dash-muted">No destinations found{status?.destination_count ? "" : " - run Sync Destinations first"}.</td></tr>
                ) : (
                  mappings.items.flatMap((row) => [
                    <tr key={row.id} className="border-b border-slate-100 align-top">
                      <td className="py-2.5 pr-3">
                        <span className="font-semibold text-dash-text">{row.name}</span>
                        <span className="block text-xs text-dash-muted">{row.type || "-"}{row.parent_name ? ` · ${row.parent_name}` : ""} · #{row.provider_destination_id}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        {row.tourvaa_country_name ? (
                          <>
                            {row.tourvaa_country_name}
                            {row.tourvaa_city_name && <span className="block text-xs text-dash-muted">{row.tourvaa_city_name}</span>}
                          </>
                        ) : (
                          <span className="text-dash-subtle">Not linked</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        {row.mapping_source && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${row.mapping_source === "manual" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                            {row.mapping_source === "manual" ? "Manual" : "Auto"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <input type="checkbox" checked={row.is_active} disabled={!canUpdate} onChange={() => void toggleActive(row)} aria-label={`${row.name} active`} className="h-4 w-4" />
                      </td>
                      <td className="py-2.5 text-right">
                        {canUpdate && (
                          <button type="button" onClick={() => setEditing(editing === row.id ? null : row.id)} className="inline-flex items-center gap-1 rounded-lg border border-dash-border px-2.5 py-1 text-xs font-bold text-dash-text hover:bg-slate-50">
                            <Pencil size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>,
                    editing === row.id ? (
                      <tr key={`${row.id}-edit`}>
                        <td colSpan={5} className="pb-3">
                          <MappingEditor
                            row={row}
                            onCancel={() => setEditing(null)}
                            onSaved={(m) => {
                              setMappings((prev) => prev && { ...prev, items: prev.items.map((i) => (i.id === m.id ? m : i)) });
                              setEditing(null);
                              void loadStatus();
                            }}
                          />
                        </td>
                      </tr>
                    ) : null,
                  ])
                )}
              </tbody>
            </table>
          </div>
          {mappings && mappings.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-dash-muted">{mappings.total.toLocaleString()} destinations</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-dash-border px-3 py-1.5 font-bold disabled:opacity-40">Previous</button>
                <span className="text-dash-muted">Page {page} of {mappings.total_pages}</span>
                <button type="button" disabled={page >= mappings.total_pages} onClick={() => setPage(page + 1)} className="rounded-lg border border-dash-border px-3 py-1.5 font-bold disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </ModuleWrapper>
  );
}

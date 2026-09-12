"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuBookOpen as BookOpen,
  LuCalendar as Calendar,
  LuCloudRain as CloudRain,
  LuCompass as Compass,
  LuExternalLink as ExternalLink,
  LuGlobe as Globe,
  LuInfo as Info,
  LuMapPin as MapPin,
  LuPlus as Plus,
  LuRefreshCw as RefreshCw,
  LuSave as Save,
  LuSparkles as Sparkles,
  LuSun as Sun,
  LuThermometer as Thermometer,
  LuTrash2 as Trash2,
  LuUndo2 as Undo2,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { CountryDestinationInfo, PlaceToVisit, WhyVisitReason } from "@/lib/types/countryDestination";
import {
  CURATED_COUNTRY_INFOS,
  getFallbackCountryDestinationInfo,
} from "@/lib/data/countryDestinationDefaults";
import { slugifyTourSegment } from "@/lib/utils/tourUrl";

interface CountryOption {
  id: number;
  name: string;
  code: string;
}

type SubTabKey =
  | "hero"
  | "overview"
  | "why_visit"
  | "seasons"
  | "monsoon"
  | "temperature"
  | "places"
  | "travel_info";

export default function CountryDestinationInfoPanel() {
  const toast = useToast();
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountryName, setSelectedCountryName] = useState<string>("India");
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>("hero");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [info, setInfo] = useState<CountryDestinationInfo | null>(null);

  // 1. Fetch available countries from the system
  useEffect(() => {
    api
      .get("/public/countries")
      .then((res) => {
        const items = (res.data?.items || res.data || []) as any[];
        const mapped: CountryOption[] = items.map((c) => ({
          id: c.id,
          name: c.country_name || c.name || "Unknown",
          code: c.country_code || c.code || "XX",
        }));
        setCountries(mapped);

        // If India is in list, select India, else first
        if (mapped.length > 0) {
          const india = mapped.find((m) => m.name.toLowerCase() === "india");
          if (india) {
            setSelectedCountryName(india.name);
          } else {
            setSelectedCountryName(mapped[0].name);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load countries in CMS:", err);
        // Fallback country list
        setCountries([
          { id: 1, name: "India", code: "IN" },
          { id: 2, name: "New Zealand", code: "NZ" },
          { id: 3, name: "Thailand", code: "TH" },
          { id: 4, name: "United Kingdom", code: "GB" },
        ]);
        setSelectedCountryName("India");
      });
  }, []);

  // 2. Fetch or initialize the country destination info
  const loadCountryData = useCallback(async (countryName: string) => {
    if (!countryName) return;
    setLoading(true);
    const slug = slugifyTourSegment(countryName);

    try {
      const res = await api.get(`/cms/content-blocks/country_info_${slug}`);
      const blockData = res.data?.data?.data as Partial<CountryDestinationInfo> | undefined;

      if (blockData && blockData.country_name) {
        // Merge with defaults to ensure all fields exist
        const base =
          CURATED_COUNTRY_INFOS[slug] ||
          getFallbackCountryDestinationInfo(countryName, slug);
        setInfo({ ...base, ...blockData });
      } else {
        // Load default curated or generated
        const fallback =
          CURATED_COUNTRY_INFOS[slug] ||
          getFallbackCountryDestinationInfo(countryName, slug);
        setInfo(fallback);
      }
    } catch {
      // 404 block doesn't exist yet, use default
      const fallback =
        CURATED_COUNTRY_INFOS[slug] ||
        getFallbackCountryDestinationInfo(countryName, slug);
      setInfo(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCountryName) {
      void loadCountryData(selectedCountryName);
    }
  }, [selectedCountryName, loadCountryData]);

  // Save handler
  const handleSave = async () => {
    if (!info) return;
    setSaving(true);
    const slug = info.country_slug || slugifyTourSegment(info.country_name);

    try {
      const payload = {
        ...info,
        updated_at: new Date().toISOString(),
      };
      await api.put(`/cms/content-blocks/country_info_${slug}`, { data: payload });
      toast.success(`Destination Guide for ${info.country_name} published successfully!`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Failed to publish destination guide for ${info.country_name}.`);
    } finally {
      setSaving(false);
    }
  };

  // Reset to curated defaults
  const handleResetToDefaults = () => {
    if (!info) return;
    const slug = slugifyTourSegment(info.country_name);
    const fallback =
      CURATED_COUNTRY_INFOS[slug] ||
      getFallbackCountryDestinationInfo(info.country_name, slug);
    setInfo(fallback);
    toast.info(`Reset to curated default template for ${info.country_name}. Click Save to persist.`);
  };

  if (!info && loading) {
    return (
      <div className="rounded-xl border border-dash-border bg-white p-8 text-center">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-dash-brand" />
        <p className="mt-2 text-sm font-semibold text-dash-muted">Loading country destination guide...</p>
      </div>
    );
  }

  if (!info) return null;

  const currentSlug = info.country_slug || slugifyTourSegment(info.country_name);
  const liveUrl = `/destinations/${currentSlug}`;

  return (
    <div className="space-y-6">
      {/* ── Top Header & Country Picker ── */}
      <section className="rounded-xl border border-dash-border bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
              <Compass size={14} />
              <span>Country-wise Destination Information</span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-dash-text">
              Destination Guide CMS (On The Go Tours Standard)
            </h3>
            <p className="mt-1 text-xs text-dash-muted max-w-2xl">
              Dynamically manage climate matrices, monsoon advisories, best places to visit, why visit highlights, quick facts, and travel info for any country.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={liveUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text shadow-xs hover:border-dash-brand hover:text-dash-brand transition"
            >
              <span>View Public Page</span>
              <ExternalLink size={13} />
            </Link>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
              title="Reset fields to curated baseline"
            >
              <Undo2 size={13} />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0369A1] transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Destination Guide</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Country Selector Dropdown Strip */}
        <div className="mt-5 pt-4 border-t border-dash-border flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-dash-muted">
            Select Country to Manage:
          </label>
          <div className="relative max-w-xs w-full">
            <select
              value={selectedCountryName}
              onChange={(e) => setSelectedCountryName(e.target.value)}
              className="w-full rounded-xl border border-dash-border bg-dash-bg/50 px-3.5 py-2.5 text-sm font-bold text-dash-text outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-dash-muted font-medium">
            Slug: <code className="bg-dash-bg px-1.5 py-0.5 rounded text-[11px] font-bold">{currentSlug}</code>
          </span>
        </div>
      </section>

      {/* ── Sub-Tabs Navigation for the 8 Pillars ── */}
      <section className="rounded-xl border border-dash-border bg-white p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubTab("hero")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === "hero"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-dash-bg/60 text-dash-text hover:bg-dash-bg"
            }`}
          >
            <Compass size={14} />
            <span>1. Hero & Quick Facts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("overview")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-dash-bg/60 text-dash-text hover:bg-dash-bg"
            }`}
          >
            <Info size={14} />
            <span>2. Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("why_visit")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === "why_visit"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-dash-bg/60 text-dash-text hover:bg-dash-bg"
            }`}
          >
            <Sparkles size={14} />
            <span>3. Why Visit ({info.why_visit.reasons?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("seasons")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === "seasons"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-dash-bg/60 text-dash-text hover:bg-dash-bg"
            }`}
          >
            <Sun size={14} />
            <span>4. Best Time & Seasons</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("monsoon")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === "monsoon"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-dash-bg/60 text-dash-text hover:bg-dash-bg"
            }`}
          >
            <CloudRain size={14} />
            <span>5. Monsoon & Rain</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("temperature")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === "temperature"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-dash-bg/60 text-dash-text hover:bg-dash-bg"
            }`}
          >
            <Thermometer size={14} />
            <span>6. 12-Month Climate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("places")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === "places"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-dash-bg/60 text-dash-text hover:bg-dash-bg"
            }`}
          >
            <MapPin size={14} />
            <span>7. Best Places ({info.best_places_to_visit.places?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("travel_info")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === "travel_info"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-dash-bg/60 text-dash-text hover:bg-dash-bg"
            }`}
          >
            <BookOpen size={14} />
            <span>8. Travel Information</span>
          </button>
        </div>
      </section>

      {/* ── Sub-Tab Forms ── */}

      {/* TAB 1: HERO & QUICK FACTS */}
      {activeSubTab === "hero" && (
        <section className="rounded-xl border border-dash-border bg-white p-6 space-y-6">
          <h4 className="text-base font-bold text-dash-text border-b border-dash-border pb-3">
            Panoramic Hero & Quick Facts Snapshot
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Hero Title
              </label>
              <input
                type="text"
                value={info.hero_title}
                onChange={(e) => setInfo({ ...info, hero_title: e.target.value })}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Hero Tagline
              </label>
              <input
                type="text"
                value={info.tagline}
                onChange={(e) => setInfo({ ...info, tagline: e.target.value })}
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Hero Subtitle / Summary
              </label>
              <textarea
                rows={3}
                value={info.hero_subtitle}
                onChange={(e) => setInfo({ ...info, hero_subtitle: e.target.value })}
                className="w-full resize-none rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="sm:col-span-2">
              <AdminAssetUpload
                label="Panoramic Hero Banner Image"
                value={info.hero_image}
                onChange={(val) => setInfo({ ...info, hero_image: val })}
              />
            </div>
          </div>

          <h5 className="text-sm font-bold text-dash-text pt-4 border-t border-dash-border">
            Quick Facts Strip (Rendered at base of Hero)
          </h5>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Capital City
              </label>
              <input
                type="text"
                value={info.quick_facts.capital}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    quick_facts: { ...info.quick_facts, capital: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Currency
              </label>
              <input
                type="text"
                value={info.quick_facts.currency}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    quick_facts: { ...info.quick_facts, currency: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Official Languages
              </label>
              <input
                type="text"
                value={info.quick_facts.languages}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    quick_facts: { ...info.quick_facts, languages: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Timezone
              </label>
              <input
                type="text"
                value={info.quick_facts.timezone}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    quick_facts: { ...info.quick_facts, timezone: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Ideal Trip Duration
              </label>
              <input
                type="text"
                value={info.quick_facts.ideal_duration}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    quick_facts: { ...info.quick_facts, ideal_duration: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Electrical Plugs
              </label>
              <input
                type="text"
                value={info.quick_facts.plug_types}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    quick_facts: { ...info.quick_facts, plug_types: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Dialing Code
              </label>
              <input
                type="text"
                value={info.quick_facts.dialing_code || ""}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    quick_facts: { ...info.quick_facts, dialing_code: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Driving Side
              </label>
              <input
                type="text"
                value={info.quick_facts.driving_side || ""}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    quick_facts: { ...info.quick_facts, driving_side: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: OVERVIEW */}
      {activeSubTab === "overview" && (
        <section className="rounded-xl border border-dash-border bg-white p-6 space-y-4">
          <h4 className="text-base font-bold text-dash-text border-b border-dash-border pb-3">
            Destination Overview & Narrative
          </h4>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
              Overview Narrative (Use double newlines for separate paragraphs)
            </label>
            <textarea
              rows={12}
              value={info.overview_narrative}
              onChange={(e) => setInfo({ ...info, overview_narrative: e.target.value })}
              className="w-full rounded-xl border border-dash-border p-3 text-sm leading-relaxed outline-none focus:border-[#0284C7]"
              placeholder="Enter rich destination editorial introduction..."
            />
          </div>
        </section>
      )}

      {/* TAB 3: WHY VISIT */}
      {activeSubTab === "why_visit" && (
        <section className="rounded-xl border border-dash-border bg-white p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-dash-border pb-3">
            <h4 className="text-base font-bold text-dash-text">
              Why Visit {info.country_name} (Core Reason Pillars)
            </h4>
            <button
              type="button"
              onClick={() => {
                const newReason: WhyVisitReason = {
                  id: String(Date.now()),
                  title: "New Highlight Reason",
                  description: "Describe why travelers should experience this.",
                  badge: "Feature",
                };
                setInfo({
                  ...info,
                  why_visit: {
                    ...info.why_visit,
                    reasons: [...(info.why_visit.reasons || []), newReason],
                  },
                });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-dash-bg px-3 py-1.5 text-xs font-bold text-dash-text hover:bg-dash-border"
            >
              <Plus size={13} />
              <span>Add Reason</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Section Title
              </label>
              <input
                type="text"
                value={info.why_visit.title}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    why_visit: { ...info.why_visit, title: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Section Subtitle
              </label>
              <input
                type="text"
                value={info.why_visit.subtitle}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    why_visit: { ...info.why_visit, subtitle: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          {/* List of reason cards */}
          <div className="space-y-4">
            {info.why_visit.reasons?.map((reason, idx) => (
              <div
                key={reason.id || idx}
                className="rounded-xl border border-dash-border bg-dash-bg/30 p-4 relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    const filtered = info.why_visit.reasons.filter((_, i) => i !== idx);
                    setInfo({
                      ...info,
                      why_visit: { ...info.why_visit, reasons: filtered },
                    });
                  }}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  title="Remove reason"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-dash-muted">
                      Card Title
                    </label>
                    <input
                      type="text"
                      value={reason.title}
                      onChange={(e) => {
                        const updated = [...info.why_visit.reasons];
                        updated[idx].title = e.target.value;
                        setInfo({
                          ...info,
                          why_visit: { ...info.why_visit, reasons: updated },
                        });
                      }}
                      className="w-full rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-dash-muted">
                      Badge Pill (e.g. UNESCO, Wildlife, Cuisine)
                    </label>
                    <input
                      type="text"
                      value={reason.badge || ""}
                      onChange={(e) => {
                        const updated = [...info.why_visit.reasons];
                        updated[idx].badge = e.target.value;
                        setInfo({
                          ...info,
                          why_visit: { ...info.why_visit, reasons: updated },
                        });
                      }}
                      className="w-full rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-bold text-dash-muted">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={reason.description}
                      onChange={(e) => {
                        const updated = [...info.why_visit.reasons];
                        updated[idx].description = e.target.value;
                        setInfo({
                          ...info,
                          why_visit: { ...info.why_visit, reasons: updated },
                        });
                      }}
                      className="w-full resize-none rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: BEST TIME & SEASONS */}
      {activeSubTab === "seasons" && (
        <section className="rounded-xl border border-dash-border bg-white p-6 space-y-6">
          <h4 className="text-base font-bold text-dash-text border-b border-dash-border pb-3">
            Best Time to Visit (Peak, Shoulder & Low Seasons)
          </h4>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
              Overall Season Summary
            </label>
            <textarea
              rows={3}
              value={info.best_time_to_visit.summary}
              onChange={(e) =>
                setInfo({
                  ...info,
                  best_time_to_visit: {
                    ...info.best_time_to_visit,
                    summary: e.target.value,
                  },
                })
              }
              className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Peak Season */}
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-4 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                Peak Season
              </span>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Months</label>
                <input
                  type="text"
                  value={info.best_time_to_visit.peak_season.months}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        peak_season: {
                          ...info.best_time_to_visit.peak_season,
                          months: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Weather Note</label>
                <input
                  type="text"
                  value={info.best_time_to_visit.peak_season.weather}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        peak_season: {
                          ...info.best_time_to_visit.peak_season,
                          weather: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Description</label>
                <textarea
                  rows={4}
                  value={info.best_time_to_visit.peak_season.description}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        peak_season: {
                          ...info.best_time_to_visit.peak_season,
                          description: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full resize-none rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Shoulder Season */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-4 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-800">
                Shoulder Season
              </span>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Months</label>
                <input
                  type="text"
                  value={info.best_time_to_visit.shoulder_season.months}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        shoulder_season: {
                          ...info.best_time_to_visit.shoulder_season,
                          months: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Weather Note</label>
                <input
                  type="text"
                  value={info.best_time_to_visit.shoulder_season.weather}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        shoulder_season: {
                          ...info.best_time_to_visit.shoulder_season,
                          weather: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Description</label>
                <textarea
                  rows={4}
                  value={info.best_time_to_visit.shoulder_season.description}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        shoulder_season: {
                          ...info.best_time_to_visit.shoulder_season,
                          description: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full resize-none rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Low Season */}
            <div className="rounded-xl border border-sky-300 bg-sky-50/40 p-4 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-sky-800">
                Low / Off-Peak Season
              </span>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Months</label>
                <input
                  type="text"
                  value={info.best_time_to_visit.low_season.months}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        low_season: {
                          ...info.best_time_to_visit.low_season,
                          months: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Weather Note</label>
                <input
                  type="text"
                  value={info.best_time_to_visit.low_season.weather}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        low_season: {
                          ...info.best_time_to_visit.low_season,
                          weather: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-dash-muted">Description</label>
                <textarea
                  rows={4}
                  value={info.best_time_to_visit.low_season.description}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      best_time_to_visit: {
                        ...info.best_time_to_visit,
                        low_season: {
                          ...info.best_time_to_visit.low_season,
                          description: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full resize-none rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: MONSOON & RAIN */}
      {activeSubTab === "monsoon" && (
        <section className="rounded-xl border border-dash-border bg-white p-6 space-y-6">
          <h4 className="text-base font-bold text-dash-text border-b border-dash-border pb-3">
            Monsoon & Season Information
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Monsoon Headline
              </label>
              <input
                type="text"
                value={info.monsoon_info.headline}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    monsoon_info: { ...info.monsoon_info, headline: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Rainfall Schedule (e.g. June to September)
              </label>
              <input
                type="text"
                value={info.monsoon_info.rainfall_schedule}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    monsoon_info: {
                      ...info.monsoon_info,
                      rainfall_schedule: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Monsoon Overview Narrative
              </label>
              <textarea
                rows={4}
                value={info.monsoon_info.monsoon_overview}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    monsoon_info: {
                      ...info.monsoon_info,
                      monsoon_overview: e.target.value,
                    },
                  })
                }
                className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Extreme Weather / Cyclone / Travel Safety Note (Optional)
              </label>
              <input
                type="text"
                value={info.monsoon_info.cyclone_or_extreme_note || ""}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    monsoon_info: {
                      ...info.monsoon_info,
                      cyclone_or_extreme_note: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>
        </section>
      )}

      {/* TAB 6: 12-MONTH CLIMATE MATRIX */}
      {activeSubTab === "temperature" && (
        <section className="rounded-xl border border-dash-border bg-white p-6 space-y-6">
          <h4 className="text-base font-bold text-dash-text border-b border-dash-border pb-3">
            Temperature & 12-Month Climate Matrix
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Climate Headline
              </label>
              <input
                type="text"
                value={info.temperature_info.headline}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    temperature_info: {
                      ...info.temperature_info,
                      headline: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Climate Overview
              </label>
              <input
                type="text"
                value={info.temperature_info.climate_overview}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    temperature_info: {
                      ...info.temperature_info,
                      climate_overview: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-dash-border rounded-xl overflow-hidden">
              <thead className="bg-dash-bg font-bold text-dash-text">
                <tr>
                  <th className="p-2.5">Month</th>
                  <th className="p-2.5">Avg High (°C)</th>
                  <th className="p-2.5">Avg Low (°C)</th>
                  <th className="p-2.5">Rainy Days</th>
                  <th className="p-2.5">Rating Pill</th>
                  <th className="p-2.5">Monthly Highlight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border">
                {info.temperature_info.monthly_weather?.map((m, idx) => (
                  <tr key={m.month} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-dash-text">{m.full_month}</td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        value={m.avg_high_c}
                        onChange={(e) => {
                          const updated = [...info.temperature_info.monthly_weather];
                          const highC = Number(e.target.value);
                          updated[idx].avg_high_c = highC;
                          updated[idx].avg_high_f = Math.round((highC * 9) / 5 + 32);
                          setInfo({
                            ...info,
                            temperature_info: {
                              ...info.temperature_info,
                              monthly_weather: updated,
                            },
                          });
                        }}
                        className="w-16 rounded border border-dash-border p-1 text-center font-bold"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        value={m.avg_low_c}
                        onChange={(e) => {
                          const updated = [...info.temperature_info.monthly_weather];
                          const lowC = Number(e.target.value);
                          updated[idx].avg_low_c = lowC;
                          updated[idx].avg_low_f = Math.round((lowC * 9) / 5 + 32);
                          setInfo({
                            ...info,
                            temperature_info: {
                              ...info.temperature_info,
                              monthly_weather: updated,
                            },
                          });
                        }}
                        className="w-16 rounded border border-dash-border p-1 text-center font-bold"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        value={m.rainfall_days}
                        onChange={(e) => {
                          const updated = [...info.temperature_info.monthly_weather];
                          updated[idx].rainfall_days = Number(e.target.value);
                          setInfo({
                            ...info,
                            temperature_info: {
                              ...info.temperature_info,
                              monthly_weather: updated,
                            },
                          });
                        }}
                        className="w-16 rounded border border-dash-border p-1 text-center"
                      />
                    </td>
                    <td className="p-2.5">
                      <select
                        value={m.recommendation}
                        onChange={(e) => {
                          const updated = [...info.temperature_info.monthly_weather];
                          updated[idx].recommendation = e.target.value as any;
                          setInfo({
                            ...info,
                            temperature_info: {
                              ...info.temperature_info,
                              monthly_weather: updated,
                            },
                          });
                        }}
                        className="rounded border border-dash-border p-1 text-xs font-semibold"
                      >
                        <option value="Peak">Peak</option>
                        <option value="Good">Good</option>
                        <option value="Shoulder">Shoulder</option>
                        <option value="Monsoon / Low">Monsoon / Low</option>
                      </select>
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={m.highlight}
                        onChange={(e) => {
                          const updated = [...info.temperature_info.monthly_weather];
                          updated[idx].highlight = e.target.value;
                          setInfo({
                            ...info,
                            temperature_info: {
                              ...info.temperature_info,
                              monthly_weather: updated,
                            },
                          });
                        }}
                        className="w-full rounded border border-dash-border p-1 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 7: BEST PLACES TO VISIT */}
      {activeSubTab === "places" && (
        <section className="rounded-xl border border-dash-border bg-white p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-dash-border pb-3">
            <h4 className="text-base font-bold text-dash-text">
              Best Places to Visit in {info.country_name}
            </h4>
            <button
              type="button"
              onClick={() => {
                const newPlace: PlaceToVisit = {
                  id: String(Date.now()),
                  name: "Iconic Destination Name",
                  tag: "Cultural Capital",
                  image:
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
                  description: "Describe the wonder and sights of this location.",
                  highlights: ["Highlight 1", "Highlight 2"],
                  best_for: "Sightseeing",
                };
                setInfo({
                  ...info,
                  best_places_to_visit: {
                    ...info.best_places_to_visit,
                    places: [...(info.best_places_to_visit.places || []), newPlace],
                  },
                });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-dash-bg px-3 py-1.5 text-xs font-bold text-dash-text hover:bg-dash-border"
            >
              <Plus size={13} />
              <span>Add Place</span>
            </button>
          </div>

          <div className="space-y-6">
            {info.best_places_to_visit.places?.map((place, idx) => (
              <div
                key={place.id || idx}
                className="rounded-xl border border-dash-border bg-dash-bg/30 p-4 relative space-y-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    const filtered = info.best_places_to_visit.places.filter(
                      (_, i) => i !== idx
                    );
                    setInfo({
                      ...info,
                      best_places_to_visit: {
                        ...info.best_places_to_visit,
                        places: filtered,
                      },
                    });
                  }}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  title="Remove place"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-dash-muted">Place Name</label>
                    <input
                      type="text"
                      value={place.name}
                      onChange={(e) => {
                        const updated = [...info.best_places_to_visit.places];
                        updated[idx].name = e.target.value;
                        setInfo({
                          ...info,
                          best_places_to_visit: {
                            ...info.best_places_to_visit,
                            places: updated,
                          },
                        });
                      }}
                      className="w-full rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dash-muted">Region Tag</label>
                    <input
                      type="text"
                      value={place.tag}
                      onChange={(e) => {
                        const updated = [...info.best_places_to_visit.places];
                        updated[idx].tag = e.target.value;
                        setInfo({
                          ...info,
                          best_places_to_visit: {
                            ...info.best_places_to_visit,
                            places: updated,
                          },
                        });
                      }}
                      className="w-full rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dash-muted">Best For Pill</label>
                    <input
                      type="text"
                      value={place.best_for || ""}
                      onChange={(e) => {
                        const updated = [...info.best_places_to_visit.places];
                        updated[idx].best_for = e.target.value;
                        setInfo({
                          ...info,
                          best_places_to_visit: {
                            ...info.best_places_to_visit,
                            places: updated,
                          },
                        });
                      }}
                      className="w-full rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <AdminAssetUpload
                      label={`Photo of ${place.name}`}
                      value={place.image}
                      onChange={(val) => {
                        const updated = [...info.best_places_to_visit.places];
                        updated[idx].image = val;
                        setInfo({
                          ...info,
                          best_places_to_visit: {
                            ...info.best_places_to_visit,
                            places: updated,
                          },
                        });
                      }}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-dash-muted">Description</label>
                    <textarea
                      rows={2}
                      value={place.description}
                      onChange={(e) => {
                        const updated = [...info.best_places_to_visit.places];
                        updated[idx].description = e.target.value;
                        setInfo({
                          ...info,
                          best_places_to_visit: {
                            ...info.best_places_to_visit,
                            places: updated,
                          },
                        });
                      }}
                      className="w-full resize-none rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-dash-muted">
                      Must-See Highlights (comma-separated, e.g. Taj Mahal, Agra Fort, Mehtab Bagh)
                    </label>
                    <input
                      type="text"
                      value={place.highlights?.join(", ") || ""}
                      onChange={(e) => {
                        const updated = [...info.best_places_to_visit.places];
                        updated[idx].highlights = e.target.value
                          .split(",")
                          .map((h) => h.trim())
                          .filter(Boolean);
                        setInfo({
                          ...info,
                          best_places_to_visit: {
                            ...info.best_places_to_visit,
                            places: updated,
                          },
                        });
                      }}
                      className="w-full rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 8: TRAVEL INFORMATION */}
      {activeSubTab === "travel_info" && (
        <section className="rounded-xl border border-dash-border bg-white p-6 space-y-6">
          <h4 className="text-base font-bold text-dash-text border-b border-dash-border pb-3">
            Practical Travel Information & Advice
          </h4>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Visas & Passports Advice
              </label>
              <textarea
                rows={3}
                value={info.travel_info.visas_and_passports}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    travel_info: {
                      ...info.travel_info,
                      visas_and_passports: e.target.value,
                    },
                  })
                }
                className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Money, Currency & Tipping
              </label>
              <textarea
                rows={3}
                value={info.travel_info.money_and_tipping}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    travel_info: {
                      ...info.travel_info,
                      money_and_tipping: e.target.value,
                    },
                  })
                }
                className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Health, Vaccines & Water
              </label>
              <textarea
                rows={3}
                value={info.travel_info.health_and_vaccinations}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    travel_info: {
                      ...info.travel_info,
                      health_and_vaccinations: e.target.value,
                    },
                  })
                }
                className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Local Customs, Culture & Etiquette
              </label>
              <textarea
                rows={3}
                value={info.travel_info.local_customs_and_culture}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    travel_info: {
                      ...info.travel_info,
                      local_customs_and_culture: e.target.value,
                    },
                  })
                }
                className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Getting Around & Transport
              </label>
              <textarea
                rows={3}
                value={info.travel_info.getting_around_and_transport}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    travel_info: {
                      ...info.travel_info,
                      getting_around_and_transport: e.target.value,
                    },
                  })
                }
                className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Packing Essentials & Dress Code
              </label>
              <textarea
                rows={3}
                value={info.travel_info.packing_essentials}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    travel_info: {
                      ...info.travel_info,
                      packing_essentials: e.target.value,
                    },
                  })
                }
                className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                Emergency Numbers (Optional)
              </label>
              <input
                type="text"
                value={info.travel_info.emergency_numbers || ""}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    travel_info: {
                      ...info.travel_info,
                      emergency_numbers: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

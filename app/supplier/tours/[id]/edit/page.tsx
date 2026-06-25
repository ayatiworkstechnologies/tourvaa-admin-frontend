"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  SendHorizonal,
} from "lucide-react";
import api from "@/lib/api";
import TourOverviewTab from "@/components/tours/TourOverviewTab";
import TourItineraryTab from "@/components/tours/TourItineraryTab";
import TourItemsTab from "@/components/tours/TourItemsTab";
import TourHighlightsTab from "@/components/tours/TourHighlightsTab";
import TourGalleryTab from "@/components/tours/TourGalleryTab";
import TourPricingTab from "@/components/tours/TourPricingTab";
import TourCalendarTab from "@/components/tours/TourCalendarTab";
import TourExtensionsTab from "@/components/tours/TourExtensionsTab";
import TourSimilarTab from "@/components/tours/TourSimilarTab";
import TourDiscountsTab from "@/components/tours/TourDiscountsTab";

type Tour = {
  id: number;
  tour_code: string;
  title: string;
  subtitle?: string;
  status: string;
  short_description?: string;
  long_description?: string;
  duration_text?: string;
  start_location?: string;
  end_location?: string;
  group_size?: number;
  number_of_days?: number;
  country_id?: number;
  city_id?: number;
  category_id?: number;
  currency?: string;
  price_start_per_person?: number;
};

type SelectOption = { id: number; name: string };

const TABS = [
  "Basic Details",
  "Overview",
  "Itinerary",
  "Inclusions",
  "Highlights",
  "Gallery",
  "Pricing",
  "Calendar",
  "Optional Activities",
  "Extensions",
  "Discounts",
  "Similar Tours",
  "SEO",
];

const inputCls =
  "w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelCls = "block text-xs font-bold text-[#344054] mb-1.5";

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["active", "published"].includes(v))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["pending", "pending_approval", "submitted", "draft"].includes(v))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (["rejected", "cancelled"].includes(v))
    return "bg-red-50 text-red-600 border-red-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export default function TourEditPage() {
  const params = useParams();
  const tourId = params.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0);
  const [tour, setTour] = useState<Tour | null>(null);
  const [loadingTour, setLoadingTour] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Basic details form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [durationText, setDurationText] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [numberOfDays, setNumberOfDays] = useState("");
  const [countryId, setCountryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [cities, setCities] = useState<SelectOption[]>([]);
  const [categories, setCategories] = useState<SelectOption[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchTour = useCallback(async () => {
    setLoadingTour(true);
    setFetchError("");
    try {
      const res = await api.get(`/tours/${tourId}`);
      const data: Tour = res.data?.data ?? res.data;
      setTour(data);
      setTitle(data.title ?? "");
      setSubtitle(data.subtitle ?? "");
      setShortDescription(data.short_description ?? "");
      setLongDescription(data.long_description ?? "");
      setDurationText(data.duration_text ?? "");
      setStartLocation(data.start_location ?? "");
      setEndLocation(data.end_location ?? "");
      setGroupSize(data.group_size ? String(data.group_size) : "");
      setNumberOfDays(data.number_of_days ? String(data.number_of_days) : "");
      setCountryId(data.country_id ? String(data.country_id) : "");
      setCityId(data.city_id ? String(data.city_id) : "");
      setCategoryId(data.category_id ? String(data.category_id) : "");
    } catch {
      setFetchError("Failed to load tour. Please try again.");
    } finally {
      setLoadingTour(false);
    }
  }, [tourId]);

  useEffect(() => {
    void fetchTour();
    Promise.allSettled([
      api.get("/settings/countries"),
      api.get("/settings/cities"),
      api.get("/tours/categories"),
    ]).then(([c, ci, cat]) => {
      if (c.status === "fulfilled")
        setCountries(c.value.data?.items ?? c.value.data?.data ?? c.value.data ?? []);
      if (ci.status === "fulfilled")
        setCities(ci.value.data?.items ?? ci.value.data?.data ?? ci.value.data ?? []);
      if (cat.status === "fulfilled")
        setCategories(
          cat.value.data?.items ?? cat.value.data?.data ?? cat.value.data ?? []
        );
    });
  }, [fetchTour]);

  const filteredCities = countryId
    ? cities.filter(
        (c) =>
          (c as SelectOption & { country_id?: number }).country_id ===
          Number(countryId)
      )
    : cities;

  const handleSaveBasic = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await api.put(`/tours/${tourId}`, {
        title,
        subtitle,
        short_description: shortDescription,
        long_description: longDescription,
        duration_text: durationText,
        start_location: startLocation,
        end_location: endLocation,
        group_size: groupSize ? Number(groupSize) : undefined,
        number_of_days: numberOfDays ? Number(numberOfDays) : undefined,
        country_id: countryId ? Number(countryId) : undefined,
        city_id: cityId ? Number(cityId) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      void fetchTour();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string; message?: string } } })
          ?.response?.data?.detail ??
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Failed to save changes.";
      setSaveError(typeof msg === "string" ? msg : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      await api.post(`/tours/${tourId}/submit-for-approval`);
      setSubmitSuccess(true);
      void fetchTour();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string; message?: string } } })
          ?.response?.data?.detail ??
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Could not submit for approval.";
      setSubmitError(typeof msg === "string" ? msg : "Could not submit for approval.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTour) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-4 h-5 w-24 animate-pulse rounded bg-[#E7EAF0]" />
        <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-[#E7EAF0]" />
        <div className="h-96 animate-pulse rounded-xl border border-[#E7EAF0] bg-white" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="mt-3 font-bold text-red-700">{fetchError}</p>
          <button
            type="button"
            onClick={fetchTour}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const canSubmit =
    tour &&
    ["draft", "rejected"].includes((tour.status ?? "").toLowerCase()) &&
    !submitSuccess;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/supplier/tours"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#667085] hover:text-[#121826]"
        >
          <ArrowLeft size={15} />
          My Tours
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-[#121826] line-clamp-2">
              {tour?.title ?? "Edit Tour"}
            </h1>
            {tour?.tour_code && (
              <p className="mt-0.5 text-xs text-[#98A2B3]">{tour.tour_code}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {tour?.status && (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColors(tour.status)}`}
              >
                {tour.status}
              </span>
            )}
            {canSubmit && (
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <SendHorizonal size={15} />
                )}
                {submitting ? "Submitting…" : "Submit for Approval"}
              </button>
            )}
            {submitSuccess && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                Submitted for approval!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 rounded-xl border border-[#E7EAF0] bg-white p-1.5">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
                activeTab === i
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#667085] hover:bg-[#F5F7FA] hover:text-[#344054]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
        {/* Basic Details tab */}
        {activeTab === 0 && (
          <div>
            <h2 className="mb-5 text-base font-black text-[#121826]">
              Basic Details
            </h2>

            {saveSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} />
                Changes saved successfully!
              </div>
            )}
            {saveError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                <AlertCircle size={16} />
                {saveError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  Tour Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputCls}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Subtitle / Tagline</label>
                <input
                  className={inputCls}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Country</label>
                  <select
                    className={inputCls}
                    value={countryId}
                    onChange={(e) => {
                      setCountryId(e.target.value);
                      setCityId("");
                    }}
                  >
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <select
                    className={inputCls}
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                  >
                    <option value="">Select city</option>
                    {filteredCities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    className={inputCls}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Number of Days</label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={numberOfDays}
                    onChange={(e) => setNumberOfDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Duration Text</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 7 Days / 6 Nights"
                    value={durationText}
                    onChange={(e) => setDurationText(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Start Location</label>
                  <input
                    className={inputCls}
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>End Location</label>
                  <input
                    className={inputCls}
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Max Group Size</label>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Short Description</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Full Description</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={5}
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSaveBasic}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {activeTab === 1 && <TourOverviewTab tourId={tourId} />}
        {activeTab === 2 && <TourItineraryTab tourId={tourId} />}
        {activeTab === 3 && <TourItemsTab tourId={tourId} segment="inclusions" label="Inclusions" />}
        {activeTab === 4 && <TourHighlightsTab tourId={tourId} />}
        {activeTab === 5 && <TourGalleryTab tourId={tourId} />}
        {activeTab === 6 && <TourPricingTab tourId={tourId} />}
        {activeTab === 7 && <TourCalendarTab tourId={tourId} />}
        {activeTab === 8 && <TourItemsTab tourId={tourId} segment="exclusions" label="Optional Activities" />}
        {activeTab === 9 && <TourExtensionsTab tourId={tourId} />}
        {activeTab === 10 && <TourDiscountsTab tourId={tourId} />}
        {activeTab === 11 && <TourSimilarTab tourId={tourId} />}
        {activeTab === 12 && (
          <div className="py-12 text-center text-sm text-[#667085]">
            SEO settings are managed by the Tourvaa team. Contact support to update SEO metadata for this tour.
          </div>
        )}
      </div>
    </div>
  );
}

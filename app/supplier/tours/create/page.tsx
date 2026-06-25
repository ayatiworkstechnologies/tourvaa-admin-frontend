"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type SelectOption = { id: number; name: string };
type ApiOption = { id: number; name?: string; category_name?: string };
type PriceSlab = {
  persons_from: number;
  persons_to: number;
  price_per_person: number;
  currency: string;
};

const STEPS = [
  "Basic Details",
  "Overview",
  "Pricing",
  "Review & Submit",
];

const inputCls =
  "w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelCls = "block text-xs font-bold text-[#344054] mb-1.5";

function StepIndicator({
  current,
  steps,
}: {
  current: number;
  steps: string[];
}) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                i < current
                  ? "bg-emerald-600 text-white"
                  : i === current
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                  : "bg-[#E7EAF0] text-[#98A2B3]"
              }`}
            >
              {i < current ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <p
              className={`mt-1 hidden text-[10px] font-bold sm:block whitespace-nowrap ${
                i === current ? "text-emerald-700" : "text-[#98A2B3]"
              }`}
            >
              {s}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-1 h-0.5 flex-1 rounded ${
                i < current ? "bg-emerald-500" : "bg-[#E7EAF0]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CreateTourPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic Details
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Dropdown options
  const { countries } = useGeoCountries();
  const { states } = useGeoStates(countryId ? Number(countryId) : null);
  const { cities } = useGeoCities(stateId ? Number(stateId) : null, countryId ? Number(countryId) : null);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [numberOfDays, setNumberOfDays] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  // Step 2: Overview
  const [longDescription, setLongDescription] = useState("");
  const [durationText, setDurationText] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [groupSize, setGroupSize] = useState("");

  // Step 3: Pricing
  const [slabs, setSlabs] = useState<PriceSlab[]>([
    { persons_from: 1, persons_to: 10, price_per_person: 0, currency: "AED" },
  ]);

  useEffect(() => {
    api.get("/tours/categories").then((res) => {
      const items = (res.data?.items ?? res.data?.data ?? res.data ?? []) as ApiOption[];
      setCategories(items.map((item) => ({ id: item.id, name: String(item.category_name ?? item.name ?? item.id) })));
    }).catch(() => {});
  }, []);

  const updateSlab = (i: number, field: keyof PriceSlab, val: string | number) => {
    setSlabs((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  };

  const addSlab = () =>
    setSlabs((prev) => [
      ...prev,
      { persons_from: 1, persons_to: 20, price_per_person: 0, currency: "AED" },
    ]);

  const removeSlab = (i: number) =>
    setSlabs((prev) => prev.filter((_, idx) => idx !== i));

  const validateStep = () => {
    if (step === 0) {
      if (!title.trim()) return "Title is required.";
      if (!countryId) return "Country is required.";
      if (!numberOfDays || Number(numberOfDays) < 1)
        return "Number of days must be at least 1.";
    }
    if (step === 2) {
      if (slabs.length === 0) return "At least one price slab is required.";
      for (const s of slabs) {
        if (Number(s.price_per_person) <= 0)
          return "All price slabs must have a price > 0.";
      }
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const body = {
        title,
        subtitle,
        country_id: Number(countryId) || undefined,
        city_id: Number(cityId) || undefined,
        category_id: Number(categoryId) || undefined,
        number_of_days: Number(numberOfDays),
        short_description: shortDescription,
        long_description: longDescription,
        duration_text: durationText,
        start_location: startLocation,
        end_location: endLocation,
        group_size: groupSize ? Number(groupSize) : undefined,
        price_slabs: slabs.map((s) => ({
          ...s,
          persons_from: Number(s.persons_from),
          persons_to: Number(s.persons_to),
          price_per_person: Number(s.price_per_person),
        })),
      };
      const res = await api.post("/tours/", body);
      const newId = res.data?.data?.id ?? res.data?.id;
      if (newId) {
        router.push(`/supplier/tours/${newId}/edit`);
      } else {
        router.push("/supplier/tours");
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string; message?: string } } })
          ?.response?.data?.detail ??
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Failed to create tour. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/supplier/tours"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#667085] hover:text-[#121826]"
        >
          <ArrowLeft size={15} />
          My Tours
        </Link>
        <h1 className="mt-3 text-2xl font-black text-[#121826]">
          Create New Tour
        </h1>
        <p className="mt-1 text-sm text-[#667085]">
          Fill in the details to create your tour listing.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <StepIndicator current={step} steps={STEPS} />

        <div className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Step 0: Basic Details */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="mb-5 text-base font-black text-[#121826]">
                Basic Details
              </h2>
              <div>
                <label className={labelCls}>
                  Tour Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. Desert Safari Dubai"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Subtitle / Tagline</label>
                <input
                  className={inputCls}
                  placeholder="Short catchy subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={inputCls}
                    value={countryId}
                    onChange={(e) => {
                      setCountryId(e.target.value);
                      setStateId("");
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
                  <label className={labelCls}>State</label>
                  <select
                    className={inputCls}
                    value={stateId}
                    onChange={(e) => {
                      setStateId(e.target.value);
                      setCityId("");
                    }}
                    disabled={!countryId}
                  >
                    <option value="">{countryId ? "Select state" : "Select country first"}</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
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
                    disabled={!countryId}
                  >
                    <option value="">{countryId ? "Select city" : "Select country first"}</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div>
                  <label className={labelCls}>
                    Number of Days <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    placeholder="e.g. 7"
                    value={numberOfDays}
                    onChange={(e) => setNumberOfDays(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Short Description</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Brief summary shown in listing cards..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 1: Overview */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="mb-5 text-base font-black text-[#121826]">
                Tour Overview
              </h2>
              <div>
                <label className={labelCls}>Full Description</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={5}
                  placeholder="Detailed description of the tour experience..."
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Start Location</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Dubai Airport"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>End Location</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Dubai Airport"
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
                  placeholder="e.g. 20"
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-black text-[#121826]">
                  Pricing Slabs
                </h2>
                <button
                  type="button"
                  onClick={addSlab}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <Plus size={13} />
                  Add Slab
                </button>
              </div>
              <div className="space-y-4">
                {slabs.map((slab, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#E7EAF0] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold text-[#667085]">
                        Slab {i + 1}
                      </p>
                      {slabs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlab(i)}
                          className="rounded-lg p-1 text-red-400 hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className={labelCls}>Persons From</label>
                        <input
                          type="number"
                          min={1}
                          className={inputCls}
                          value={slab.persons_from}
                          onChange={(e) =>
                            updateSlab(i, "persons_from", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Persons To</label>
                        <input
                          type="number"
                          min={1}
                          className={inputCls}
                          value={slab.persons_to}
                          onChange={(e) =>
                            updateSlab(i, "persons_to", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Price / Person</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className={inputCls}
                          value={slab.price_per_person}
                          onChange={(e) =>
                            updateSlab(i, "price_per_person", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Currency</label>
                        <select
                          className={inputCls}
                          value={slab.currency}
                          onChange={(e) =>
                            updateSlab(i, "currency", e.target.value)
                          }
                        >
                          <option value="AED">AED</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="INR">INR</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="mb-5 text-base font-black text-[#121826]">
                Review &amp; Submit
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E7EAF0] p-4">
                  <p className="mb-3 text-xs font-bold uppercase text-[#667085]">
                    Basic Details
                  </p>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Title</span>
                      <span className="font-semibold text-[#121826]">
                        {title}
                      </span>
                    </div>
                    {subtitle && (
                      <div className="flex justify-between">
                        <span className="text-[#667085]">Subtitle</span>
                        <span className="font-semibold text-[#121826]">
                          {subtitle}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Days</span>
                      <span className="font-semibold text-[#121826]">
                        {numberOfDays}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667085]">Country</span>
                      <span className="font-semibold text-[#121826]">
                        {countries.find((c) => String(c.id) === countryId)
                          ?.name ?? countryId}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-[#E7EAF0] p-4">
                  <p className="mb-3 text-xs font-bold uppercase text-[#667085]">
                    Pricing
                  </p>
                  <div className="space-y-1">
                    {slabs.map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-[#667085]">
                          {s.persons_from}â€“{s.persons_to} persons
                        </span>
                        <span className="font-semibold text-[#121826]">
                          {s.currency} {Number(s.price_per_person).toLocaleString()} / pax
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                  After creating, you will be taken to the tour editor where you
                  can add itinerary, photos, inclusions, and more before
                  submitting for approval.
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F5F7FA]"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            ) : (
              <Link
                href="/supplier/tours"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#667085] hover:text-[#121826]"
              >
                <ArrowLeft size={15} />
                Cancel
              </Link>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Next
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {saving ? "Creating..." : "Create Tour"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


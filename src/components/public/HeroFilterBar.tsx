"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuCalendarDays as Calendar,
  LuChevronDown as ChevronDown,
  LuClock3 as Clock,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPlus as Plus,
  LuSearch as Search,
  LuUsers as Users,
  LuX as X,
} from "react-icons/lu";
import { fetchPublicCountries, PublicCountry } from "@/lib/api/publicClient";

type OpenField = "destination" | "travellers" | null;
type DurationValue = "" | "short" | "week" | "extended" | "long";

const DURATION_OPTIONS: {
  value: DurationValue;
  label: string;
  min?: number;
  max?: number;
}[] = [
  { value: "", label: "Any duration" },
  { value: "short", label: "1–3 days", min: 1, max: 3 },
  { value: "week", label: "4–7 days", min: 4, max: 7 },
  { value: "extended", label: "8–14 days", min: 8, max: 14 },
  { value: "long", label: "15+ days", min: 15 },
];

function flagEmoji(code: string) {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(...[...code.toUpperCase()].map((letter) => 127397 + letter.charCodeAt(0)));
}

function FieldButton({
  label,
  value,
  icon: Icon,
  open,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl px-3 text-left outline-none transition ${
        open ? "bg-teal-50 ring-1 ring-inset ring-teal-200" : "hover:bg-slate-50"
      } focus-visible:ring-2 focus-visible:ring-teal-600`}
    >
      <Icon size={18} className="shrink-0 text-teal-700" />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="mt-1 block truncate text-sm font-black text-slate-900">{value}</span>
      </span>
      <ChevronDown size={14} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

export default function HeroFilterBar() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const destinationSearchRef = useRef<HTMLInputElement>(null);
  const [openField, setOpenField] = useState<OpenField>(null);
  const [keyword, setKeyword] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationSearch, setDestinationSearch] = useState("");
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [duration, setDuration] = useState<DurationValue>("");
  const [travelDate, setTravelDate] = useState("");

  useEffect(() => {
    fetchPublicCountries()
      .then(setCountries)
      .catch(() => setCountries([]))
      .finally(() => setCountriesLoading(false));
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpenField(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenField(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (openField === "destination") destinationSearchRef.current?.focus();
  }, [openField]);

  const filteredCountries = useMemo(() => {
    const query = destinationSearch.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((country) => country.country_name.toLowerCase().includes(query));
  }, [countries, destinationSearch]);

  const travellerLabel = `${adults} adult${adults === 1 ? "" : "s"}${
    children ? `, ${children} child${children === 1 ? "" : "ren"}` : ""
  }`;
  const selectedDuration = DURATION_OPTIONS.find((option) => option.value === duration) || DURATION_OPTIONS[0];
  const hasSelection = Boolean(keyword || destination || duration || travelDate || adults !== 2 || children);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("search", keyword.trim());
    if (destination) params.set("country", destination);
    params.set("adults", String(adults));
    params.set("children", String(children));
    if (selectedDuration.min) params.set("min_days", String(selectedDuration.min));
    if (selectedDuration.max) params.set("max_days", String(selectedDuration.max));
    if (travelDate) params.set("travel_date", travelDate);
    router.push(`/tours?${params.toString()}`);
    setOpenField(null);
  }

  function clearAll() {
    setKeyword("");
    setDestination("");
    setDestinationSearch("");
    setAdults(2);
    setChildren(0);
    setDuration("");
    setTravelDate("");
    setOpenField(null);
  }

  return (
    <div ref={wrapperRef} className="animate-fade-up delay-500 relative z-40 mx-auto w-full max-w-6xl text-left">
      <div className="rounded-2xl border border-white/60 bg-white/95 p-3 shadow-[0_20px_55px_rgba(3,28,38,0.3)] backdrop-blur-xl sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-4 px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">Find your next journey</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">Search verified tour packages in one place</p>
          </div>
          {hasSelection && (
            <button type="button" onClick={clearAll} className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-teal-700">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        <form onSubmit={search} className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_.8fr_1fr_auto]">
          <label className="flex min-h-16 min-w-0 items-center gap-3 rounded-xl px-3 transition hover:bg-slate-50 focus-within:bg-teal-50 focus-within:ring-1 focus-within:ring-inset focus-within:ring-teal-200">
            <Search size={18} className="shrink-0 text-teal-700" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Search tours</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Beach, culture, adventure…"
                className="mt-1 block w-full bg-transparent text-sm font-black text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400"
              />
            </span>
          </label>

          <div className="relative">
            <FieldButton
              label="Destination"
              value={destination || "Anywhere"}
              icon={MapPin}
              open={openField === "destination"}
              onClick={() => setOpenField(openField === "destination" ? null : "destination")}
            />
            {openField === "destination" && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-100 p-3">
                  <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-200 focus-within:ring-teal-500">
                    <Search size={14} className="text-slate-400" />
                    <input ref={destinationSearchRef} value={destinationSearch} onChange={(event) => setDestinationSearch(event.target.value)} placeholder="Search countries" className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none" />
                  </label>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  <button type="button" onClick={() => { setDestination(""); setDestinationSearch(""); setOpenField(null); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">🌍</span> Anywhere
                  </button>
                  {countriesLoading ? (
                    <p className="px-3 py-5 text-center text-sm text-slate-400">Loading destinations…</p>
                  ) : filteredCountries.length ? (
                    filteredCountries.map((country) => (
                      <button key={country.id} type="button" onClick={() => { setDestination(country.country_name); setDestinationSearch(""); setOpenField(null); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold hover:bg-teal-50 hover:text-teal-800 ${destination === country.country_name ? "bg-teal-50 text-teal-800" : "text-slate-700"}`}>
                        <span className="text-lg">{flagEmoji(country.country_code)}</span>{country.country_name}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-5 text-center text-sm text-slate-400">No destinations found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <FieldButton
              label="Travellers"
              value={travellerLabel}
              icon={Users}
              open={openField === "travellers"}
              onClick={() => setOpenField(openField === "travellers" ? null : "travellers")}
            />
            {openField === "travellers" && (
              <div className="absolute right-0 top-full z-50 mt-2 w-full min-w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                {[
                  { label: "Adults", note: "Ages 13+", value: adults, min: 1, max: 20, setter: setAdults },
                  { label: "Children", note: "Ages 2–12", value: children, min: 0, max: 10, setter: setChildren },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
                    <div><p className="text-sm font-black text-slate-900">{item.label}</p><p className="text-[11px] text-slate-400">{item.note}</p></div>
                    <div className="flex items-center gap-3">
                      <button type="button" aria-label={`Decrease ${item.label.toLowerCase()}`} disabled={item.value <= item.min} onClick={() => item.setter(Math.max(item.min, item.value - 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30"><Minus size={14} /></button>
                      <span className="w-5 text-center text-sm font-black text-slate-900">{item.value}</span>
                      <button type="button" aria-label={`Increase ${item.label.toLowerCase()}`} disabled={item.value >= item.max} onClick={() => item.setter(Math.min(item.max, item.value + 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30"><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex min-h-16 min-w-0 items-center gap-3 rounded-xl px-3 transition hover:bg-slate-50 focus-within:bg-teal-50 focus-within:ring-1 focus-within:ring-inset focus-within:ring-teal-200">
            <Clock size={18} className="shrink-0 text-teal-700" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
              <select value={duration} onChange={(event) => setDuration(event.target.value as DurationValue)} className="mt-1 block w-full cursor-pointer bg-transparent text-sm font-black text-slate-900 outline-none">
                {DURATION_OPTIONS.map((option) => <option key={option.value || "any"} value={option.value}>{option.label}</option>)}
              </select>
            </span>
          </label>

          <label className="flex min-h-16 min-w-0 items-center gap-3 rounded-xl px-3 transition hover:bg-slate-50 focus-within:bg-teal-50 focus-within:ring-1 focus-within:ring-inset focus-within:ring-teal-200">
            <Calendar size={18} className="shrink-0 text-teal-700" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Travel date</span>
              <input type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} min={new Date().toISOString().split("T")[0]} className="mt-1 block w-full bg-transparent text-sm font-black text-slate-900 outline-none" />
            </span>
          </label>

          <div className="flex items-center p-1 sm:col-span-2 lg:col-span-1">
            <button type="submit" className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 lg:whitespace-nowrap">
              <Search size={16} /> Explore tours
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

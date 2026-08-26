"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuCalendarDays as Calendar,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuClock3 as Clock,
  LuCompass as Compass,
  LuGlobe as Globe,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPlus as Plus,
  LuSearch as Search,
  LuSparkles as Sparkles,
  LuSun as Sun,
  LuUsers as Users,
  LuX as X,
} from "react-icons/lu";
import FlagIcon from "@/components/ui/FlagIcon";

const MONTH_CODES: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

function travelDateToMonth(value: string): string {
  const match = value.match(/([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (!match) return "";
  const code = MONTH_CODES[match[1] as keyof typeof MONTH_CODES];
  return code ? `${match[2]}-${code}` : "";
}

function durationToRange(value: string): { min?: string; max?: string } {
  switch (value) {
    case "Day Tours":
      return { max: "1" };
    case "2 - 6 Days":
      return { min: "2", max: "6" };
    case "7 - 10 Days":
      return { min: "7", max: "10" };
    case "11 - 14 Days":
      return { min: "11", max: "14" };
    case "15+ Days":
      return { min: "15" };
    default:
      return {};
  }
}

type DestinationCountry = {
  country_name: string;
  country_code: string;
  count?: number;
};

const FALLBACK_COUNTRIES: DestinationCountry[] = [
  { country_name: "New Zealand", country_code: "NZ" },
  { country_name: "Australia", country_code: "AU" },
  { country_name: "United Kingdom", country_code: "GB" },
  { country_name: "India", country_code: "IN" },
  { country_name: "United Arab Emirates", country_code: "AE" },
  { country_name: "Switzerland", country_code: "CH" },
  { country_name: "Japan", country_code: "JP" },
  { country_name: "Türkiye", country_code: "TR" },
  { country_name: "Italy", country_code: "IT" },
  { country_name: "France", country_code: "FR" },
  { country_name: "Spain", country_code: "ES" },
  { country_name: "Morocco", country_code: "MA" },
];

export default function HeroFilterBar({
  countries = [],
  onPanelOpenChange,
}: {
  countries?: DestinationCountry[];
  onPanelOpenChange?: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<"destination" | "date" | "duration" | "passengers" | null>(null);
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [duration, setDuration] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(null);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    onPanelOpenChange?.(open !== null);
  }, [open, onPanelOpenChange]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("country", destination);
    const departureMonth = travelDateToMonth(travelDate);
    if (departureMonth) {
      params.set("departure_month", departureMonth);
      params.set("travel_date", departureMonth);
    }
    const { min, max } = durationToRange(duration);
    if (min) params.set("min_days", min);
    if (max) params.set("max_days", max);
    params.set("adults", String(adults));
    params.set("children", String(children));
    router.push(`/tours?${params.toString()}`);
    setOpen(null);
  };

  const fieldClass = (name: typeof open) =>
    `hero-filter-field group flex min-h-[58px] w-full items-center justify-between gap-2.5 px-4 sm:px-5 py-2.5 text-left transition rounded-xl md:rounded-none hover:bg-slate-50/80 ${
      open === name ? "is-active bg-slate-50/95" : "bg-white"
    }`;

  const displayDestination = destination || "Select country";
  const displayDate = travelDate === "Anytime" ? "Flexible / Anytime" : travelDate || "Select departure";
  const displayDuration = duration === "Any Duration" ? "Any Duration" : duration || "Choose duration";
  const displayPassengers = `${adults} Adult${adults !== 1 ? "s" : ""}${
    children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""
  }`;

  const countryList = countries.length ? countries : FALLBACK_COUNTRIES;

  return (
    <div ref={wrapperRef} className="hero-filter-enter relative z-50 mx-auto w-full max-w-[1020px] text-slate-900">
      <form
        onSubmit={submit}
        className="hero-filter-bar grid grid-cols-1 md:grid-cols-[1.15fr_1fr_1.1fr_1.15fr_auto] items-center overflow-visible rounded-2xl md:rounded-full border-[3px] border-white/95 bg-white p-1.5 shadow-[0_16px_45px_rgba(15,23,42,.22)] ring-1 ring-slate-900/5"
      >
        {/* 1. Where to? */}
        <div className="relative border-b border-slate-150 md:border-b-0 md:border-r">
          <button
            type="button"
            onClick={() => setOpen(open === "destination" ? null : "destination")}
            className={fieldClass("destination")}
            aria-expanded={open === "destination"}
          >
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#d95d2c]">
                Where to?
              </span>
              <span className={`block truncate text-xs sm:text-[13px] font-bold ${destination ? "text-slate-950" : "text-slate-700"}`}>
                {displayDestination}
              </span>
            </div>
            <ChevronDown
              size={15}
              className={`text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-700 ${
                open === "destination" ? "rotate-180 text-[#d95d2c]" : ""
              }`}
            />
          </button>
          {open === "destination" && (
            <DestinationPanel
              countries={countryList}
              selected={destination}
              onSelect={(value) => {
                setDestination(value);
                setOpen(null);
              }}
              onClear={() => setDestination("")}
            />
          )}
        </div>

        {/* 2. When? */}
        <div className="relative border-b border-slate-150 md:border-b-0 md:border-r">
          <button
            type="button"
            onClick={() => setOpen(open === "date" ? null : "date")}
            className={fieldClass("date")}
            aria-expanded={open === "date"}
          >
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#d95d2c]">
                When?
              </span>
              <span className={`block truncate text-xs sm:text-[13px] font-bold ${travelDate ? "text-slate-950" : "text-slate-700"}`}>
                {displayDate}
              </span>
            </div>
            <ChevronDown
              size={15}
              className={`text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-700 ${
                open === "date" ? "rotate-180 text-[#d95d2c]" : ""
              }`}
            />
          </button>
          {open === "date" && (
            <DatePanel
              selected={travelDate}
              onApply={(value) => {
                setTravelDate(value);
                setOpen(null);
              }}
              onClear={() => setTravelDate("")}
            />
          )}
        </div>

        {/* 3. How Many Days? */}
        <div className="relative border-b border-slate-150 md:border-b-0 md:border-r">
          <button
            type="button"
            onClick={() => setOpen(open === "duration" ? null : "duration")}
            className={fieldClass("duration")}
            aria-expanded={open === "duration"}
          >
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#d95d2c]">
                How Many Days?
              </span>
              <span className={`block truncate text-xs sm:text-[13px] font-bold ${duration ? "text-slate-950" : "text-slate-700"}`}>
                {displayDuration}
              </span>
            </div>
            <ChevronDown
              size={15}
              className={`text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-700 ${
                open === "duration" ? "rotate-180 text-[#d95d2c]" : ""
              }`}
            />
          </button>
          {open === "duration" && (
            <DurationPanel
              selected={duration}
              onSelect={(val) => {
                setDuration(val);
                setOpen(null);
              }}
              onClear={() => setDuration("")}
            />
          )}
        </div>

        {/* 4. Who's going? */}
        <div className="relative border-b border-slate-150 md:border-b-0">
          <button
            type="button"
            onClick={() => setOpen(open === "passengers" ? null : "passengers")}
            className={fieldClass("passengers")}
            aria-expanded={open === "passengers"}
          >
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#d95d2c]">
                Who&apos;s going?
              </span>
              <span className="block truncate text-xs sm:text-[13px] font-bold text-slate-950">
                {displayPassengers}
              </span>
            </div>
            <ChevronDown
              size={15}
              className={`text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-700 ${
                open === "passengers" ? "rotate-180 text-[#d95d2c]" : ""
              }`}
            />
          </button>
          {open === "passengers" && (
            <PassengerPanel
              adults={adults}
              childCount={children}
              setAdults={setAdults}
              setChildren={setChildren}
              onApply={() => setOpen(null)}
            />
          )}
        </div>

        {/* 5. Search Button */}
        <div className="p-1">
          <button
            type="submit"
            className="hero-search-button flex h-12 w-full md:w-auto min-w-[130px] items-center justify-center gap-2 rounded-xl md:rounded-full bg-[#0f2439] px-7 text-sm font-bold text-white shadow-md transition duration-200 hover:bg-[#18395c] hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            <Search size={17} className="stroke-[2.5]" />
            <span>Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}

const basePanelClass =
  "hero-filter-panel absolute top-[calc(100%+14px)] z-[100] rounded-2xl sm:rounded-3xl border border-slate-150 bg-white p-4 sm:p-5 text-left shadow-[0_24px_60px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200";

/* -------------------------------------------------------------
 * 1. UPGRADED DESTINATION PANEL
 * ------------------------------------------------------------- */
function DestinationPanel({
  countries,
  selected,
  onSelect,
  onClear,
}: {
  countries: DestinationCountry[];
  selected: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.toLowerCase();
    return countries.filter((c) => c.country_name.toLowerCase().includes(q));
  }, [countries, search]);

  return (
    <div className={`${basePanelClass} left-0 w-full min-w-[320px] sm:min-w-[360px] max-w-sm`}>
      {/* Header & Search Bar */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search country or destination..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Popular Destinations
        </span>
        {selected && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-bold text-[#d95d2c] hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Destination List */}
      <div className="max-h-72 space-y-1 overflow-y-auto overscroll-contain pr-1 no-scrollbar">
        {filtered.length > 0 ? (
          filtered.map((country) => {
            const isSelected = selected === country.country_name;
            return (
              <button
                key={country.country_code || country.country_name}
                type="button"
                onClick={() => onSelect(country.country_name)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  isSelected
                    ? "bg-[#0f2439] text-white shadow-sm"
                    : "text-slate-800 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FlagIcon
                    countryCode={country.country_code}
                    className="h-4 w-5 shrink-0 rounded-sm border border-slate-200 shadow-xs"
                  />
                  <span className="truncate">{country.country_name}</span>
                </div>
                {isSelected && <Check size={15} className="text-[#d95d2c] shrink-0" />}
              </button>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No matching destinations found.
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 2. UPGRADED DATE PANEL
 * ------------------------------------------------------------- */
function monthMeta(monthsAhead: number) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
  return {
    label: new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(first),
    shortMonth: new Intl.DateTimeFormat("en", { month: "short" }).format(first),
    year: first.getFullYear(),
    start: first.getDay(),
    days: new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
    monthsAhead,
  };
}

function DatePanel({
  selected,
  onApply,
  onClear,
}: {
  selected: string;
  onApply: (value: string) => void;
  onClear: () => void;
}) {
  const [mode, setMode] = useState<"flexible" | "specific">("flexible");
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(new Intl.DateTimeFormat("en", { month: "short" }).format(now));
  const [anytime, setAnytime] = useState(false);

  const months = [
    { short: "Jan", season: "Winter" },
    { short: "Feb", season: "Winter" },
    { short: "Mar", season: "Spring" },
    { short: "Apr", season: "Spring" },
    { short: "May", season: "Spring" },
    { short: "Jun", season: "Summer" },
    { short: "Jul", season: "Summer" },
    { short: "Aug", season: "Summer" },
    { short: "Sep", season: "Autumn" },
    { short: "Oct", season: "Autumn" },
    { short: "Nov", season: "Autumn" },
    { short: "Dec", season: "Winter" },
  ];

  return (
    <div className={`${basePanelClass} left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 min-w-[min(94vw,660px)]`}>
      {/* Switcher Tabs */}
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex rounded-xl bg-slate-100/90 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("flexible")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              mode === "flexible"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Sparkles size={13} className="text-[#d95d2c]" />
            <span>Calendar View</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("specific")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              mode === "specific"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Calendar size={13} className="text-[#d95d2c]" />
            <span>Month Picker</span>
          </button>
        </div>

        {selected && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-[#d95d2c] hover:underline"
          >
            Clear Selection
          </button>
        )}
      </div>

      {mode === "flexible" ? (
        <div>
          {/* Month Calendars View */}
          <div className="grid gap-6 sm:grid-cols-2">
            <CalendarMonth
              {...monthMeta(monthOffset)}
              selected={selected}
              onSelect={onApply}
              onPrev={() => setMonthOffset((v) => Math.max(0, v - 1))}
              onNext={() => setMonthOffset((v) => v + 1)}
              canPrev={monthOffset > 0}
            />
            <CalendarMonth
              {...monthMeta(monthOffset + 1)}
              selected={selected}
              onSelect={onApply}
              onPrev={() => setMonthOffset((v) => Math.max(0, v - 1))}
              onNext={() => setMonthOffset((v) => v + 1)}
              canPrev={false}
              showNextOnly
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <button
              type="button"
              onClick={() => onApply("Anytime")}
              className="font-bold text-[#0f2439] hover:text-[#d95d2c] transition"
            >
              I&apos;m flexible anytime →
            </button>
            <span className="text-[11px] text-slate-400">Select any departure date</span>
          </div>
        </div>
      ) : (
        /* Month & Year Selection View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Select Departure Year & Month</h4>
              <p className="text-[11px] text-slate-400">Pick when you want to travel</p>
            </div>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                aria-label="Previous year"
                onClick={() => setYear((v) => Math.max(now.getFullYear(), v - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white font-bold text-slate-600 transition"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="px-3 text-xs font-bold text-slate-900">{year}</span>
              <button
                type="button"
                aria-label="Next year"
                onClick={() => setYear((v) => v + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white font-bold text-slate-600 transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {months.map(({ short, season }) => {
              const isPicked = !anytime && month === short;
              return (
                <button
                  key={short}
                  type="button"
                  onClick={() => {
                    setMonth(short);
                    setAnytime(false);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    isPicked
                      ? "border-[#0f2439] bg-[#0f2439] text-white shadow-md"
                      : "border-slate-150 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <span className="text-xs font-black">{short}</span>
                  <span
                    className={`text-[9px] font-semibold mt-0.5 ${
                      isPicked ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    {season}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setAnytime(true);
                onApply("Anytime");
              }}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                anytime
                  ? "border-[#d95d2c] bg-[#d95d2c]/10 text-[#d95d2c]"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              Anytime / Flexible
            </button>

            <button
              type="button"
              onClick={() => onApply(anytime ? "Anytime" : `${month} ${year}`)}
              className="rounded-xl bg-[#0f2439] px-6 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#18395c]"
            >
              Apply Date
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarMonth({
  label,
  shortMonth,
  year,
  start,
  days,
  selected,
  onSelect,
  onPrev,
  onNext,
  canPrev = true,
  showNextOnly = false,
}: {
  label: string;
  shortMonth: string;
  year: number;
  start: number;
  days: number;
  selected: string;
  onSelect: (value: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  showNextOnly?: boolean;
}) {
  return (
    <div className="bg-white">
      {/* Month Header & Controls */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h5 className="text-xs font-bold text-slate-950">{label}</h5>
        <div className="flex items-center gap-1">
          {!showNextOnly && onPrev && (
            <button
              type="button"
              disabled={!canPrev}
              onClick={onPrev}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 transition ${
                canPrev ? "hover:bg-slate-100 text-slate-700" : "opacity-30 cursor-not-allowed text-slate-300"
              }`}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
        {Array.from({ length: start }).map((_, i) => (
          <span key={`blank-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const dayNum = i + 1;
          const formatted = `${String(dayNum).padStart(2, "0")} ${shortMonth} ${year}`;
          const isSelected = selected === formatted;

          return (
            <button
              type="button"
              key={formatted}
              onClick={() => onSelect(formatted)}
              className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs transition duration-150 ${
                isSelected
                  ? "bg-[#0f2439] text-white shadow-md scale-105"
                  : "text-slate-800 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 3. UPGRADED DURATION PANEL
 * ------------------------------------------------------------- */
const DURATION_PRESETS = [
  { label: "Day Tours", note: "1 Day Excursion", icon: Sun },
  { label: "2 - 6 Days", note: "Short Escapes", icon: Clock },
  { label: "7 - 10 Days", note: "Classic Holiday", icon: Compass },
  { label: "11 - 14 Days", note: "Extended Journey", icon: Calendar },
  { label: "15+ Days", note: "Grand Exploration", icon: Globe },
  { label: "Any Duration", note: "All Lengths", icon: Sparkles },
];

function DurationPanel({
  selected,
  onSelect,
  onClear,
}: {
  selected: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const [sliderVal, setSliderVal] = useState(10);

  return (
    <div className={`${basePanelClass} left-0 w-full min-w-[320px] sm:min-w-[360px] max-w-sm`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h4 className="text-xs font-bold text-slate-900">Trip Duration</h4>
          <p className="text-[11px] text-slate-400">Choose how many days you want to travel</p>
        </div>
        {selected && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-bold text-[#d95d2c] hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Duration Cards */}
      <div className="grid grid-cols-2 gap-2">
        {DURATION_PRESETS.map(({ label, note, icon: Icon }) => {
          const isSelected = selected === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                isSelected
                  ? "border-[#0f2439] bg-[#0f2439] text-white shadow-sm"
                  : "border-slate-150 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon
                  size={14}
                  className={isSelected ? "text-[#d95d2c]" : "text-slate-500"}
                />
                <span className="text-xs font-bold">{label}</span>
              </div>
              <span
                className={`text-[10px] ${
                  isSelected ? "text-white/80" : "text-slate-400"
                }`}
              >
                {note}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Slider */}
      <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
          <span>Custom Day Length</span>
          <span className="rounded-md bg-white px-2 py-0.5 shadow-xs text-[#d95d2c]">
            Up to {sliderVal} Days
          </span>
        </div>
        <input
          aria-label="Custom trip duration"
          type="range"
          min="1"
          max="30"
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          className="w-full accent-[#0f2439] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
          <span>1 Day</span>
          <span>15 Days</span>
          <span>30+ Days</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 4. UPGRADED PASSENGER PANEL
 * ------------------------------------------------------------- */
function PassengerPanel({
  adults,
  childCount,
  setAdults,
  setChildren,
  onApply,
}: {
  adults: number;
  childCount: number;
  setAdults: (value: number) => void;
  setChildren: (value: number) => void;
  onApply: () => void;
}) {
  return (
    <div className={`${basePanelClass} right-0 left-auto w-full min-w-[290px] sm:min-w-[330px] max-w-sm`}>
      <div className="mb-3 px-1">
        <h4 className="text-xs font-bold text-slate-900">Traveller Details</h4>
        <p className="text-[11px] text-slate-400">Select number of passengers</p>
      </div>

      <div className="space-y-3 divide-y divide-slate-100">
        <PassengerRow
          title="Adults"
          subtitle="Ages 12 and above"
          value={adults}
          min={1}
          max={15}
          onChange={setAdults}
        />

        <div className="pt-3">
          <PassengerRow
            title="Children"
            subtitle="Ages 3 to 11 years"
            value={childCount}
            min={0}
            max={10}
            onChange={setChildren}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onApply}
          className="w-full rounded-xl bg-[#0f2439] py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#18395c] hover:shadow-lg"
        >
          Confirm Travellers
        </button>
      </div>
    </div>
  );
}

function PassengerRow({
  title,
  subtitle,
  value,
  min,
  max,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="block text-xs font-bold text-slate-900">{title}</span>
        <span className="block text-[11px] text-slate-400">{subtitle}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Decrease ${title}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 transition ${
            value <= min
              ? "opacity-30 cursor-not-allowed text-slate-300"
              : "hover:bg-slate-100 text-slate-700 active:scale-95"
          }`}
        >
          <Minus size={13} />
        </button>

        <span className="w-6 text-center text-sm font-black text-slate-900">
          {value}
        </span>

        <button
          type="button"
          aria-label={`Increase ${title}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 transition ${
            value >= max
              ? "opacity-30 cursor-not-allowed text-slate-300"
              : "hover:bg-slate-100 text-slate-700 active:scale-95"
          }`}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}


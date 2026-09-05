"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuCalendarDays as Calendar,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuCompass as Compass,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPlus as Plus,
  LuSearch as Search,
  LuSparkles as Sparkles,
  LuSun as Sun,
  LuUsers as Users,
  LuX as X,
  LuArrowRight as ArrowRight,
} from "react-icons/lu";
import FlagIcon from "@/components/ui/FlagIcon";
import { fetchViatorRedirectUrl } from "@/lib/api/publicClient";

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
    default: {
      const customMatch = value.match(/^Up to (\d+) Days?$/);
      if (customMatch) return { max: customMatch[1] };
      return {};
    }
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
  const [showViatorRedirect, setShowViatorRedirect] = useState(false);

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
    // "Viator" is a dedicated option that hands off to our Viator
    // partnership -- separate from "Day Tours", which stays a normal filter
    // over Tourvaa's own inventory.
    if (duration === "Viator") {
      setShowViatorRedirect(true);
      return;
    }
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
  const displayDate = travelDate === "Anytime" ? "Flexible / Anytime" : travelDate || "Select date";
  const displayDuration = duration === "Any Duration" ? "Any Duration" : duration || "Choose Duration";
  const displayPassengers =
    adults === 2 && children === 1 && !destination && !travelDate && !duration
      ? "2 Adults, 1 child"
      : `${adults} Adult${adults !== 1 ? "s" : ""}${
          children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""
        }`;

  const countryList = countries.length ? countries : FALLBACK_COUNTRIES;

  return (
    <div ref={wrapperRef} className="hero-filter-enter relative z-50 mx-auto w-full max-w-[980px] text-slate-900">
      <form
        onSubmit={submit}
        className="hero-filter-bar grid grid-cols-1 md:grid-cols-[1.15fr_1fr_1.1fr_1.15fr_auto] items-center overflow-visible rounded-2xl border-[2px] border-white/95 bg-white p-1.5 shadow-[0_16px_45px_rgba(15,23,42,.22)] ring-1 ring-slate-900/5"
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
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#E4572E]">
                Where to?
              </span>
              <span className={`block truncate text-xs sm:text-[13px] font-bold ${destination ? "text-slate-950" : "text-slate-700"}`}>
                {displayDestination}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-700 ${
                open === "destination" ? "rotate-180 text-[#E4572E]" : ""
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
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#E4572E]">
                When?
              </span>
              <span className={`block truncate text-xs sm:text-[13px] font-bold ${travelDate ? "text-slate-950" : "text-slate-700"}`}>
                {displayDate}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-700 ${
                open === "date" ? "rotate-180 text-[#E4572E]" : ""
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
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#E4572E]">
                How Many Days?
              </span>
              <span className={`block truncate text-xs sm:text-[13px] font-bold ${duration ? "text-slate-950" : "text-slate-700"}`}>
                {displayDuration}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-700 ${
                open === "duration" ? "rotate-180 text-[#E4572E]" : ""
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
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#E4572E]">
                Who&apos;s going?
              </span>
              <span className="block truncate text-xs sm:text-[13px] font-bold text-slate-950">
                {displayPassengers}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 shrink-0 transition-transform duration-200 group-hover:text-slate-700 ${
                open === "passengers" ? "rotate-180 text-[#E4572E]" : ""
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
            className="hero-search-button flex h-12 w-full md:w-auto min-w-[130px] items-center justify-center gap-2 rounded-xl bg-[#0B1527] px-7 text-sm font-bold text-white shadow-md transition duration-200 hover:bg-[#15233C] hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            <Search size={16} className="stroke-[2.5]" />
            <span>Search</span>
          </button>
        </div>
      </form>

      {showViatorRedirect && (
        <ViatorRedirectModal onClose={() => setShowViatorRedirect(false)} />
      )}
    </div>
  );
}

function ViatorRedirectModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const url = await fetchViatorRedirectUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open("https://www.viator.com", "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 px-4" role="dialog" aria-modal="true" aria-label="You are being redirected">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-700"
        >
          <X size={18} />
        </button>
        <h3 className="text-lg font-black text-[#0B1527]">You are being redirected</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Click <b>Continue</b> to visit Viator.com in a new tab, our day tours partner.
        </p>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
          powered by <span className="text-[#00A698]">viator</span>
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-[#E4572E] px-6 py-3.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#cf4b25] disabled:opacity-70"
        >
          {loading ? "Redirecting..." : "Continue"}
        </button>
      </div>
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
    monthIndex: first.getMonth(),
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
            <Sparkles size={13} className="text-[#E4572E]" />
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
            <Calendar size={13} className="text-[#E4572E]" />
            <span>Month Picker</span>
          </button>
        </div>

        {selected && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-[#E4572E] hover:underline"
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
              className="inline-flex items-center gap-1 font-bold text-[#0B1527] hover:text-[#E4572E] transition"
            >
              <span>I&apos;m flexible anytime</span>
              <ArrowRight size={13} aria-hidden="true" />
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
                disabled={year <= now.getFullYear()}
                onClick={() => setYear((v) => Math.max(now.getFullYear(), v - 1))}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition font-bold ${
                  year <= now.getFullYear()
                    ? "opacity-30 cursor-not-allowed text-slate-300"
                    : "hover:bg-white text-slate-600"
                }`}
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
            {months.map(({ short, season }, mIndex) => {
              const isPicked = !anytime && month === short;
              const isPastMonth = year === now.getFullYear() && mIndex < now.getMonth();

              return (
                <button
                  key={short}
                  type="button"
                  disabled={isPastMonth}
                  onClick={() => {
                    setMonth(short);
                    setAnytime(false);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    isPastMonth
                      ? "opacity-30 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-300 pointer-events-none line-through"
                      : isPicked
                      ? "border-[#0B1527] bg-[#0B1527] text-white shadow-md"
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
                  ? "border-[#E4572E] bg-[#E4572E]/10 text-[#E4572E]"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              Anytime / Flexible
            </button>

            <button
              type="button"
              onClick={() => onApply(anytime ? "Anytime" : `${month} ${year}`)}
              className="rounded-xl bg-[#0B1527] px-6 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#15233C]"
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
  monthIndex,
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
  monthIndex: number;
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

          const cellDate = new Date(year, monthIndex, dayNum);
          cellDate.setHours(0, 0, 0, 0);
          const isPast = cellDate < today;

          return (
            <button
              type="button"
              key={formatted}
              disabled={isPast}
              onClick={() => onSelect(formatted)}
              className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs transition duration-150 ${
                isPast
                  ? "opacity-25 cursor-not-allowed text-slate-400 hover:bg-transparent pointer-events-none line-through"
                  : isSelected
                  ? "bg-[#0B1527] text-white shadow-md scale-105"
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
  { label: "Day Tours", icon: Sun },
  { label: "2 - 6 Days", icon: Calendar },
  { label: "7 - 10 Days", icon: Calendar },
  { label: "11 - 14 Days", icon: Calendar },
  { label: "15+ Days", icon: Calendar },
  { label: "Any Duration", icon: Calendar, accent: true },
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
  const [customOpen, setCustomOpen] = useState(false);
  const [sliderVal, setSliderVal] = useState(1);

  return (
    <div className={`${basePanelClass} left-0 w-full min-w-[280px] sm:min-w-[300px] max-w-xs`}>
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <h4 className="text-xs font-bold text-slate-900">Duration</h4>
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
      <div className="grid grid-cols-2 gap-1.5">
        {DURATION_PRESETS.map(({ label, icon: Icon, accent }) => {
          const isSelected = selected === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left transition ${
                isSelected
                  ? "border-[#E4572E] bg-white text-[#0f2439] shadow-sm"
                  : "border-slate-150 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
              }`}
            >
              <Icon
                size={13}
                className={isSelected || accent ? "text-[#d95d2c]" : "text-slate-400"}
              />
              <span className="text-[11px] font-bold leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Viator -- separate from Tourvaa's own tours, hands off via the
          confirmation popup rather than filtering local inventory. */}
      <button
        type="button"
        onClick={() => onSelect("Viator")}
        className={`mt-1.5 flex w-full items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left transition ${
          selected === "Viator"
            ? "border-[#00A698] bg-[#00A698]/5 text-[#0f2439] shadow-sm"
            : "border-slate-150 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
        }`}
      >
        <Compass size={13} className="text-[#00A698]" />
        <span className="text-[11px] font-bold leading-tight">Viator Day Trips</span>
        <span className="ml-auto rounded-full bg-[#00A698] px-1.5 py-[1px] text-[8px] font-black uppercase tracking-wide text-white">
          Partner
        </span>
      </button>

      {/* Custom Range (collapsible) */}
      <div className="mt-2 border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left transition hover:bg-slate-50"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
            <Calendar size={13} className="text-slate-400" /> Custom Range
          </span>
          <ChevronRight size={14} className={`text-slate-400 transition-transform ${customOpen ? "rotate-90" : ""}`} />
        </button>

        {customOpen && (
          <div className="mt-1.5 px-1 pb-1">
            <input
              aria-label="Custom trip duration"
              type="range"
              min="0"
              max="30"
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              onMouseUp={() => onSelect(`Up to ${sliderVal} Days`)}
              onTouchEnd={() => onSelect(`Up to ${sliderVal} Days`)}
              className="w-full accent-[#0f2439] cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[11px] font-bold text-slate-700">
              <span>0 days</span>
              <span>{sliderVal} day{sliderVal === 1 ? "" : "s"}</span>
            </div>
          </div>
        )}
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


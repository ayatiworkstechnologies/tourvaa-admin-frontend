"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
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
} from "react-icons/lu";

const MONTH_CODES: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

function travelDateToMonth(value: string): string {
  const match = value.match(/([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (!match) return "";
  const code = MONTH_CODES[match[1] as keyof typeof MONTH_CODES];
  return code ? `${match[2]}-${code}` : "";
}

function durationToRange(value: string): { min?: string; max?: string } {
  switch (value) {
    case "Day Tours": return { max: "1" };
    case "2 - 6 Days": return { min: "2", max: "6" };
    case "7 - 10 Days": return { min: "7", max: "10" };
    case "11 - 14 Days": return { min: "11", max: "14" };
    case "15+ Days": return { min: "15" };
    default: return {};
  }
}

type DestinationCountry = {
  country_name: string;
  country_code: string;
};

const FALLBACK_COUNTRIES: DestinationCountry[] = [
  { country_name: "India", country_code: "IN" },
  { country_name: "United Kingdom", country_code: "GB" },
  { country_name: "United Arab Emirates", country_code: "AE" },
  { country_name: "Türkiye", country_code: "TR" },
];

function countryFlag(countryCode: string) {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(...Array.from(code).map((letter) => 127397 + letter.charCodeAt(0)));
}

export default function HeroFilterBar({ countries = [], onPanelOpenChange }: { countries?: DestinationCountry[]; onPanelOpenChange?: (isOpen: boolean) => void }) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<"destination" | "date" | "duration" | "passengers" | null>(null);
  const [destination, setDestination] = useState("India");
  const [travelDate, setTravelDate] = useState("Anytime");
  const [duration, setDuration] = useState("Any Duration");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(1);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(null);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);

  // The dropdown panels below open absolutely-positioned and float over
  // whatever sits below the search bar (the trust-badge row). Report
  // open/closed so the parent can fade those badges out instead of letting
  // a panel's edge slice through the middle of a badge's text.
  useEffect(() => { onPanelOpenChange?.(open !== null); }, [open, onPanelOpenChange]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams({ country: destination });
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

  const fieldClass = (name: typeof open) => `hero-filter-field flex min-h-14 w-full items-center gap-3 px-4 text-left transition hover:bg-blue-50/70 ${open === name ? "is-active bg-blue-50" : "bg-white"}`;

  return (
    <div ref={wrapperRef} className="hero-filter-enter relative z-40 mx-auto w-full max-w-[1060px] text-slate-900">
      <form onSubmit={submit} className="hero-filter-bar grid overflow-visible rounded-xl border-4 border-white/90 bg-white shadow-[0_15px_45px_rgba(15,23,42,.28)] md:grid-cols-[1.15fr_1fr_1fr_1.15fr_1.05fr]">
        <div className="relative border-b border-slate-200 md:border-b-0 md:border-r">
          <button type="button" onClick={() => setOpen(open === "destination" ? null : "destination")} className={fieldClass("destination")} aria-expanded={open === "destination"}>
            <MapPin size={17} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[10px] text-blue-600">Destination</b><span className="block truncate text-xs text-slate-500">{destination}</span></span><ChevronDown size={12} className="text-slate-300" />
          </button>
          {open === "destination" && <DestinationPanel countries={countries.length ? countries : FALLBACK_COUNTRIES} selected={destination} onSelect={(value) => { setDestination(value); setOpen(null); }} />}
        </div>

        <div className="relative border-b border-slate-200 md:border-b-0 md:border-r">
          <button type="button" onClick={() => setOpen(open === "date" ? null : "date")} className={fieldClass("date")} aria-expanded={open === "date"}>
            <Calendar size={17} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[10px] text-blue-600">Travel date</b><span className="block truncate text-xs text-slate-500">{travelDate}</span></span><ChevronDown size={12} className="text-slate-300" />
          </button>
          {open === "date" && <DatePanel selected={travelDate} onApply={(value) => { setTravelDate(value); setOpen(null); }} />}
        </div>

        <div className="relative border-b border-slate-200 md:border-b-0 md:border-r">
          <button type="button" onClick={() => setOpen(open === "duration" ? null : "duration")} className={fieldClass("duration")} aria-expanded={open === "duration"}>
            <Clock size={17} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[10px] text-blue-600">Duration</b><span className="block truncate text-xs text-slate-500">{duration}</span></span><ChevronDown size={12} className="text-slate-300" />
          </button>
          {open === "duration" && <DurationPanel selected={duration} onSelect={setDuration} />}
        </div>

        <div className="relative border-b border-slate-200 md:border-b-0 md:border-r">
          <button type="button" onClick={() => setOpen(open === "passengers" ? null : "passengers")} className={fieldClass("passengers")} aria-expanded={open === "passengers"}>
            <Users size={17} className="shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><b className="block text-[10px] text-blue-600">Passengers</b><span className="block truncate text-xs text-slate-500">{adults} Adult{adults !== 1 ? "s" : ""}, {children} Child{children !== 1 ? "ren" : ""}</span></span><ChevronDown size={12} className="text-slate-300" />
          </button>
          {open === "passengers" && <PassengerPanel adults={adults} childCount={children} setAdults={setAdults} setChildren={setChildren} onApply={() => setOpen(null)} />}
        </div>

        <button className="hero-search-button relative m-1.5 flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#1478f2] px-8 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"><Search size={17} /> <span>Search</span></button>
      </form>
    </div>
  );
}

const panelClass = "hero-filter-panel absolute left-0 top-[calc(100%+10px)] z-50 w-full min-w-64 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-[0_18px_45px_rgba(15,23,42,.28)] md:left-0";

function DestinationPanel({ countries, selected, onSelect }: { countries: DestinationCountry[]; selected: string; onSelect: (value: string) => void }) {
  return <div className={panelClass}><p className="rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Available destinations</p><div className="mt-2 max-h-72 space-y-1 overflow-y-auto overscroll-contain pr-1">{countries.map((country) => <button key={country.country_code || country.country_name} type="button" onClick={() => onSelect(country.country_name)} className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-[11px] font-semibold transition ${selected === country.country_name ? "border-blue-400 bg-blue-50" : "border-transparent hover:bg-slate-50"}`}><span className="text-base" aria-hidden="true">{countryFlag(country.country_code)}</span>{country.country_name}</button>)}</div></div>;
}

function monthMeta(monthsAhead: number) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
  return {
    label: new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(first),
    shortMonth: new Intl.DateTimeFormat("en", { month: "short" }).format(first),
    year: first.getFullYear(),
    start: first.getDay(),
    days: new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
  };
}

function DatePanel({ selected, onApply }: { selected: string; onApply: (value: string) => void }) {
  const [mode, setMode] = useState<"flexible" | "specific">("flexible");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(new Intl.DateTimeFormat("en", { month: "short" }).format(now));
  const [anytime, setAnytime] = useState(false);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className={`${panelClass} min-w-[min(92vw,620px)] p-3 md:-left-36`}>
      <div className="mb-3 grid grid-cols-2 rounded-md bg-slate-50 p-1 text-[10px] font-semibold">
        <button type="button" onClick={() => setMode("flexible")} className={`rounded py-2 transition ${mode === "flexible" ? "bg-white text-blue-600 shadow-sm" : "hover:text-blue-600"}`}>Flexible Dates</button>
        <button type="button" onClick={() => setMode("specific")} className={`rounded py-2 transition ${mode === "specific" ? "bg-white text-blue-600 shadow-sm" : "hover:text-blue-600"}`}>Specific Date</button>
      </div>

      {mode === "flexible" ? (
        <div key="flexible" className="date-panel-content grid gap-4 sm:grid-cols-2">
          <CalendarMonth {...monthMeta(0)} selected={selected} onSelect={onApply} />
          <CalendarMonth {...monthMeta(1)} selected={selected} onSelect={onApply} />
        </div>
      ) : (
        <div key="specific" className="date-panel-content">
          <div className="mb-3 flex items-center justify-between">
            <div><p className="text-[11px] font-bold">When do you want to go?</p><p className="text-[8px] text-slate-400">Choose a month or stay flexible</p></div>
            <div className="flex items-center rounded border border-slate-200"><button type="button" aria-label="Previous year" onClick={() => setYear((value) => value - 1)} className="flex h-7 w-8 items-center justify-center hover:bg-slate-50">‹</button><span className="border-x border-slate-200 px-2 text-[10px] font-bold">{year}</span><button type="button" aria-label="Next year" onClick={() => setYear((value) => value + 1)} className="flex h-7 w-8 items-center justify-center hover:bg-slate-50">›</button></div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {months.map((item) => <button key={item} type="button" onClick={() => { setMonth(item); setAnytime(false); }} className={`rounded-md border py-2 text-center transition ${!anytime && month === item ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-300"}`}><b className="block text-[9px]">{item}</b><span className="text-[7px] text-slate-400">{year}</span></button>)}
          </div>
          <p className="mt-4 text-[11px] font-bold">I’m flexible</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setAnytime(true)} className={`rounded-md border px-8 py-2 text-[10px] font-semibold transition ${anytime ? "border-blue-500 bg-blue-50 text-blue-700" : "border-blue-300 hover:bg-blue-50"}`}>Anytime</button>
            <button type="button" onClick={() => onApply(anytime ? "Anytime" : `${month} ${year}`)} className="rounded-md bg-blue-600 px-8 py-2 text-[10px] font-bold text-white shadow-md transition hover:bg-blue-700">Select date</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarMonth({ label, shortMonth, year, start, days, selected, onSelect }: { label: string; shortMonth: string; year: number; start: number; days: number; selected: string; onSelect: (value: string) => void }) {
  return <div><div className="mb-3 flex items-center justify-between"><b className="text-xs">{label}</b><span className="flex gap-1"><button type="button" className="h-6 w-6 rounded transition hover:-translate-x-0.5 hover:bg-slate-100">‹</button><button type="button" className="h-6 w-6 rounded transition hover:translate-x-0.5 hover:bg-slate-100">›</button></span></div><div className="grid grid-cols-7 text-center text-[9px] text-slate-400">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-1">{day}</span>)}</div><div className="calendar-days grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">{Array.from({ length: start }).map((_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }).map((_, i) => { const value = `${String(i + 1).padStart(2, "0")} ${shortMonth} ${year}`; const active = selected === value; return <button type="button" key={value} onClick={() => onSelect(value)} className={`aspect-square rounded transition hover:bg-blue-100 hover:text-blue-700 ${active ? "is-selected bg-blue-600 text-white" : "text-slate-700"}`}>{String(i + 1).padStart(2, "0")}</button>; })}</div></div>;
}

function DurationPanel({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) {
  const options = ["Day Tours", "2 - 6 Days", "7 - 10 Days", "11 - 14 Days", "15+ Days", "Any Duration"];
  return <div className={`${panelClass} min-w-72`}><p className="rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Duration</p><div className="mt-2 grid grid-cols-2 gap-1">{options.map((option) => <button type="button" key={option} onClick={() => onSelect(option)} className={`flex items-center gap-2 rounded px-2 py-2.5 text-[10px] font-semibold transition ${selected === option ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}><Calendar size={12} className="text-sky-500" />{option}</button>)}</div><p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Custom Range</p><div className="px-2 py-3"><div className="flex justify-between text-[9px] font-semibold"><span>7 Days</span><span>10 Days</span></div><input aria-label="Custom duration" type="range" min="1" max="30" defaultValue="10" className="mt-2 w-full accent-blue-600" /></div></div>;
}

function PassengerPanel({ adults, childCount, setAdults, setChildren, onApply }: { adults: number; childCount: number; setAdults: (value: number) => void; setChildren: (value: number) => void; onApply: () => void }) {
  return <div className={`${panelClass} right-0 left-auto min-w-64`}><p className="rounded-md bg-slate-50 px-3 py-2 text-center text-[10px] font-semibold text-blue-600">Passengers</p><div className="space-y-4 px-2 py-4"><Counter label="Adult" note="12 years and above" value={adults} min={1} onChange={setAdults} /><Counter label="Children" note="3 - 11 years" value={childCount} min={0} onChange={setChildren} /></div><button type="button" onClick={onApply} className="w-full rounded-md bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700">Apply</button></div>;
}

function Counter({ label, note, value, min, onChange }: { label: string; note?: string; value: number; min: number; onChange: (value: number) => void }) {
  return <div className="flex items-center justify-between"><span><b className="block text-[11px]">{label}</b>{note && <small className="text-[8px] text-slate-400">{note}</small>}</span><div className="flex items-center gap-2"><button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - 1))} className="counter-motion flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100"><Minus size={11} /></button><b key={value} className="counter-value w-4 text-center text-[11px]">{String(value).padStart(2, "0")}</b><button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(20, value + 1))} className="counter-motion flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100"><Plus size={11} /></button></div></div>;
}

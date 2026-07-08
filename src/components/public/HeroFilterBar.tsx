"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuMapPin as MapPin, LuCalendar as Calendar, LuClock as Clock, LuUsers as Users,
  LuSearch as Search, LuMinus as Minus, LuPlus as Plus, LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight, LuSun as Sun,
} from "react-icons/lu";
import { fetchPublicCountries, PublicCountry } from "@/lib/api/publicClient";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type DurationValue = { label: string; min?: number; max?: number };

const DURATION_PRESETS: (DurationValue & { icon: React.ComponentType<{ size?: number; className?: string }> })[] = [
  { label: "Day Tours", icon: Sun, min: 0, max: 1 },
  { label: "2 – 6 Days", icon: Calendar, min: 2, max: 6 },
  { label: "7 – 10 Days", icon: Calendar, min: 7, max: 10 },
  { label: "11 – 14 Days", icon: Calendar, min: 11, max: 14 },
  { label: "15+ Days", icon: Calendar, min: 15, max: undefined },
  { label: "Any Duration", icon: Calendar, min: undefined, max: undefined },
];

const SLIDER_MAX = 30;

function flagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "🏳️";
  return String.fromCodePoint(...[...countryCode.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.toDateString() === b.toDateString();
}

function formatShort(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMonthGrid(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }
  return cells;
}

function FieldButton({
  active, label, sublabel, value, icon: Icon, onClick,
}: {
  active: boolean; label: string; sublabel: string; value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-1 rounded-2xl px-5 py-3 text-left transition-colors ${active ? "bg-sky-50" : "hover:bg-zinc-50"}`}
    >
      <span className="flex items-center gap-1.5 text-xs font-bold text-sky-600">
        <Icon size={13} /> {label}
      </span>
      <span className={`text-lg font-black leading-tight ${value ? "text-zinc-950" : "text-zinc-300"}`}>
        {value || `Select ${label.toLowerCase().replace("?", "")}`}
      </span>
      <span className="text-xs text-zinc-400">{sublabel}</span>
    </button>
  );
}

const sliderThumbCls =
  "pointer-events-none absolute inset-x-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:shadow-md " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-sky-500 [&::-moz-range-thumb]:shadow-md";

export default function HeroFilterBar() {
  const router = useRouter();
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [openField, setOpenField] = useState<"where" | "when" | "duration" | "who" | null>(null);
  const [country, setCountry] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // "When" field
  const [whenTab, setWhenTab] = useState<"flexible" | "specific">("flexible");
  const today = new Date();
  const [flexYear, setFlexYear] = useState(today.getFullYear());
  const [flexMonth, setFlexMonth] = useState<number | null>(null);
  const [isAnytime, setIsAnytime] = useState(false);
  const [calBaseMonth, setCalBaseMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

  // "Duration" field
  const [duration, setDuration] = useState<DurationValue | null>(null);
  const [customMin, setCustomMin] = useState(7);
  const [customMax, setCustomMax] = useState(10);

  useEffect(() => {
    fetchPublicCountries().then(setCountries).catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenField(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const whoLabel = `${adults} Adult${adults !== 1 ? "s" : ""}${children ? `, ${children} Child${children !== 1 ? "ren" : ""}` : ""}`;

  const dateLabel = isAnytime
    ? "Anytime"
    : flexMonth !== null
    ? `${MONTH_NAMES[flexMonth]} ${flexYear}`
    : rangeStart
    ? rangeEnd ? `${formatShort(rangeStart)} – ${formatShort(rangeEnd)}` : formatShort(rangeStart)
    : "";

  function selectRangeDate(d: Date) {
    if (!rangeStart || rangeEnd) {
      setRangeStart(d);
      setRangeEnd(null);
    } else if (d < rangeStart) {
      setRangeStart(d);
      setRangeEnd(null);
    } else {
      setRangeEnd(d);
    }
  }

  function applyWhenSelection() {
    setOpenField(null);
  }

  function shiftCalendar(delta: number) {
    setCalBaseMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function renderCalendar(monthDate: Date) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const cells = getMonthGrid(year, month);
    return (
      <div className="flex-1">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-heading text-sm font-black text-zinc-950">{MONTH_NAMES_FULL[month]} {year}</p>
          <div className="flex gap-1">
            <button type="button" onClick={() => shiftCalendar(-1)} aria-label="Previous month" className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-sky-400 hover:text-sky-600">
              <ChevronLeft size={13} />
            </button>
            <button type="button" onClick={() => shiftCalendar(1)} aria-label="Next month" className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-sky-400 hover:text-sky-600">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAY_NAMES.map((w) => (
            <span key={w} className="text-[10px] font-bold uppercase text-zinc-400">{w}</span>
          ))}
          {cells.map(({ date, inMonth }, i) => {
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isEdge = sameDay(date, rangeStart) || sameDay(date, rangeEnd);
            const inRange = rangeStart && date > rangeStart && (rangeEnd ? date < rangeEnd : false);
            return (
              <button
                key={i}
                type="button"
                disabled={!inMonth || isPast}
                onClick={() => selectRangeDate(date)}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  !inMonth || isPast
                    ? "text-zinc-300"
                    : isEdge
                    ? "bg-sky-500 text-white"
                    : inRange
                    ? "bg-sky-100 text-sky-700"
                    : "text-zinc-700 hover:bg-sky-50"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function handleSearch() {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (duration?.min !== undefined) params.set("min_days", String(duration.min));
    if (duration?.max !== undefined) params.set("max_days", String(duration.max));
    setOpenField(null);
    router.push(`/tours${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div ref={wrapRef} className="animate-fade-up delay-500 relative mt-10 w-full max-w-4xl rounded-3xl bg-white p-3 text-left shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:p-4">
      <div className="grid grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        <FieldButton
          active={openField === "where"} label="Where to?" sublabel="Destination" icon={MapPin}
          value={country} onClick={() => setOpenField(openField === "where" ? null : "where")}
        />
        <FieldButton
          active={openField === "when"} label="When" sublabel="Travel date" icon={Calendar}
          value={dateLabel} onClick={() => setOpenField(openField === "when" ? null : "when")}
        />
        <FieldButton
          active={openField === "duration"} label="How Many Days?" sublabel="Trip duration" icon={Clock}
          value={duration?.label ?? ""} onClick={() => setOpenField(openField === "duration" ? null : "duration")}
        />
        <FieldButton
          active={openField === "who"} label="Who's going?" sublabel="Travellers" icon={Users}
          value={whoLabel} onClick={() => setOpenField(openField === "who" ? null : "who")}
        />
      </div>

      {/* Where to? */}
      {openField === "where" && (
        <div className="absolute left-0 top-full z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl sm:w-80">
          <p className="font-heading mb-2 px-1 text-sm font-black text-zinc-950">Other popular destination</p>
          <div className="border-t border-zinc-100 pt-2">
            {countries.length === 0 ? (
              <p className="px-3 py-4 text-sm text-zinc-400">Loading destinations…</p>
            ) : (
              countries.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setCountry(c.country_name); setOpenField(null); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 hover:bg-sky-50 hover:text-sky-700"
                >
                  <span className="text-lg leading-none">{flagEmoji(c.country_code)}</span> {c.country_name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* When */}
      {openField === "when" && (
        <div className="absolute left-0 top-full z-20 mt-2 w-full max-w-2xl rounded-2xl border border-zinc-100 bg-white shadow-xl">
          <div className="grid grid-cols-2 border-b border-zinc-100">
            <button
              type="button"
              onClick={() => setWhenTab("flexible")}
              className={`py-3 text-center text-sm font-black transition-colors ${whenTab === "flexible" ? "border-b-2 border-sky-500 text-sky-600" : "text-zinc-950"}`}
            >
              Flexible Dates
            </button>
            <button
              type="button"
              onClick={() => setWhenTab("specific")}
              className={`py-3 text-center text-sm font-black transition-colors ${whenTab === "specific" ? "border-b-2 border-sky-500 text-sky-600" : "text-zinc-950"}`}
            >
              Specific Date
            </button>
          </div>

          {whenTab === "flexible" ? (
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-heading text-base font-black text-zinc-950">When do you want to go?</p>
                  <p className="text-sm text-zinc-400">{flexYear}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setFlexYear((y) => y - 1)} aria-label="Previous year" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-sky-400 hover:text-sky-600">
                    <ChevronLeft size={14} />
                  </button>
                  <button type="button" onClick={() => setFlexYear((y) => y + 1)} aria-label="Next year" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-sky-400 hover:text-sky-600">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {MONTH_NAMES.map((m, i) => {
                  const isPast = flexYear === today.getFullYear() && i < today.getMonth();
                  const selected = !isAnytime && flexMonth === i;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={isPast}
                      onClick={() => { setFlexMonth(i); setIsAnytime(false); }}
                      className={`rounded-xl px-3 py-3 text-left transition-colors ${
                        isPast ? "cursor-not-allowed bg-zinc-50 text-zinc-300" : selected ? "bg-sky-500 text-white" : "bg-zinc-50 text-zinc-950 hover:bg-sky-50"
                      }`}
                    >
                      <p className="font-heading text-sm font-black">{m}</p>
                      <p className={`text-xs ${selected ? "text-sky-100" : "text-zinc-400"}`}>{flexYear}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="font-heading mb-2 text-sm font-black text-zinc-950">I&apos;m flexible</p>
                  <button
                    type="button"
                    onClick={() => { setIsAnytime(true); setFlexMonth(null); }}
                    className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${isAnytime ? "border-sky-500 bg-sky-50 text-sky-600" : "border-zinc-200 text-zinc-700 hover:border-sky-400"}`}
                  >
                    Anytime
                  </button>
                </div>
                <button
                  type="button"
                  onClick={applyWhenSelection}
                  className="rounded-full bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-sky-600"
                >
                  Select date
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex flex-col gap-6 sm:flex-row sm:divide-x sm:divide-zinc-100">
                {renderCalendar(calBaseMonth)}
                <div className="sm:pl-6">{renderCalendar(new Date(calBaseMonth.getFullYear(), calBaseMonth.getMonth() + 1, 1))}</div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={applyWhenSelection}
                  className="rounded-full bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-sky-600"
                >
                  Select date
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* How Many Days? */}
      {openField === "duration" && (
        <div className="absolute left-0 top-full z-20 mt-2 w-full max-w-md rounded-2xl border border-zinc-100 bg-white p-5 shadow-xl">
          <p className="font-heading mb-3 text-base font-black text-zinc-950">Duration</p>
          <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">
            {DURATION_PRESETS.map((d) => {
              const Icon = d.icon;
              const selected = duration?.label === d.label;
              return (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => { setDuration(d); setOpenField(null); }}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
                    selected ? "border-sky-500 bg-sky-50 text-sky-600" : "border-zinc-200 text-zinc-700 hover:border-sky-300"
                  }`}
                >
                  <Icon size={16} className={selected ? "text-sky-500" : "text-sky-400"} /> {d.label}
                </button>
              );
            })}
          </div>

          <p className="font-heading mb-3 mt-5 border-t border-zinc-100 pt-4 text-base font-black text-zinc-950">Custom Range</p>
          <div className="flex items-center justify-between text-sm font-bold text-zinc-950">
            <span>{customMin} Days</span>
            <span>{customMax} Days</span>
          </div>
          <div className="relative mt-4 h-5">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-200" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-sky-500"
              style={{ left: `${(customMin / SLIDER_MAX) * 100}%`, right: `${100 - (customMax / SLIDER_MAX) * 100}%` }}
            />
            <input
              type="range" min={0} max={SLIDER_MAX} value={customMin}
              aria-label="Minimum trip duration in days"
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), customMax - 1);
                setCustomMin(v);
                setDuration({ label: `${v} – ${customMax} Days`, min: v, max: customMax });
              }}
              className={sliderThumbCls}
            />
            <input
              type="range" min={0} max={SLIDER_MAX} value={customMax}
              aria-label="Maximum trip duration in days"
              onChange={(e) => {
                const v = Math.max(Number(e.target.value), customMin + 1);
                setCustomMax(v);
                setDuration({ label: `${customMin} – ${v} Days`, min: customMin, max: v });
              }}
              className={sliderThumbCls}
            />
          </div>
        </div>
      )}

      {/* Who's going? */}
      {openField === "who" && (
        <div className="absolute right-0 top-full z-20 mt-2 w-full rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl sm:w-72">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-zinc-950">Adults</p>
              <p className="text-xs text-zinc-400">Ages 13+</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setAdults((v) => Math.max(1, v - 1))} aria-label="Decrease adults" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-sky-400 hover:text-sky-600 disabled:opacity-30" disabled={adults <= 1}>
                <Minus size={14} />
              </button>
              <span className="w-4 text-center text-sm font-bold text-zinc-950">{adults}</span>
              <button type="button" onClick={() => setAdults((v) => Math.min(20, v + 1))} aria-label="Increase adults" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-sky-400 hover:text-sky-600">
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-100 py-2 pt-3">
            <div>
              <p className="text-sm font-bold text-zinc-950">Children</p>
              <p className="text-xs text-zinc-400">Ages 2–12</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setChildren((v) => Math.max(0, v - 1))} aria-label="Decrease children" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-sky-400 hover:text-sky-600 disabled:opacity-30" disabled={children <= 0}>
                <Minus size={14} />
              </button>
              <span className="w-4 text-center text-sm font-bold text-zinc-950">{children}</span>
              <button type="button" onClick={() => setChildren((v) => Math.min(10, v + 1))} aria-label="Increase children" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-sky-400 hover:text-sky-600">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-center border-t border-zinc-100 pt-3 sm:absolute sm:-bottom-6 sm:left-1/2 sm:mt-0 sm:-translate-x-1/2 sm:border-0 sm:pt-0">
        <button
          type="button"
          onClick={handleSearch}
          className="flex items-center gap-2 rounded-full bg-sky-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:bg-sky-600 hover:shadow-xl hover:shadow-sky-500/40"
        >
          <Search size={16} /> Search
        </button>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuCalendarDays as CalendarDays, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuX as X } from "react-icons/lu";

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  className?: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string) {
  const date = parseDate(value);
  return date?.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) ?? "";
}

/** A single-field date range control backed by one calendar and one selected range. */
export default function DateRangePicker({ startDate, endDate, onChange, className = "" }: DateRangePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeBoundary, setActiveBoundary] = useState<"start" | "end">("start");
  const [currentMonth, setCurrentMonth] = useState(() => parseDate(startDate) ?? new Date());
  const [position, setPosition] = useState({ left: 16, top: 80, width: 420 });
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const calendarDays = useMemo(() => {
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [currentMonth]);

  const yearOptions = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 111 }, (_, index) => year + 10 - index);
  }, []);

  const positionPopover = useCallback((trigger: HTMLButtonElement | null) => {
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(420, window.innerWidth - 32);
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
    const height = 430;
    const top = window.innerHeight - rect.bottom >= height || rect.top < height ? rect.bottom + 8 : Math.max(16, rect.top - height - 8);
    setPosition({ left, top, width });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const reposition = () => positionPopover(triggerRef.current);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [activeBoundary, open, positionPopover]);

  function openPicker(boundary: "start" | "end") {
    setActiveBoundary(boundary);
    setCurrentMonth(parseDate(boundary === "start" ? startDate : endDate) ?? start ?? end ?? new Date());
    positionPopover(triggerRef.current);
    setOpen(true);
  }

  function selectDate(date: Date) {
    const selected = dateKey(date);
    if (activeBoundary === "start") {
      if (!startDate || endDate || (endDate && selected > endDate)) {
        onChange(selected, "");
        setActiveBoundary("end");
        return;
      }
      if (selected <= startDate) {
        onChange(selected, "");
        setActiveBoundary("end");
        return;
      }
      onChange(startDate, selected);
      setOpen(false);
      return;
    }
    if (!startDate || selected < startDate) {
      onChange(selected, "");
      setActiveBoundary("end");
      return;
    }
    onChange(startDate, selected);
    setOpen(false);
  }

  const startText = formatDate(startDate);
  const endText = formatDate(endDate);
  const rangeText = startText && endText
    ? `${startText} - ${endText}`
    : startText
      ? `${startText} - Select end date`
      : "Select date range";

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button ref={triggerRef} type="button" onClick={() => openPicker(startDate && !endDate ? "end" : "start")} aria-haspopup="dialog" aria-expanded={open} className={`flex min-h-[58px] w-full min-w-0 items-center gap-3 rounded-xl border bg-white px-3 py-2 text-left text-sm shadow-sm outline-none transition hover:border-slate-300 hover:shadow-md focus:ring-4 active:translate-y-px ${open ? "border-blue-600 ring-blue-100" : "border-slate-200 focus:border-blue-600 focus:ring-blue-100"}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><CalendarDays size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Booking date range</span>
          <span className={`block truncate ${startDate ? "font-bold text-slate-900" : "font-medium text-slate-500"}`}>{rangeText}</span>
        </span>
      </button>
      {(startDate || endDate) && <button type="button" onClick={() => { onChange("", ""); setActiveBoundary("start"); }} aria-label="Clear date range" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={14} /></button>}

      {open && createPortal(
        <div ref={popoverRef} role="dialog" aria-label="Choose a date range" style={position} className="fixed z-[200] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-18px_rgba(15,23,42,0.35)]">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Booking date range</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-600">{startDate && !endDate ? "Now select an end date" : "Select a start date, then an end date"}</p>
            </div>
            <span className="hidden shrink-0 text-xs font-bold text-blue-800 sm:block">{activeBoundary === "end" ? "End date" : "Start date"}</span>
          </div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><ChevronLeft size={17} /></button>
            <div className="flex items-center gap-1.5">
              <select aria-label="Jump to month" value={currentMonth.getMonth()} onChange={(event) => setCurrentMonth((month) => new Date(month.getFullYear(), Number(event.target.value), 1))} className="rounded-lg bg-transparent px-1.5 py-1 text-sm font-black text-slate-950 outline-none">
                {MONTH_NAMES.map((name, index) => <option key={name} value={index}>{name}</option>)}
              </select>
              <select aria-label="Jump to year" value={currentMonth.getFullYear()} onChange={(event) => setCurrentMonth((month) => new Date(Number(event.target.value), month.getMonth(), 1))} className="rounded-lg bg-transparent px-1.5 py-1 text-sm font-black text-slate-950 outline-none">
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><ChevronRight size={17} /></button>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center">{WEEKDAYS.map((day) => <span key={day} className="text-[10px] font-black uppercase tracking-wide text-slate-400">{day}</span>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-y-1">
            {calendarDays.map((date) => {
              const key = dateKey(date);
              const outsideMonth = date.getMonth() !== currentMonth.getMonth();
              const isStart = key === startDate;
              const isEnd = key === endDate;
              const inRange = Boolean(startDate && endDate && key > startDate && key < endDate);
              const edgeClass = isStart && isEnd ? "rounded-xl" : isStart ? "rounded-l-xl" : isEnd ? "rounded-r-xl" : "";
              return <button key={key} type="button" onClick={() => selectDate(date)} aria-label={date.toLocaleDateString("en-US", { dateStyle: "full" })} aria-pressed={isStart || isEnd} className={`relative flex h-10 items-center justify-center text-xs font-bold transition ${inRange ? "bg-blue-50 text-blue-800" : ""} ${isStart || isEnd ? `z-10 bg-blue-700 text-white shadow-md ${edgeClass}` : outsideMonth ? "text-slate-300 hover:bg-slate-50" : "text-slate-700 hover:bg-slate-100"}`}>{date.getDate()}</button>;
            })}
          </div>
          <div className="mt-4 flex justify-end border-t border-slate-100 pt-3"><button type="button" onClick={() => { onChange("", ""); setActiveBoundary("start"); }} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Clear range</button></div>
        </div>,
        document.body,
      )}
    </div>
  );
}

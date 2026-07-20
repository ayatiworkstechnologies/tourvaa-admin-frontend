"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  LuCalendarDays as CalendarDays,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuCircleCheck as CircleCheck,
} from "react-icons/lu";

export type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  availableDates?: string[];
  disabledDates?: string[];
  restrictToAvailableDates?: boolean;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  accent?: "blue" | "teal";
  align?: "left" | "right";
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  placeholder = "Select date",
  className = "",
  buttonClassName = "",
  availableDates = [],
  disabledDates = [],
  restrictToAvailableDates = false,
  required = false,
  disabled = false,
  clearable = true,
  accent = "blue",
  align = "left",
}: DatePickerProps) {
  const generatedId = useId();
  const dialogId = `${generatedId}-calendar`;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ left: 16, top: 80, width: 352 });
  const [currentMonth, setCurrentMonth] = useState(() => selectedDate ?? parseDate(minDate) ?? new Date());

  const availableSet = useMemo(() => new Set(availableDates.map((date) => date.slice(0, 10))), [availableDates]);
  const disabledSet = useMemo(() => new Set(disabledDates.map((date) => date.slice(0, 10))), [disabledDates]);
  const min = parseDate(minDate);
  const max = parseDate(maxDate);
  const today = startOfDay(new Date());
  const accentStyles = accent === "teal"
    ? { selected: "bg-teal-700 text-white shadow-teal-700/25", focus: "focus:border-teal-600 focus:ring-teal-600/10", icon: "text-teal-700", soft: "bg-teal-50 text-teal-800", dot: "bg-teal-500" }
    : { selected: "bg-blue-700 text-white shadow-blue-700/25", focus: "focus:border-blue-600 focus:ring-blue-600/10", icon: "text-blue-700", soft: "bg-blue-50 text-blue-800", dot: "bg-emerald-500" };

  useEffect(() => {
    if (selectedDate) setCurrentMonth(selectedDate);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !popoverRef.current?.contains(target)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const positionPopover = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(352, window.innerWidth - 32);
    const desiredLeft = align === "right" ? rect.right - width : rect.left;
    const left = Math.max(16, Math.min(desiredLeft, window.innerWidth - width - 16));
    const estimatedHeight = 430;
    const roomBelow = window.innerHeight - rect.bottom;
    const top = roomBelow >= estimatedHeight || roomBelow >= rect.top
      ? rect.bottom + 8
      : Math.max(16, rect.top - estimatedHeight - 8);
    setPopoverPosition({ left, top, width });
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    positionPopover();
    window.addEventListener("resize", positionPopover);
    window.addEventListener("scroll", positionPopover, true);
    return () => {
      window.removeEventListener("resize", positionPopover);
      window.removeEventListener("scroll", positionPopover, true);
    };
  }, [isOpen, positionPopover]);

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

  function isDisabledDate(date: Date) {
    const normalized = startOfDay(date);
    const key = dateKey(date);
    if (min && normalized < startOfDay(min)) return true;
    if (max && normalized > startOfDay(max)) return true;
    if (disabledSet.has(key)) return true;
    if (restrictToAvailableDates && availableSet.size > 0 && !availableSet.has(key)) return true;
    return false;
  }

  function selectDate(date: Date) {
    if (isDisabledDate(date)) return;
    onChange(dateKey(date));
    setIsOpen(false);
  }

  function openPicker() {
    if (disabled) return;
    setCurrentMonth(selectedDate ?? min ?? new Date());
    setIsOpen((open) => !open);
  }

  const formattedValue = selectedDate?.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) ?? "";
  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}{required && <span className="ml-1 text-rose-500">*</span>}</label>}
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        className={`flex min-h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm shadow-sm outline-none transition hover:border-slate-300 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 ${accentStyles.focus} ${buttonClassName}`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accentStyles.soft}`}><CalendarDays size={17} /></span>
        <span className={`min-w-0 flex-1 truncate ${formattedValue ? "font-bold text-slate-900" : "font-medium text-slate-400"}`}>{formattedValue || placeholder}</span>
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          id={dialogId}
          role="dialog"
          aria-label="Choose a date"
          style={popoverPosition}
          className="fixed z-[200] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-18px_rgba(15,23,42,0.35)]"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"><ChevronLeft size={17} /></button>
            <div className="text-center"><p className="text-sm font-black text-slate-950">{monthLabel}</p><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Choose travel date</p></div>
            <button type="button" onClick={() => setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"><ChevronRight size={17} /></button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center">
            {WEEKDAYS.map((day) => <span key={day} className="text-[10px] font-black uppercase tracking-wide text-slate-400">{day.slice(0, 2)}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const key = dateKey(date);
              const outsideMonth = date.getMonth() !== currentMonth.getMonth();
              const dateDisabled = isDisabledDate(date);
              const selected = value.slice(0, 10) === key;
              const isToday = dateKey(today) === key;
              const available = availableSet.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={dateDisabled}
                  onClick={() => selectDate(date)}
                  aria-label={date.toLocaleDateString("en-US", { dateStyle: "full" })}
                  aria-pressed={selected}
                  className={`relative flex h-10 items-center justify-center rounded-xl text-xs font-bold transition ${selected ? `${accentStyles.selected} shadow-md` : dateDisabled ? "cursor-not-allowed text-slate-300 line-through decoration-slate-300" : outsideMonth ? "text-slate-300 hover:bg-slate-50" : isToday ? accentStyles.soft : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}
                >
                  {selected ? <CircleCheck size={17} /> : date.getDate()}
                  {available && !selected && !dateDisabled && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${accentStyles.dot}`} />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              {availableSet.size > 0 && <><span className={`h-2 w-2 rounded-full ${accentStyles.dot}`} />Available</>}
            </div>
            <div className="flex gap-2">
              {clearable && <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Clear</button>}
              {!isDisabledDate(today) && <button type="button" onClick={() => selectDate(today)} className={`rounded-lg px-2.5 py-1.5 text-xs font-black ${accentStyles.soft}`}>Today</button>}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuCalendar as CalendarIcon } from "react-icons/lu";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  label?: string;
  className?: string;
  availableDates?: string[];
}

export default function DatePicker({ value, onChange, minDate, label, className = "", availableDates = [] }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = generateDays();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const isDateDisabled = (date: Date) => {
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }
    return false;
  };

  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date)) return;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  const formattedValue = value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white py-4 pl-4 pr-4 text-sm font-bold text-zinc-950 shadow-sm outline-none transition-all hover:border-indigo-600 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
      >
        <CalendarIcon size={20} className="text-zinc-400" />
        <span className={value ? "text-zinc-950" : "text-zinc-400 font-medium"}>
          {formattedValue || "Select Date"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[320px] max-w-sm origin-top-left rounded-3xl border border-zinc-100 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-black text-zinc-950">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handlePrevMonth} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={handleNextMonth} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center">
            {days.map((date, i) => {
              if (!date) return <div key={i} />;
              const isDisabled = isDateDisabled(date);
              const isSelected = value && new Date(value).toDateString() === date.toDateString();
              const isToday = new Date().toDateString() === date.toDateString();
              
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const isAvailable = availableDates.includes(dateString);

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(date)}
                  className={`
                    relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all
                    ${isDisabled ? "text-zinc-300 opacity-50 cursor-not-allowed" : "hover:bg-zinc-100 cursor-pointer"}
                    ${isSelected ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 font-black" : ""}
                    ${isToday && !isSelected ? "text-indigo-600 bg-indigo-50" : ""}
                    ${!isSelected && !isDisabled && !isToday ? "text-zinc-700" : ""}
                  `}
                >
                  {date.getDate()}
                  {isAvailable && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-5 flex justify-between border-t border-zinc-100 pt-4">
             <button type="button" onClick={() => { onChange(""); setIsOpen(false); }} className="text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-950">Clear</button>
             <button type="button" onClick={() => { setCurrentMonth(new Date()); handleSelectDate(new Date()); }} className="text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-700">Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

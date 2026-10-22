"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck as Check, LuChevronDown as ChevronDown, LuSearch as Search } from "react-icons/lu";

type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

/** A compact searchable picker for long option lists such as country and city. */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search options",
  disabled = false,
  className = "",
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value);
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized ? options.filter((option) => option.label.toLocaleLowerCase().includes(normalized)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 rounded-xl border border-dash-border bg-white px-3 py-2.5 text-left text-sm outline-none transition hover:border-slate-300 focus:border-dash-brand focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-dash-bg disabled:text-dash-subtle"
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? "font-medium text-dash-text" : "text-dash-subtle"}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown aria-hidden="true" size={15} className={`shrink-0 text-dash-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[15rem] overflow-hidden rounded-xl border border-dash-border bg-white shadow-xl" role="listbox" aria-label={placeholder}>
          <div className="flex items-center gap-2 border-b border-dash-border bg-dash-bg/50 px-3 py-2.5">
            <Search aria-hidden="true" size={15} className="shrink-0 text-dash-subtle" />
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-sm text-dash-text outline-none placeholder:text-dash-subtle" />
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {matches.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-dash-subtle">No matching options</p>
            ) : matches.map((option) => (
              <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false); setQuery(""); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-sky-50 ${option.value === value ? "bg-sky-50 font-semibold text-dash-brand" : "text-dash-text"}`}>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.value === value ? <Check aria-hidden="true" size={15} className="shrink-0" /> : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck as Check, LuChevronDown as ChevronDown, LuSearch as Search } from "react-icons/lu";
import type { CountryCode } from "libphonenumber-js/min";
import FlagIcon from "@/components/ui/FlagIcon";
import { PHONE_COUNTRIES } from "@/lib/utils/phoneCountries";

type RegistrationCountrySelectProps = {
  value: CountryCode | "";
  onChange: (iso: CountryCode) => void;
};

/** The country selected here is also the sole source for the telephone dial code. */
export default function RegistrationCountrySelect({ value, onChange }: RegistrationCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => PHONE_COUNTRIES.find((country) => country.iso === value), [value]);
  const countries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(term) || country.iso.toLowerCase() === term || country.dialCode.includes(term)
    );
  }, [query]);

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
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  return (
    <div className="relative mb-4 block" ref={containerRef}>
      <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select country"
        className="flex w-full items-center gap-3 rounded-xl border border-dash-border bg-white px-3 py-2.5 text-left text-sm text-dash-text outline-none transition hover:border-slate-300 focus:border-dash-brand focus:ring-4 focus:ring-sky-100 active:translate-y-px"
      >
        {selected ? (
          <span className="flex h-6 w-9 shrink-0 items-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-0.5 shadow-sm"><FlagIcon countryCode={selected.iso} /></span>
        ) : (
          <span className="h-6 w-9 shrink-0 rounded-md border border-dashed border-slate-300 bg-slate-50" />
        )}
        <span className={`min-w-0 flex-1 truncate ${selected ? "font-medium" : "text-slate-400"}`}>
          {selected ? selected.name : "Select country"}
        </span>
        {selected && <span className="shrink-0 text-xs font-semibold text-dash-subtle">{selected.dialCode}</span>}
        <ChevronDown size={16} className={`shrink-0 text-dash-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-[min(100%,24rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10" role="listbox" aria-label="Countries">
          <div className="border-b border-slate-100 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 focus-within:border-dash-brand focus-within:ring-2 focus-within:ring-sky-100">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country or calling code"
                className="min-w-0 flex-1 bg-transparent text-sm text-dash-text outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {countries.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-dash-subtle">No matching country</li>
            ) : countries.map((country) => (
              <li key={country.iso}>
                <button
                  type="button"
                  role="option"
                  aria-selected={country.iso === value}
                  onClick={() => {
                    onChange(country.iso);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-sky-50 ${country.iso === value ? "bg-sky-50 font-semibold text-dash-brand" : "text-dash-text"}`}
                >
                  <span className="flex h-5 w-7 shrink-0 items-center overflow-hidden rounded border border-slate-200 bg-white p-px"><FlagIcon countryCode={country.iso} /></span>
                  <span className="min-w-0 flex-1 truncate">{country.name}</span>
                  <span className="shrink-0 text-xs text-dash-subtle">{country.dialCode}</span>
                  <span className="w-4 shrink-0 text-dash-brand">{country.iso === value ? <Check size={15} /> : null}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

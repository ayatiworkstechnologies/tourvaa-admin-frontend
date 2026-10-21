"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronDown as ChevronDown, LuCircleCheck as CircleCheck, LuSearch as Search } from "react-icons/lu";
import type { CountryCode } from "libphonenumber-js/min";
import FlagIcon from "@/components/ui/FlagIcon";
import { PHONE_COUNTRIES, dialCodeForIso, formatAsYouType, validatePhoneForCountry } from "@/lib/utils/phoneCountries";
import { digitsOnly } from "@/lib/utils/validators";

type CountryPhoneInputProps = {
  countryIso: CountryCode | "";
  number: string;
  onCountryChange: (iso: CountryCode) => void;
  onNumberChange: (digits: string) => void;
  /** Label for the mobile number field. */
  label?: string;
  /** Label for the country field. */
  countryLabel?: string;
  required?: boolean;
  helpText?: string;
  errorMessage?: string;
  className?: string;
  placeholder?: string;
  /** Hide the country picker when country is selected by a separate field. */
  showCountryPicker?: boolean;
};

/** Shared country-code and mobile-number control. The left selector opens a
 * searchable country list; the right input accepts only the local number.
 * Together they submit a validated international E.164 number. */
export default function CountryPhoneInput({
  countryIso,
  number,
  onCountryChange,
  onNumberChange,
  label = "Mobile Number",
  countryLabel = "Select country",
  required = false,
  helpText,
  errorMessage,
  className = "",
  placeholder = "e.g. 98765 43210",
  showCountryPicker = true,
}: CountryPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => PHONE_COUNTRIES.find((c) => c.iso === countryIso),
    [countryIso]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.iso.toLowerCase() === q
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      clearTimeout(t);
    };
  }, [open]);

  const isValid = countryIso && number.length >= 4 ? validatePhoneForCountry(countryIso, number) : null;
  const formatted = countryIso ? formatAsYouType(countryIso, number) : number;
  const validationMessage = errorMessage || (
    isValid === false ? "Enter a valid mobile number for the selected country." : ""
  );

  return (
    <div className={className}>
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
        <div
          ref={containerRef}
          className={`relative flex overflow-visible rounded-xl border bg-white transition-shadow focus-within:ring-4 ${
            validationMessage
              ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-100"
              : "border-dash-border focus-within:border-dash-brand focus-within:ring-sky-100"
          }`}
        >
          {showCountryPicker ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={countryLabel}
              title={selected ? `${selected.name} (${selected.dialCode})` : countryLabel}
              className="flex shrink-0 items-center gap-1.5 border-r border-dash-border bg-dash-bg px-3 py-2.5 text-sm font-semibold text-dash-text outline-none transition hover:bg-slate-100 focus:bg-slate-100"
            >
              {selected ? <span className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]"><FlagIcon countryCode={selected.iso} /></span> : null}
              <span className={`max-w-[132px] truncate ${selected ? "" : "font-normal text-dash-subtle"}`}>{selected ? `${selected.name} ${selected.dialCode}` : "Select country"}</span>
              <ChevronDown size={14} className={`shrink-0 text-dash-subtle transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <span className="flex shrink-0 items-center gap-2 border-r border-dash-border bg-dash-bg px-3 py-2.5 text-sm font-semibold text-dash-text">
              {selected ? <span className="flex h-5 w-7 shrink-0 items-center overflow-hidden rounded border border-slate-200 bg-white p-px"><FlagIcon countryCode={selected.iso} /></span> : null}
              <span>{selected?.dialCode || "—"}</span>
            </span>
          )}

          {open && (
            <div
              role="listbox"
              className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-72 min-w-[280px] origin-top overflow-hidden rounded-xl border border-dash-border bg-white shadow-xl transition duration-150 ease-out"
            >
              <div className="flex items-center gap-2 border-b border-dash-border px-3 py-2">
                <Search size={14} className="shrink-0 text-dash-subtle" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full text-sm outline-none placeholder:text-dash-subtle"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2.5 text-sm text-dash-subtle">No matches</li>
                ) : (
                  filtered.map((c) => (
                    <li key={c.iso}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={c.iso === countryIso}
                        onClick={() => {
                          onCountryChange(c.iso);
                          setOpen(false);
                          setQuery("");
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-dash-bg ${
                          c.iso === countryIso ? "bg-sky-50 font-semibold text-dash-brand" : "text-dash-text"
                        }`}
                      >
                        <span className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]">
                          <FlagIcon countryCode={c.iso} />
                        </span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="shrink-0 text-dash-subtle">{c.dialCode}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
          <input
            type="tel"
            inputMode="numeric"
            value={formatted}
            onChange={(event) => onNumberChange(digitsOnly(event.target.value))}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-r-xl px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-subtle disabled:cursor-not-allowed disabled:bg-slate-50"
            required={required}
            disabled={!selected}
            autoComplete="tel-national"
            aria-invalid={Boolean(validationMessage)}
            aria-describedby={validationMessage ? "phone-error" : undefined}
          />

          {isValid !== null && (
            <span className={`flex items-center pr-3 ${isValid ? "text-emerald-500" : "text-red-400"}`} title={isValid ? "Valid number" : "Doesn't look like a valid number for this country"}>
              <CircleCheck size={16} />
            </span>
          )}
        </div>
        {validationMessage ? (
          <p id="phone-error" className="mt-1 text-xs text-red-600">{validationMessage}</p>
        ) : (
          helpText && <p className="mt-1 text-xs text-dash-subtle">{helpText}</p>
        )}
      </label>
    </div>
  );
}

export { dialCodeForIso };

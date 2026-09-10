"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronDown as ChevronDown, LuCircleCheck as CircleCheck, LuSearch as Search } from "react-icons/lu";
import type { CountryCode } from "libphonenumber-js/min";
import FlagIcon from "@/components/ui/FlagIcon";
import { PHONE_COUNTRIES, dialCodeForIso, formatAsYouType, validatePhoneForCountry } from "@/lib/utils/phoneCountries";
import { digitsOnly } from "@/lib/utils/validators";

type CountryPhoneInputProps = {
  countryIso: CountryCode;
  number: string;
  onCountryChange: (iso: CountryCode) => void;
  onNumberChange: (digits: string) => void;
  label?: string;
  required?: boolean;
  helpText?: string;
  errorMessage?: string;
  className?: string;
};

/** The one country-code + phone number input used everywhere a phone number
 * is collected (login/registration/profile forms) - a searchable dropdown of
 * every country (flag + name + dial code, via libphonenumber-js + the
 * existing FlagIcon component), live as-you-type formatting, and an inline
 * valid/invalid indicator once enough digits are entered. */
export default function CountryPhoneInput({
  countryIso,
  number,
  onCountryChange,
  onNumberChange,
  label = "Mobile Number",
  required = false,
  helpText,
  errorMessage,
  className = "",
}: CountryPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => PHONE_COUNTRIES.find((c) => c.iso === countryIso) ?? PHONE_COUNTRIES.find((c) => c.iso === "IN"),
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

  const isValid = number.length >= 4 ? validatePhoneForCountry(countryIso, number) : null;
  const formatted = formatAsYouType(countryIso, number);

  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
      <div
        ref={containerRef}
        className={`relative flex overflow-visible rounded-xl border bg-white transition-shadow focus-within:ring-4 ${
          errorMessage
            ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-100"
            : "border-dash-border focus-within:border-dash-brand focus-within:ring-sky-100"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex shrink-0 items-center gap-1.5 rounded-l-xl border-r border-dash-border bg-dash-bg px-2.5 py-2.5 text-sm font-semibold text-dash-text outline-none transition hover:bg-slate-100"
        >
          <span className="h-3.5 w-5 overflow-hidden rounded-[2px]">
            <FlagIcon countryCode={selected?.iso} />
          </span>
          <span>{selected?.dialCode}</span>
          <ChevronDown size={13} className={`text-dash-subtle transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <input
          type="tel"
          inputMode="numeric"
          value={formatted}
          onChange={(event) => onNumberChange(digitsOnly(event.target.value))}
          placeholder="9876543210"
          className="min-w-0 flex-1 rounded-r-xl px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-subtle"
          required={required}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "phone-error" : undefined}
        />

        {isValid !== null && (
          <span className={`flex items-center pr-3 ${isValid ? "text-emerald-500" : "text-red-400"}`} title={isValid ? "Valid number" : "Doesn't look like a valid number for this country"}>
            <CircleCheck size={16} />
          </span>
        )}

        {open && (
          <div
            role="listbox"
            className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-72 w-full min-w-[280px] origin-top overflow-hidden rounded-xl border border-dash-border bg-white shadow-xl transition duration-150 ease-out"
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
      </div>
      {errorMessage ? (
        <p id="phone-error" className="mt-1 text-xs text-red-600">{errorMessage}</p>
      ) : (
        helpText && <p className="mt-1 text-xs text-dash-subtle">{helpText}</p>
      )}
    </label>
  );
}

export { dialCodeForIso };

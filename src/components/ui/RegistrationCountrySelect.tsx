"use client";

import type { CountryCode } from "libphonenumber-js/min";
import { PHONE_COUNTRIES } from "@/lib/utils/phoneCountries";

type RegistrationCountrySelectProps = {
  value: CountryCode | "";
  onChange: (iso: CountryCode) => void;
};

/** The country selected here is also the sole source for the telephone dial code. */
export default function RegistrationCountrySelect({ value, onChange }: RegistrationCountrySelectProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value as CountryCode)}
        className="w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm text-dash-text outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-sky-100"
        aria-label="Country"
      >
        <option value="">Select country</option>
        {PHONE_COUNTRIES.map((country) => (
          <option key={country.iso} value={country.iso}>{country.name} ({country.dialCode})</option>
        ))}
      </select>
    </label>
  );
}

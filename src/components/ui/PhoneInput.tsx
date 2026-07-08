"use client";

import { phoneCountryCodes } from "@/lib/constants/locationOptions";
import { digitsOnly } from "@/lib/utils/validators";

type PhoneInputProps = {
  countryCode: string;
  number: string;
  onCountryCodeChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  label?: string;
  required?: boolean;
  helpText?: string;
  errorMessage?: string;
  className?: string;
};

export default function PhoneInput({
  countryCode,
  number,
  onCountryCodeChange,
  onNumberChange,
  label = "Mobile Number",
  required = false,
  helpText,
  errorMessage,
  className = "",
}: PhoneInputProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">{label}</span>
      <div
        className={`flex overflow-hidden rounded-xl border bg-white focus-within:ring-2 ${
          errorMessage
            ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-100"
            : "border-dash-border focus-within:border-dash-brand focus-within:ring-sky-100"
        }`}
      >
        <select
          value={countryCode}
          onChange={(event) => onCountryCodeChange(event.target.value)}
          className="w-32 shrink-0 border-r border-dash-border bg-dash-bg px-2.5 py-2.5 text-sm font-semibold text-dash-text outline-none"
          aria-label="Country code"
          required={required}
        >
          {phoneCountryCodes.map((option) => (
            <option key={`${option.label}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={number}
          onChange={(event) => onNumberChange(digitsOnly(event.target.value))}
          placeholder="9876543212"
          className="min-w-0 flex-1 px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-subtle"
          required={required}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "phone-error" : undefined}
        />
      </div>
      {errorMessage ? (
        <p id="phone-error" className="mt-1 text-xs text-red-600">{errorMessage}</p>
      ) : (
        helpText && <p className="mt-1 text-xs text-dash-subtle">{helpText}</p>
      )}
    </label>
  );
}

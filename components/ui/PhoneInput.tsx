"use client";

import { phoneCountryCodes } from "@/lib/location-options";
import { digitsOnly } from "@/lib/validators";

const flagByCountryCode: Record<string, string> = {
  "+91": "🇮🇳",
  "+971": "🇦🇪",
  "+1": "🇺🇸",
  "+44": "🇬🇧",
  "+61": "🇦🇺",
  "+65": "🇸🇬",
  "+60": "🇲🇾",
  "+49": "🇩🇪",
  "+33": "🇫🇷",
  "+39": "🇮🇹",
  "+34": "🇪🇸",
  "+81": "🇯🇵",
  "+86": "🇨🇳",
  "+27": "🇿🇦",
  "+55": "🇧🇷",
};

type PhoneInputProps = {
  countryCode: string;
  number: string;
  onCountryCodeChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  label?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
};

function countryCodeLabel(label: string, value: string) {
  return `${flagByCountryCode[value] || "🏳️"} ${label}`;
}

export default function PhoneInput({
  countryCode,
  number,
  onCountryCodeChange,
  onNumberChange,
  label = "Mobile Number",
  required = false,
  helpText,
  className = "",
}: PhoneInputProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">{label}</span>
      <div className="flex overflow-hidden rounded-xl border border-[#E7EAF0] bg-white focus-within:border-[#43A9F6] focus-within:ring-2 focus-within:ring-sky-100">
        <select
          value={countryCode}
          onChange={(event) => onCountryCodeChange(event.target.value)}
          className="w-32 shrink-0 border-r border-[#E7EAF0] bg-[#F7F9FC] px-2.5 py-2.5 text-sm font-semibold text-[#121826] outline-none"
          aria-label="Country code"
          required={required}
        >
          {phoneCountryCodes.map((option) => (
            <option key={`${option.label}-${option.value}`} value={option.value}>
              {countryCodeLabel(option.label, option.value)}
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
          className="min-w-0 flex-1 px-3 py-2.5 text-sm text-[#121826] outline-none placeholder:text-[#98A2B3]"
          required={required}
        />
      </div>
      {helpText && <p className="mt-1 text-xs text-[#98A2B3]">{helpText}</p>}
    </label>
  );
}

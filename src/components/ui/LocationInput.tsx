"use client";

import { useMemo } from "react";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type LocationInputProps = {
  country: string;
  city: string;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  required?: boolean;
  state?: string;
  pincode?: string;
  onStateChange?: (value: string) => void;
  onPincodeChange?: (value: string) => void;
  theme?: "emerald" | "orange" | "sky" | "blue";
};


export default function LocationInput({
  country,
  city,
  onCountryChange,
  onCityChange,
  required = false,
  state = "",
  pincode = "",
  onStateChange,
  onPincodeChange,
  theme = "sky",
}: LocationInputProps) {
  const { countries } = useGeoCountries();
  const countryId = useMemo(
    () => countries.find((item) => item.name === country)?.id ?? null,
    [countries, country]
  );
  const { states } = useGeoStates(countryId);
  const stateId = useMemo(
    () => states.find((item) => item.name === state)?.id ?? null,
    [states, state]
  );
  const { cities } = useGeoCities(stateId, countryId);

  const countryOptions = useMemo(
    () => countries.map((item) => ({ key: `country-${item.id}`, value: item.name })),
    [countries]
  );

  const stateOptions = useMemo(
    () => states.map((item) => ({ key: `state-${item.id}`, value: item.name })),
    [states]
  );

  const cityOptions = useMemo(
    () => cities.map((item) => ({ key: `city-${item.id}`, value: item.name })),
    [cities]
  );

  const themeCls = (t: string) => {
    if (t === "emerald") return "focus:border-emerald-500 focus:ring-emerald-100";
    if (t === "orange") return "focus:border-orange-500 focus:ring-orange-100";
    return "focus:border-dash-brand focus:ring-sky-100";
  };

  if (onStateChange && onPincodeChange) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
          <select
            value={country}
            onChange={(event) => {
              onCountryChange(event.target.value);
              onStateChange?.("");
              onCityChange("");
            }}
            className={`w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)}`}
            required={required}
          >
            <option value="">Select country</option>
            {countryOptions.map((item) => (
              <option key={item.key} value={item.value}>{item.value}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">State</span>
          <select
            value={state}
            onChange={(event) => {
              onStateChange(event.target.value);
              onCityChange("");
            }}
            className={`w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)} disabled:bg-dash-bg`}
            disabled={!country}
            required={required}
          >
            <option value="">{country ? "Select state" : "Select country first"}</option>
            {stateOptions.map((item) => (
              <option key={item.key} value={item.value}>{item.value}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">City</span>
          <select
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            className={`w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)} disabled:bg-dash-bg`}
            disabled={!state}
            required={required}
          >
            <option value="">{state ? "Select city" : "Select state first"}</option>
            {cityOptions.map((item) => (
              <option key={item.key} value={item.value}>{item.value}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Pincode</span>
          <input
            type="tel"
            inputMode="numeric"
            value={pincode}
            onChange={(event) => onPincodeChange(event.target.value)}
            placeholder="Pincode"
            className={`w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)}`}
            required={required}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Country</span>
        <select
          value={country}
          onChange={(event) => {
            onCountryChange(event.target.value);
            onCityChange("");
          }}
          className={`w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)}`}
          required={required}
        >
          <option value="">Select country</option>
          {countryOptions.map((item) => (
            <option key={item.key} value={item.value}>{item.value}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">City</span>
        <select
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          className={`w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)} disabled:bg-dash-bg`}
          disabled={!country}
          required={required}
        >
          <option value="">{country ? "Select city" : "Select country first"}</option>
          {cityOptions.map((item) => (
            <option key={item.key} value={item.value}>{item.value}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

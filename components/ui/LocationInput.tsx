"use client";

import { useEffect, useMemo, useState } from "react";
import publicApi from "@/lib/publicApi";
import { countries as fallbackCountries, getCitiesForCountry } from "@/lib/location-options";

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

type PublicCountryOption = { country_name?: string; name?: string };
type PublicCityOption = { city_name?: string; name?: string };

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
  const [publicCountries, setPublicCountries] = useState<string[]>([]);
  const [publicCities, setPublicCities] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    publicApi
      .get("/countries")
      .then((response) => {
        if (!active) return;
        const items = (response.data?.items || []) as PublicCountryOption[];
        setPublicCountries(
          items
             .map((item) => item.country_name || item.name || "")
             .filter(Boolean)
        );
      })
      .catch(() => setPublicCountries([]));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const query = country.trim();

    if (!query) {
      setPublicCities([]);
      return;
    }

    publicApi
      .get("/cities", { params: { country: query } })
      .then((response) => {
        if (!active) return;
        const items = (response.data?.items || []) as PublicCityOption[];
        setPublicCities(
          items
             .map((item) => item.city_name || item.name || "")
             .filter(Boolean)
        );
      })
      .catch(() => setPublicCities([]));

    return () => {
      active = false;
    };
  }, [country]);

  const countryOptions = useMemo(
    () => Array.from(new Set([...publicCountries, ...fallbackCountries])).slice(0, 100),
    [publicCountries]
  );

  const cityOptions = useMemo(
    () => Array.from(new Set([...publicCities, ...getCitiesForCountry(country)])).slice(0, 100),
    [country, publicCities]
  );

  const themeCls = (t: string) => {
    if (t === "emerald") return "focus:border-emerald-500 focus:ring-emerald-100";
    if (t === "orange") return "focus:border-orange-500 focus:ring-orange-100";
    return "focus:border-[#43A9F6] focus:ring-sky-100";
  };

  if (onStateChange && onPincodeChange) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Country</span>
          <input
            list="tourvaa-country-options"
            value={country}
            onChange={(event) => {
              onCountryChange(event.target.value);
              onCityChange("");
            }}
            placeholder="Search country"
            className={`w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)}`}
            required={required}
          />
          <datalist id="tourvaa-country-options">
            {countryOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">State</span>
          <input
            value={state}
            onChange={(event) => onStateChange(event.target.value)}
            placeholder="State"
            className={`w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)}`}
            required={required}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">City</span>
          <input
            list="tourvaa-city-options"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            placeholder={country ? "Search city" : "Select country first"}
            className={`w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)} disabled:bg-[#F7F9FC]`}
            disabled={!country}
            required={required}
          />
          <datalist id="tourvaa-city-options">
            {cityOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Pincode</span>
          <input
            type="tel"
            inputMode="numeric"
            value={pincode}
            onChange={(event) => onPincodeChange(event.target.value)}
            placeholder="Pincode"
            className={`w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)}`}
            required={required}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">Country</span>
        <input
          list="tourvaa-country-options"
          value={country}
          onChange={(event) => {
            onCountryChange(event.target.value);
            onCityChange("");
          }}
          placeholder="Search country"
          className={`w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)}`}
          required={required}
        />
        <datalist id="tourvaa-country-options">
          {countryOptions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-[#667085]">City</span>
        <input
          list="tourvaa-city-options"
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          placeholder={country ? "Search city" : "Select country first"}
          className={`w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:ring-2 ${themeCls(theme)} disabled:bg-[#F7F9FC]`}
          disabled={!country}
          required={required}
        />
        <datalist id="tourvaa-city-options">
          {cityOptions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </label>
    </div>
  );
}

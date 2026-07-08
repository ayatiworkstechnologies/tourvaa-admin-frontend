"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";

export type GeoCountry = {
  id: number;
  name: string;
  code: string;
  phone_code: string;
  currency_code: string;
};

export type GeoState = {
  id: number;
  name: string;
  code: string;
};

export type GeoCity = {
  id: number;
  name: string;
};

// Module-level cache so data is fetched only once per session
let _countriesCache: GeoCountry[] | null = null;
const _statesCache = new Map<number, GeoState[]>();
const _citiesCache = new Map<string, GeoCity[]>();

function responseItems<T>(payload: { data?: T[]; items?: T[] }) {
  return payload.items ?? payload.data ?? [];
}

async function fetchCountries(): Promise<GeoCountry[]> {
  if (_countriesCache) return _countriesCache;
  const res = await api.get("/countries", { params: { limit: 500 } });
  _countriesCache = responseItems<Record<string, unknown>>(res.data).map((item) => ({
    id: Number(item.id),
    name: String(item.country_name ?? item.name ?? ""),
    code: String(item.country_code ?? item.code ?? ""),
    phone_code: String(item.phone_code ?? ""),
    currency_code: String(item.currency_code ?? ""),
  })).filter((item) => item.id && item.name);
  return _countriesCache;
}

async function fetchStates(countryId: number): Promise<GeoState[]> {
  if (_statesCache.has(countryId)) return _statesCache.get(countryId)!;
  const res = await api.get("/states", { params: { country_id: countryId, limit: 500 } });
  const data = responseItems<Record<string, unknown>>(res.data).map((item) => ({
    id: Number(item.id),
    name: String(item.state_name ?? item.name ?? ""),
    code: String(item.state_code ?? item.code ?? ""),
  })).filter((item) => item.id && item.name);
  _statesCache.set(countryId, data);
  return data;
}

async function fetchCities(stateId?: number | null, countryId?: number | null): Promise<GeoCity[]> {
  const cacheKey = stateId ? `state:${stateId}` : countryId ? `country:${countryId}` : "none";
  if (_citiesCache.has(cacheKey)) return _citiesCache.get(cacheKey)!;
  const params = stateId ? { state_id: stateId, limit: 500 } : { country_id: countryId, limit: 500 };
  const res = await api.get("/cities", { params });
  const data = responseItems<Record<string, unknown>>(res.data).map((item) => ({
    id: Number(item.id),
    name: String(item.city_name ?? item.name ?? ""),
  })).filter((item) => item.id && item.name);
  _citiesCache.set(cacheKey, data);
  return data;
}

/** Returns all active countries. Cached after first call. */
export function useGeoCountries() {
  const [countries, setCountries] = useState<GeoCountry[]>(_countriesCache ?? []);
  const [loading, setLoading] = useState(!_countriesCache);

  useEffect(() => {
    if (_countriesCache) { setCountries(_countriesCache); return; }
    fetchCountries()
      .then(setCountries)
      .finally(() => setLoading(false));
  }, []);

  return { countries, loading };
}

/** Returns states for `countryId`. Fetches on change; cached per country. */
export function useGeoStates(countryId: number | null | undefined) {
  const [states, setStates] = useState<GeoState[]>(
    countryId ? (_statesCache.get(countryId) ?? []) : []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!countryId) { setStates([]); return; }
    if (_statesCache.has(countryId)) { setStates(_statesCache.get(countryId)!); return; }
    setLoading(true);
    fetchStates(countryId)
      .then(setStates)
      .finally(() => setLoading(false));
  }, [countryId]);

  return { states, loading };
}

/** Returns cities for `stateId`, or all country cities when no state is selected. */
export function useGeoCities(stateId: number | null | undefined, countryId?: number | null | undefined) {
  const cacheKey = stateId ? `state:${stateId}` : countryId ? `country:${countryId}` : "none";
  const [cities, setCities] = useState<GeoCity[]>(
    _citiesCache.get(cacheKey) ?? []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stateId && !countryId) { setCities([]); return; }
    if (_citiesCache.has(cacheKey)) { setCities(_citiesCache.get(cacheKey)!); return; }
    setLoading(true);
    fetchCities(stateId, countryId)
      .then(setCities)
      .finally(() => setLoading(false));
  }, [cacheKey, countryId, stateId]);

  return { cities, loading };
}

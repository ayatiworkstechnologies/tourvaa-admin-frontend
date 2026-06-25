"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

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
const _citiesCache = new Map<number, GeoCity[]>();

async function fetchCountries(): Promise<GeoCountry[]> {
  if (_countriesCache) return _countriesCache;
  const res = await api.get("/geo/countries");
  _countriesCache = (res.data?.data ?? []) as GeoCountry[];
  return _countriesCache;
}

async function fetchStates(countryId: number): Promise<GeoState[]> {
  if (_statesCache.has(countryId)) return _statesCache.get(countryId)!;
  const res = await api.get("/geo/states", { params: { country_id: countryId } });
  const data = (res.data?.data ?? []) as GeoState[];
  _statesCache.set(countryId, data);
  return data;
}

async function fetchCities(stateId: number): Promise<GeoCity[]> {
  if (_citiesCache.has(stateId)) return _citiesCache.get(stateId)!;
  const res = await api.get("/geo/cities", { params: { state_id: stateId } });
  const data = (res.data?.data ?? []) as GeoCity[];
  _citiesCache.set(stateId, data);
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

/** Returns cities for `stateId`. Fetches on change; cached per state. */
export function useGeoCities(stateId: number | null | undefined) {
  const [cities, setCities] = useState<GeoCity[]>(
    stateId ? (_citiesCache.get(stateId) ?? []) : []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stateId) { setCities([]); return; }
    if (_citiesCache.has(stateId)) { setCities(_citiesCache.get(stateId)!); return; }
    setLoading(true);
    fetchCities(stateId)
      .then(setCities)
      .finally(() => setLoading(false));
  }, [stateId]);

  return { cities, loading };
}

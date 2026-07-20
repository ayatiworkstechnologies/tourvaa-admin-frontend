"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";
import { currencySymbol, formatCurrency, formatCurrencyCompact } from "@/lib/utils/currency";

type CurrencyState = {
  code: string;
  baseCode: string;
  rates: Record<string, number>;
  loading: boolean;
  isStale: boolean;
  rateDate?: string;
};

const STORAGE_KEY = "tourvaa_display_currency";
const listeners = new Set<(state: CurrencyState) => void>();
let state: CurrencyState = { code: "USD", baseCode: "USD", rates: { USD: 1 }, loading: true, isStale: false };
let loadPromise: Promise<void> | null = null;

function emit(next: Partial<CurrencyState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener(state));
}

function localeCountry(): string {
  if (typeof navigator === "undefined") return "";
  try {
    return new Intl.Locale(navigator.language).region || "";
  } catch {
    return navigator.language.split("-")[1]?.toUpperCase() || "";
  }
}

async function loadCurrency() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const country = localeCountry();
    const [ratesResult, contextResult] = await Promise.allSettled([
      api.get("/currency/rates", { params: { base: "USD" } }),
      api.get("/currency/context", { params: country ? { country } : {} }),
    ]);
    const rateData = ratesResult.status === "fulfilled" ? ratesResult.value.data?.data : null;
    const contextData = contextResult.status === "fulfilled" ? contextResult.value.data?.data : null;
    const rates = rateData?.rates && typeof rateData.rates === "object" ? rateData.rates : { USD: 1 };
    const detected = String(contextData?.currency || "USD").toUpperCase();
    const preferred = String(saved || detected || "USD").toUpperCase();
    emit({
      baseCode: "USD",
      rates,
      code: rates[preferred] ? preferred : "USD",
      loading: false,
      isStale: Boolean(rateData?.is_stale),
      rateDate: rateData?.rate_date || undefined,
    });
  })().catch(() => emit({ loading: false, isStale: true }));
  return loadPromise;
}

/** Clears rates after an admin setting change and reloads on the next hook mount. */
export function invalidateCurrencyCache() {
  loadPromise = null;
  emit({ rates: { USD: 1 }, baseCode: "USD", loading: true });
  if (typeof window !== "undefined") void loadCurrency();
}

export function setDisplayCurrency(code: string) {
  const normalized = code.toUpperCase();
  if (!state.rates[normalized]) return;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, normalized);
  emit({ code: normalized });
}

export function useCurrency() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    listeners.add(setSnapshot);
    void loadCurrency();
    return () => { listeners.delete(setSnapshot); };
  }, []);

  const convert = (amount: number | string | null | undefined, fromCurrency = "USD") => {
    const value = Number(amount ?? 0);
    const source = fromCurrency.toUpperCase();
    const sourceRate = snapshot.rates[source];
    const targetRate = snapshot.rates[snapshot.code];
    if (!Number.isFinite(value) || !sourceRate || !targetRate) return value;
    return (value / sourceRate) * targetRate;
  };

  const outputCode = (fromCurrency: string) => {
    const source = fromCurrency.toUpperCase();
    return snapshot.rates[source] && snapshot.rates[snapshot.code] ? snapshot.code : source;
  };

  return {
    ...snapshot,
    symbol: currencySymbol(snapshot.code),
    currencies: Object.keys(snapshot.rates).sort().map((currencyCode) => ({
      code: currencyCode,
      name: currencyCode,
      symbol: currencySymbol(currencyCode),
    })),
    setCode: setDisplayCurrency,
    convert,
    format: (amount: number | string | null | undefined, fromCurrency = "USD") => formatCurrency(convert(amount, fromCurrency), outputCode(fromCurrency)),
    formatCompact: (amount: number | string | null | undefined, fromCurrency = "USD") => formatCurrencyCompact(convert(amount, fromCurrency), outputCode(fromCurrency)),
  };
}

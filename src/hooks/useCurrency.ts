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
  /** True when the admin has set a site-wide currency (Settings → Booking
   * Defaults → Currency) — every visitor sees that currency and cannot
   * switch, rather than the old per-browser locale-detected preference. */
  forced: boolean;
};

const STORAGE_KEY = "tourvaa_display_currency";
const listeners = new Set<(state: CurrencyState) => void>();
let state: CurrencyState = { code: "USD", baseCode: "USD", rates: { USD: 1 }, loading: true, isStale: false, forced: false };
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
    // Leave `country` unset on the first call: the backend then geolocates
    // by request IP (cf-ipcountry / x-vercel-ip-country), which is what
    // should decide the default currency, not the browser's language
    // setting (an expat or a traveller with an English OS would otherwise
    // always get resolved to the "wrong" country). Locale is only used as a
    // last-resort fallback when no IP-derived country is available at all
    // (e.g. local dev with no CDN in front of the API).
    const [ratesResult, contextResult, settingsResult] = await Promise.allSettled([
      api.get("/currency/rates", { params: { base: "USD" } }),
      api.get("/currency/context"),
      api.get("/settings/public"),
    ]);
    const rateData = ratesResult.status === "fulfilled" ? ratesResult.value.data?.data : null;
    let contextData = contextResult.status === "fulfilled" ? contextResult.value.data?.data : null;
    if (!contextData?.country_code) {
      const localeFallback = localeCountry();
      if (localeFallback) {
        try {
          const fallbackResult = await api.get("/currency/context", { params: { country: localeFallback } });
          contextData = fallbackResult.data?.data ?? contextData;
        } catch {
          // keep the original (IP-less) contextData; format() below still
          // falls back to USD.
        }
      }
    }
    const publicSettings = settingsResult.status === "fulfilled" ? settingsResult.value.data?.data : null;
    const rates = rateData?.rates && typeof rateData.rates === "object" ? rateData.rates : { USD: 1 };

    // An admin-set site currency (Settings → Booking Defaults → Currency)
    // is a strict override: every visitor sees it, no per-browser choice.
    const siteCurrency = String(publicSettings?.currency || "").toUpperCase();
    if (siteCurrency && rates[siteCurrency]) {
      emit({
        baseCode: "USD",
        rates,
        code: siteCurrency,
        loading: false,
        isStale: Boolean(rateData?.is_stale),
        rateDate: rateData?.rate_date || undefined,
        forced: true,
      });
      return;
    }

    const detected = String(contextData?.currency || "USD").toUpperCase();
    const preferred = String(saved || detected || "USD").toUpperCase();
    emit({
      baseCode: "USD",
      rates,
      code: rates[preferred] ? preferred : "USD",
      loading: false,
      isStale: Boolean(rateData?.is_stale),
      rateDate: rateData?.rate_date || undefined,
      forced: false,
    });
  })().catch(() => emit({ loading: false, isStale: true }));
  return loadPromise;
}

/** Clears rates after an admin setting change and reloads on the next hook mount. */
export function invalidateCurrencyCache() {
  loadPromise = null;
  emit({ rates: { USD: 1 }, baseCode: "USD", loading: true, forced: false });
  if (typeof window !== "undefined") void loadCurrency();
}

export function setDisplayCurrency(code: string) {
  if (state.forced) return;
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
    const sourceRate = snapshot.rates[source];
    const targetRate = snapshot.rates[snapshot.code];
    return sourceRate && targetRate ? snapshot.code : source;
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
    /** Formats an amount that was actually settled/recorded in `currency`
     * (a captured payment, an invoice total, a payout) without running it
     * through FX conversion - converting a real historical transaction to
     * the viewer's ambient display currency would show a number that was
     * never actually charged/paid, and breaks reconciliation against
     * gateway settlement reports. Use `format` only for values that are
     * genuinely meant to be browsed/compared across currencies. */
    formatExact: (amount: number | string | null | undefined, currency = "USD") => formatCurrency(amount, currency.toUpperCase()),
  };
}

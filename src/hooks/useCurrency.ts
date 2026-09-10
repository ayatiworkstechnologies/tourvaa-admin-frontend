"use client";

import { useCallback, useEffect, useState } from "react";
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
  /** ISO2 country code (e.g. "IN") the visitor is browsing as - IP-detected
   * by default (see loadCurrency below), manually override-able via
   * setCountry, and persisted the same way as the display currency. This is
   * a browsing/display preference only: it never changes what a booking is
   * actually charged (see formatExact's docstring for that same rule on
   * currency). */
  countryCode: string;
};

const STORAGE_KEY = "tourvaa_display_currency";
const COUNTRY_STORAGE_KEY = "tourvaa_display_country";
const listeners = new Set<(state: CurrencyState) => void>();
let state: CurrencyState = { code: "USD", baseCode: "USD", rates: { USD: 1 }, loading: true, isStale: false, forced: false, countryCode: "" };
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
    const savedAtStart = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const savedCountryAtStart = typeof window !== "undefined" ? localStorage.getItem(COUNTRY_STORAGE_KEY) : null;
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

    const detectedCountry = String(contextData?.country_code || "").toUpperCase();
    const latestSavedCountry = typeof window !== "undefined" ? localStorage.getItem(COUNTRY_STORAGE_KEY) : null;
    const preferredCountry = String(latestSavedCountry || savedCountryAtStart || detectedCountry || "").toUpperCase();

    // An admin-set site currency is a strict override: every visitor sees it,
    // no per-browser choice. Gated on the separate "force_site_currency"
    // toggle, NOT merely on "currency" being non-blank - "currency" also
    // doubles as the default booking/tour currency and always has a value
    // (defaults to USD), so using its presence alone would force-lock the
    // selector for every site out of the box with no way to opt back out.
    const forceEnabled = String(publicSettings?.force_site_currency || "").toLowerCase() === "true";
    const siteCurrency = String(publicSettings?.currency || "").toUpperCase();
    if (forceEnabled && siteCurrency && rates[siteCurrency]) {
      emit({
        baseCode: "USD",
        rates,
        code: siteCurrency,
        loading: false,
        isStale: Boolean(rateData?.is_stale),
        rateDate: rateData?.rate_date || undefined,
        forced: true,
        countryCode: preferredCountry,
      });
      return;
    }

    const detected = String(contextData?.currency || "USD").toUpperCase();
    // Re-read storage after the requests finish. The selector is usable while
    // rates load, so the visitor may have chosen a currency after this load
    // began; using only the value captured above would overwrite that choice.
    const latestSaved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const preferred = String(latestSaved || savedAtStart || detected || "USD").toUpperCase();
    emit({
      baseCode: "USD",
      rates,
      code: rates[preferred] ? preferred : "USD",
      loading: false,
      isStale: Boolean(rateData?.is_stale),
      rateDate: rateData?.rate_date || undefined,
      countryCode: preferredCountry,
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
  // Before the rates request resolves, the selector displays its supported
  // fallback currencies. Preserve a click made during that window; the
  // completed load will validate it against the returned rates and emit it.
  if (!state.rates[normalized] && !state.loading) return;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, normalized);
  if (state.rates[normalized]) emit({ code: normalized });
}

/** Manually overrides the browsing country - persisted the same way as
 * currency, and (unless an admin has forced a single site-wide currency)
 * also re-derives the suggested currency for that country, matching the
 * same "currency follows country" auto-detection logic used on first
 * load. A visitor who then picks a different currency via setDisplayCurrency
 * still wins - this only sets the country-implied suggestion. */
export async function setDisplayCountry(code: string) {
  const normalized = code.toUpperCase();
  if (typeof window !== "undefined") localStorage.setItem(COUNTRY_STORAGE_KEY, normalized);
  emit({ countryCode: normalized });
  if (state.forced) return;
  try {
    const res = await api.get("/currency/context", { params: { country: normalized } });
    const nextCurrency = String(res.data?.data?.currency || "").toUpperCase();
    if (nextCurrency && state.rates[nextCurrency]) {
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, nextCurrency);
      emit({ code: nextCurrency });
    }
  } catch {
    // Keep the existing currency selection if the lookup fails.
  }
}

export function useCurrency() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    listeners.add(setSnapshot);
    void loadCurrency();
    const syncStoredCurrency = (event: StorageEvent) => {
      if (event.newValue == null) return;
      if (event.key === STORAGE_KEY && !state.forced) {
        const normalized = event.newValue.toUpperCase();
        if (state.rates[normalized]) emit({ code: normalized });
      } else if (event.key === COUNTRY_STORAGE_KEY) {
        emit({ countryCode: event.newValue.toUpperCase() });
      }
    };
    window.addEventListener("storage", syncStoredCurrency);
    return () => {
      listeners.delete(setSnapshot);
      window.removeEventListener("storage", syncStoredCurrency);
    };
  }, []);

  // Memoized on the actual rate/code data (not recreated every render) --
  // several pages pass these into a useEffect's dependency array (e.g. to
  // reformat fetched prices), and an unmemoized function there is a new
  // reference every render, which re-triggers that effect every render in
  // an infinite fetch loop.
  const convert = useCallback((amount: number | string | null | undefined, fromCurrency = "USD") => {
    const value = Number(amount ?? 0);
    const source = fromCurrency.toUpperCase();
    const sourceRate = snapshot.rates[source];
    const targetRate = snapshot.rates[snapshot.code];
    if (!Number.isFinite(value) || !sourceRate || !targetRate) return value;
    return (value / sourceRate) * targetRate;
  }, [snapshot.rates, snapshot.code]);

  const outputCode = useCallback((fromCurrency: string) => {
    const source = fromCurrency.toUpperCase();
    const sourceRate = snapshot.rates[source];
    const targetRate = snapshot.rates[snapshot.code];
    return sourceRate && targetRate ? snapshot.code : source;
  }, [snapshot.rates, snapshot.code]);

  const format = useCallback(
    (amount: number | string | null | undefined, fromCurrency = "USD") => formatCurrency(convert(amount, fromCurrency), outputCode(fromCurrency)),
    [convert, outputCode],
  );
  const formatCompact = useCallback(
    (amount: number | string | null | undefined, fromCurrency = "USD") => formatCurrencyCompact(convert(amount, fromCurrency), outputCode(fromCurrency)),
    [convert, outputCode],
  );
  /** Formats an amount that was actually settled/recorded in `currency`
   * (a captured payment, an invoice total, a payout) without running it
   * through FX conversion - converting a real historical transaction to
   * the viewer's ambient display currency would show a number that was
   * never actually charged/paid, and breaks reconciliation against
   * gateway settlement reports. Use `format` only for values that are
   * genuinely meant to be browsed/compared across currencies. */
  const formatExact = useCallback(
    (amount: number | string | null | undefined, currency = "USD") => formatCurrency(amount, currency.toUpperCase()),
    [],
  );

  return {
    ...snapshot,
    symbol: currencySymbol(snapshot.code),
    currencies: Object.keys(snapshot.rates).sort().map((currencyCode) => ({
      code: currencyCode,
      name: currencyCode,
      symbol: currencySymbol(currencyCode),
    })),
    setCode: setDisplayCurrency,
    setCountry: setDisplayCountry,
    convert,
    format,
    formatCompact,
    formatExact,
  };
}

export type CurrencyListItem = { code: string; name: string; symbol: string };

/** Offline continuity only, used until the DB-backed /currencies list loads
 * (or if that request fails) - see loadCurrencyList()/getCurrencyList() below. */
export const FALLBACK_CURRENCY_LIST: CurrencyListItem[] = [
  ["USD", "US Dollar"], ["EUR", "Euro"], ["GBP", "British Pound"],
  ["AED", "UAE Dirham"], ["INR", "Indian Rupee"], ["AUD", "Australian Dollar"],
  ["CAD", "Canadian Dollar"], ["NZD", "New Zealand Dollar"], ["SGD", "Singapore Dollar"],
  ["JPY", "Japanese Yen"], ["CNY", "Chinese Yuan"], ["HKD", "Hong Kong Dollar"],
  ["SAR", "Saudi Riyal"], ["QAR", "Qatari Riyal"], ["CHF", "Swiss Franc"],
  ["THB", "Thai Baht"], ["MYR", "Malaysian Ringgit"], ["IDR", "Indonesian Rupiah"],
  ["KRW", "South Korean Won"], ["ZAR", "South African Rand"],
].map(([code, name]) => ({ code, name, symbol: currencySymbol(code) }));

let currencyList: CurrencyListItem[] = FALLBACK_CURRENCY_LIST;
let loadPromise: Promise<CurrencyListItem[]> | null = null;

/** Fetches the DB-backed currency master list (name/code/symbol) once and
 * caches it for the lifetime of the page. Falls back to FALLBACK_CURRENCY_LIST
 * on any failure so callers always get a usable list. */
export function loadCurrencyList(): Promise<CurrencyListItem[]> {
  if (loadPromise) return loadPromise;
  loadPromise = import("@/lib/api/client")
    .then(({ default: api }) => api.get("/currencies", { params: { limit: 200 } }))
    .then((res) => {
      const items = res.data?.items || res.data?.data?.items || [];
      const list: CurrencyListItem[] = items
        .filter((item: { status?: string }) => !item.status || item.status === "active")
        .map((item: { code: string; name: string; symbol: string }) => ({ code: item.code, name: item.name, symbol: item.symbol }));
      currencyList = list.length > 0 ? list : FALLBACK_CURRENCY_LIST;
      return currencyList;
    })
    .catch(() => {
      currencyList = FALLBACK_CURRENCY_LIST;
      return currencyList;
    });
  return loadPromise;
}

/** Synchronous read of whatever the currency list currently is - the
 * fallback array until loadCurrencyList() resolves, then the DB-backed one. */
export function getCurrencyList(): CurrencyListItem[] {
  return currencyList;
}

/** Call after an admin creates/edits/disables a currency so every open
 * CurrencySelect refetches the master list instead of showing stale data. */
export function invalidateCurrencyList(): void {
  loadPromise = null;
}

/** @deprecated Use getCurrencyList()/loadCurrencyList() so every consumer
 * reads the same DB-backed source. Kept only for any lingering static import. */
export const CURRENCY_LIST = FALLBACK_CURRENCY_LIST;

export function currencySymbol(code: string): string {
  const normalized = (code || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: normalized, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value || normalized;
  } catch {
    return normalized;
  }
}
export function formatCurrency(amount: number | string | null | undefined, code: string): string {
  const num = Number(amount ?? 0);
  const normalized = (code || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalized,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${normalized} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatCurrencyCompact(amount: number | string | null | undefined, code: string): string {
  const num = Number(amount ?? 0);
  const normalized = (code || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalized,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `${normalized} ${num.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
}

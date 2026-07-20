/** Common ISO 4217 currencies exposed by the site selector. */
export const CURRENCY_LIST = [
  ["USD", "US Dollar"], ["EUR", "Euro"], ["GBP", "British Pound"],
  ["AED", "UAE Dirham"], ["INR", "Indian Rupee"], ["AUD", "Australian Dollar"],
  ["CAD", "Canadian Dollar"], ["NZD", "New Zealand Dollar"], ["SGD", "Singapore Dollar"],
  ["JPY", "Japanese Yen"], ["CNY", "Chinese Yuan"], ["HKD", "Hong Kong Dollar"],
  ["SAR", "Saudi Riyal"], ["QAR", "Qatari Riyal"], ["CHF", "Swiss Franc"],
  ["THB", "Thai Baht"], ["MYR", "Malaysian Ringgit"], ["IDR", "Indonesian Rupiah"],
  ["KRW", "South Korean Won"], ["ZAR", "South African Rand"],
].map(([code, name]) => ({ code, name, symbol: currencySymbol(code) }));

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

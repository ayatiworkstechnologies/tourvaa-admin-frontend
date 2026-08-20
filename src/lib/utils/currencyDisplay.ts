// ISO 4217 currency code -> ISO 3166-1 alpha-2 country code. For the vast
// majority of currencies the first two letters already match the issuing
// country (USD -> US, INR -> IN), so only the exceptions - shared/regional
// currencies, and codes whose prefix doesn't resolve to a real country -
// need an explicit override here.
const CURRENCY_COUNTRY_OVERRIDES: Record<string, string> = {
  EUR: "EU",
  XCD: "AG", // East Caribbean dollar - represented by Antigua & Barbuda
  XOF: "SN", // West African CFA franc - represented by Senegal
  XAF: "CM", // Central African CFA franc - represented by Cameroon
  XPF: "PF", // CFP franc - represented by French Polynesia
  ANG: "CW", // Netherlands Antillean guilder - represented by Curaçao
  CUC: "CU",
  GBP: "GB",
  ILS: "IL",
  KHR: "KH",
  LAK: "LA",
  MMK: "MM",
  XDR: "UN",
};

function flagFromCountryCode(countryCode: string): string | null {
  if (countryCode === "UN" || countryCode.length !== 2) return null;
  const codePoints = [...countryCode.toUpperCase()].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/** Best-effort flag emoji for an ISO 4217 currency code. Falls back to a
 * globe glyph for supranational/basket currencies with no single flag. */
export function currencyFlag(code: string): string {
  const country = CURRENCY_COUNTRY_OVERRIDES[code] ?? code.slice(0, 2);
  return flagFromCountryCode(country) ?? "🌐";
}

/** Currency symbol via Intl, which already knows every ISO 4217 code -
 * avoids maintaining our own {code: symbol} table. */
export function currencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat("en", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

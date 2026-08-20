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

/** Best-effort ISO 3166-1 alpha-2 country code for an ISO 4217 currency
 * code, lowercased to match the `flag-icons` package's CSS class names
 * (`fi-us`, `fi-in`, ...). Flag *emoji* were tried first but Windows
 * Chrome/Edge has no flag glyphs in its default fonts and just renders the
 * raw two-letter regional-indicator text instead of a flag - `flag-icons`
 * ships actual SVGs so it renders consistently everywhere. Returns null for
 * supranational/basket currencies with no single representative flag. */
export function currencyCountryCode(code: string): string | null {
  const country = CURRENCY_COUNTRY_OVERRIDES[code] ?? code.slice(0, 2);
  return country === "UN" || country.length !== 2 ? null : country.toLowerCase();
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

import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js/min";

export type PhoneCountry = { iso: CountryCode; name: string; dialCode: string };

// Codes shared by more than one country (e.g. +1 for US/Canada/many Caribbean
// nations) are ambiguous when reverse-mapping a stored "+<code><digits>"
// value back to a single country - this picks the most likely one, matching
// the India/US-leaning bias the old splitPhone() default already had.
const AMBIGUOUS_DIAL_CODE_DEFAULTS: Record<string, CountryCode> = {
  "1": "US",
  "7": "RU",
  "44": "GB",
  "212": "MA",
};

let regionNames: Intl.DisplayNames | null = null;
function countryName(iso: CountryCode): string {
  if (!regionNames) {
    try {
      regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      regionNames = null;
    }
  }
  return regionNames?.of(iso) || iso;
}

// dialCode is stored with a leading "+" to match this app's existing
// convention (combinePhone/mobilePattern/stored values all expect
// "+<code><digits>") - getCountryCallingCode() itself returns just "91".
export const PHONE_COUNTRIES: PhoneCountry[] = getCountries()
  .map((iso) => ({ iso, name: countryName(iso), dialCode: `+${getCountryCallingCode(iso)}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

const BY_ISO = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));
// Keyed by the raw digits of the dial code (no "+") so isoForDialCode can
// match against a digits-only prefix of the stored number.
const BY_DIAL_CODE = new Map<string, PhoneCountry[]>();
for (const country of PHONE_COUNTRIES) {
  const rawCode = country.dialCode.replace("+", "");
  const list = BY_DIAL_CODE.get(rawCode) ?? [];
  list.push(country);
  BY_DIAL_CODE.set(rawCode, list);
}

export function dialCodeForIso(iso: CountryCode): string {
  return BY_ISO.get(iso)?.dialCode ?? "";
}

export function countryForIso(iso: CountryCode): PhoneCountry | undefined {
  return BY_ISO.get(iso);
}

/** Reverse lookup for loading a legacy stored "+<dialcode><digits>" value
 * back into a country selection - tries the longest matching dial code
 * first (some codes are prefixes of others, e.g. +1 vs +1xxx isn't a
 * concern here but +212/+2 style overlaps exist elsewhere in the plan). */
export function isoForDialCode(fullNumber: string): CountryCode {
  const digits = fullNumber.replace(/^\+/, "").replace(/\D/g, "");
  const candidates = Array.from(BY_DIAL_CODE.keys()).sort((a, b) => b.length - a.length);
  for (const code of candidates) {
    if (digits.startsWith(code)) {
      const matches = BY_DIAL_CODE.get(code) ?? [];
      if (matches.length === 1) return matches[0].iso;
      const preferred = AMBIGUOUS_DIAL_CODE_DEFAULTS[code];
      if (preferred && matches.some((m) => m.iso === preferred)) return preferred;
      return matches[0]?.iso ?? "IN";
    }
  }
  return "IN";
}

export function formatAsYouType(iso: CountryCode, nationalDigits: string): string {
  try {
    return new AsYouType(iso).input(nationalDigits);
  } catch {
    return nationalDigits;
  }
}

export function validatePhoneForCountry(iso: CountryCode, nationalDigits: string): boolean {
  if (!nationalDigits) return false;
  try {
    return isValidPhoneNumber(nationalDigits, iso);
  } catch {
    return false;
  }
}

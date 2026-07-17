export const emailPattern = /^\S+@\S+\.\S+$/;
export const slugPattern = /^[a-z0-9-]+$/;
export const mobilePattern = /^\+[1-9]\d{7,19}$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string) {
  return emailPattern.test(normalizeEmail(value));
}

export function validateSlug(value: string) {
  return slugPattern.test(value.trim());
}

export function validatePassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export function validateMobile(value: string, required = false) {
  const trimmed = value.trim();
  if (!trimmed) return !required;
  return mobilePattern.test(trimmed);
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function combinePhone(countryCode: string, number: string) {
  return `${countryCode}${digitsOnly(number)}`;
}

export function splitPhone(value: string, countryCodes: string[] = []) {
  const normalized = value.trim();
  const matchedCode = countryCodes
    .sort((a, b) => b.length - a.length)
    .find((code) => normalized.startsWith(code));

  if (!matchedCode) {
    return { countryCode: "+91", number: digitsOnly(normalized.replace(/^\+/, "")) };
  }

  return {
    countryCode: matchedCode,
    number: digitsOnly(normalized.slice(matchedCode.length)),
  };
}

export const passwordHelp = "Use at least 8 characters with uppercase, lowercase, a number, and a special character.";
export const mobileHelp = "Select country code and enter numbers only, for example +919876543210.";

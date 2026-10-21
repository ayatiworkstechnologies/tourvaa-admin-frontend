import { describe, expect, it } from "vitest";

import { phoneValidationError, validatePhoneForCountry } from "@/lib/utils/phoneCountries";

describe("country-aware mobile validation", () => {
  it("rejects short Indian mobile numbers with a specific message", () => {
    expect(validatePhoneForCountry("IN", "6789")).toBe(false);
    expect(phoneValidationError("IN", "6789")).toBe(
      "Indian mobile numbers must contain exactly 10 digits.",
    );
  });

  it("rejects Indian landline-style prefixes", () => {
    expect(validatePhoneForCountry("IN", "1234567890")).toBe(false);
    expect(phoneValidationError("IN", "1234567890")).toBe(
      "Indian mobile numbers must start with 6, 7, 8, or 9.",
    );
  });

  it("accepts a valid Indian mobile number", () => {
    expect(validatePhoneForCountry("IN", "6789012345")).toBe(true);
    expect(phoneValidationError("IN", "6789012345")).toBeNull();
  });

  it("validates other countries using their numbering plan", () => {
    expect(validatePhoneForCountry("AU", "0412345678")).toBe(true);
    expect(validatePhoneForCountry("AU", "6789")).toBe(false);
  });
});

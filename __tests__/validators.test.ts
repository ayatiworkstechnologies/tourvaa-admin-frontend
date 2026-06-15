import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  validateEmail,
  validateMobile,
  validatePassword,
  validateSlug,
} from "@/lib/validators";

describe("validators", () => {
  it("normalizes and validates email", () => {
    expect(normalizeEmail(" USER@Example.COM ")).toBe("user@example.com");
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("bad-email")).toBe(false);
  });

  it("validates slugs and password strength", () => {
    expect(validateSlug("user-roles-1")).toBe(true);
    expect(validateSlug("User Roles")).toBe(false);
    expect(validatePassword("Password1")).toBe(true);
    expect(validatePassword("password")).toBe(false);
  });

  it("validates mobile numbers", () => {
    expect(validateMobile("+919876543210")).toBe(true);
    expect(validateMobile("9876543210")).toBe(false);
    expect(validateMobile("+91 98765 43210")).toBe(false);
    expect(validateMobile("98765")).toBe(false);
    expect(validateMobile("", false)).toBe(true);
    expect(validateMobile("", true)).toBe(false);
  });
});

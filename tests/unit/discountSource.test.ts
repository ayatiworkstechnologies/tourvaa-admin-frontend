import { describe, expect, it } from "vitest";
import { isTourvaaDiscount } from "@/lib/tours/discountSource";
import type { TourDiscount } from "@/lib/api/services/tourDetailService";

const discount = (overrides: Partial<TourDiscount>): TourDiscount => ({
  discount_name: "Offer",
  discount_type: "percentage",
  discount_value: 10,
  discount_scope: "tour",
  minimum_booking_amount: 0,
  status: "active",
  ...overrides,
});

describe("discount pricing source", () => {
  it("uses immutable creator history ahead of a stale funded_by value", () => {
    expect(isTourvaaDiscount(discount({ added_by: "admin", funded_by: "SUPPLIER" }))).toBe(true);
    expect(isTourvaaDiscount(discount({ added_by: "supplier", funded_by: "TOURVAA" }))).toBe(false);
  });

  it("falls back to funded_by for rows without creator history", () => {
    expect(isTourvaaDiscount(discount({ funded_by: "TOURVAA" }))).toBe(true);
    expect(isTourvaaDiscount(discount({ funded_by: "SUPPLIER" }))).toBe(false);
  });
});

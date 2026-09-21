import { describe, expect, it } from "vitest";
import {
  validateActivity, validateDiscount, validateExtension, validateHighlight, validateInclusion,
  validateItineraryDay, validatePricingSlab, validateRefundRule,
} from "@/lib/tours/tourValidation";

describe("tour item validation (mirrors backend payload rules)", () => {
  it("highlight and inclusion need a title", () => {
    expect(validateHighlight({ title: "  " }).title).toBeTruthy();
    expect(validateHighlight({ title: "Dhow cruise" })).toEqual({});
    expect(validateInclusion({ title: "" }, "Inclusion").title).toContain("Inclusion");
  });

  it("itinerary day: number, title, times, duplicates and tour length", () => {
    expect(validateItineraryDay({ day_number: 0, day_title: "x" }).day_number).toBeTruthy();
    expect(validateItineraryDay({ day_number: 3, day_title: "" }, { tourDays: 5 }).day_title).toBeTruthy();
    expect(validateItineraryDay({ day_number: 2, day_title: "Souq" }, { existingDayNumbers: [1, 2] }).day_number).toContain("already exists");
    expect(validateItineraryDay({ day_number: 6, day_title: "Souq" }, { tourDays: 5 }).day_number).toContain("5 days long");
    expect(validateItineraryDay({ day_number: 1, day_title: "A", start_time: "10:00", end_time: "09:00" }).end_time).toContain("after the start");
    expect(validateItineraryDay({ day_number: 1, day_title: "A", start_time: "25:00" }).start_time).toBeTruthy();
    expect(validateItineraryDay({ day_number: 1, day_title: "A", start_time: "09:00", end_time: "17:30" }, { tourDays: 5 })).toEqual({});
  });

  it("pricing slab: from/to, adult price above zero, commission range", () => {
    expect(validatePricingSlab({ passenger_from: 0, passenger_to: 4, adult_price: 10 }).passenger_from).toBeTruthy();
    expect(validatePricingSlab({ passenger_from: 5, passenger_to: 2, adult_price: 10 }).passenger_to).toContain("less than the minimum");
    expect(validatePricingSlab({ passenger_from: 1, passenger_to: 2, adult_price: 0 }).adult_price).toContain("greater than 0");
    expect(validatePricingSlab({ passenger_from: 1, passenger_to: 2, adult_price: 10, child_price: -1 }).child_price).toContain("negative");
    expect(validatePricingSlab({ passenger_from: 1, passenger_to: 2, adult_price: 10, child_price: 0 })).toEqual({});
  });

  it("activity, extension: name/tour required and prices not negative", () => {
    expect(validateActivity({ activity_name: "", price_per_person: 5 }).activity_name).toBeTruthy();
    expect(validateActivity({ activity_name: "Safari", price_per_person: "" }).price_per_person).toBeTruthy();
    expect(validateActivity({ activity_name: "Safari", price_per_person: 0 })).toEqual({});
    expect(validateExtension({ extension_tour_id: 0 }).extension_tour_id).toBeTruthy();
    expect(validateExtension({ extension_tour_id: 4, extra_price: -2 }).extra_price).toContain("negative");
  });

  it("discount: percentage capped at 100, code format, date order, usage limit", () => {
    expect(validateDiscount({ discount_name: "x", discount_type: "percentage", discount_value: 120 }).discount_value).toContain("100%");
    expect(validateDiscount({ discount_name: "x", discount_type: "fixed", discount_value: 120 })).toEqual({});
    expect(validateDiscount({ discount_name: "x", discount_type: "fixed", discount_value: 0 }).discount_value).toBeTruthy();
    expect(validateDiscount({ discount_name: "x", discount_type: "fixed", discount_value: 5, discount_code: "bad code" }).discount_code).toBeTruthy();
    expect(validateDiscount({ discount_name: "x", discount_type: "fixed", discount_value: 5, start_date: "2026-10-10", end_date: "2026-10-01" }).end_date).toBeTruthy();
    expect(validateDiscount({ discount_name: "x", discount_type: "fixed", discount_value: 5, usage_limit: 0 }).usage_limit).toBeTruthy();
  });

  it("cancellation rule: days and refund percentage", () => {
    expect(validateRefundRule({ days_before_tour_min: "", refund_percentage: 50 }).days_before_tour_min).toBeTruthy();
    expect(validateRefundRule({ days_before_tour_min: 7, days_before_tour_max: 3, refund_percentage: 50 }).days_before_tour_max).toBeTruthy();
    expect(validateRefundRule({ days_before_tour_min: 0, refund_percentage: 101 }).refund_percentage).toBeTruthy();
    expect(validateRefundRule({ days_before_tour_min: "0", refund_percentage: "0" })).toEqual({});
  });
});

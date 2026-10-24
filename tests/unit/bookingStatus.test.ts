import { describe, expect, it } from "vitest";
import {
  bookingStatusLabel,
  bookingStatusTransitions,
  canTransitionBookingStatus,
} from "@/lib/constants/bookingStatus";

describe("booking status labels", () => {
  it("uses the agreed booking vocabulary across every portal", () => {
    expect(bookingStatusLabel("pending_supplier_acceptance", "customer")).toBe("Booking Request Received");
    expect(bookingStatusLabel("pending_supplier_acceptance", "supplier")).toBe("Booking Request Received");
    expect(bookingStatusLabel("pending_supplier_acceptance", "admin")).toBe("Booking Request Received");
    expect(bookingStatusLabel("confirmed", "customer")).toBe("Booking Confirmed");
    expect(bookingStatusLabel("ongoing", "customer")).toBe("Ongoing");
    expect(bookingStatusLabel("completed", "customer")).toBe("Completed");
    expect(bookingStatusLabel("cancelled", "customer", "customer_request")).toBe("Cancelled by Customer");
    expect(bookingStatusLabel("cancelled", "customer", "admin")).toBe("Cancelled by Tourvaa");
  });

  it("covers every persisted booking lifecycle state with professional copy", () => {
    const states = [
      "draft", "pending_payment", "pending_credit_approval", "pending_supplier_assignment",
      "payment_authorized", "pending_supplier_acceptance", "supplier_reassignment_required",
      "supplier_accepted", "confirmed", "ready_to_travel", "upcoming", "ongoing",
      "postponed", "cancellation_requested", "cancelled", "declined", "completed", "refunded",
    ];
    for (const state of states) {
      expect(bookingStatusLabel(state, "customer")).not.toMatch(/_/);
      expect(bookingStatusLabel(state, "agent")).not.toMatch(/_/);
      expect(bookingStatusLabel(state, "supplier")).not.toMatch(/_/);
      expect(bookingStatusLabel(state, "admin")).not.toMatch(/_/);
    }
  });
});

describe("booking status actions", () => {
  it("does not expose actions for terminal bookings", () => {
    expect(bookingStatusTransitions("completed")).toEqual([]);
    expect(canTransitionBookingStatus("completed", "confirmed")).toBe(false);
    expect(canTransitionBookingStatus("completed", "cancelled")).toBe(false);
    expect(bookingStatusTransitions("refunded")).toEqual([]);
  });

  it("only exposes actions allowed by the lifecycle", () => {
    expect(canTransitionBookingStatus("supplier_accepted", "confirmed")).toBe(true);
    expect(canTransitionBookingStatus("confirmed", "confirmed")).toBe(false);
    expect(canTransitionBookingStatus("confirmed", "cancelled")).toBe(true);
  });
});

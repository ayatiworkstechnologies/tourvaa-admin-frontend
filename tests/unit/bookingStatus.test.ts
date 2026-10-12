import { describe, expect, it } from "vitest";
import { bookingStatusLabel } from "@/lib/constants/bookingStatus";

describe("portal-aware booking status labels", () => {
  it("keeps a received request distinct from supplier confirmation", () => {
    expect(bookingStatusLabel("pending_supplier_acceptance", "customer")).toBe("Awaiting Tourvaa Confirmation");
    expect(bookingStatusLabel("pending_supplier_acceptance", "supplier")).toBe("Awaiting Your Decision");
    expect(bookingStatusLabel("pending_supplier_acceptance", "admin")).toBe("Awaiting Supplier Acceptance");
    expect(bookingStatusLabel("confirmed", "customer")).toBe("Booking Confirmed");
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

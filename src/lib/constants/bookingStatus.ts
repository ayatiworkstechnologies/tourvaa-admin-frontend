const CONFIRMED_STATUSES = new Set(["confirmed", "ready_to_travel", "upcoming", "postponed"]);

// Keep this map aligned with BOOKING_STATUS_TRANSITIONS in the backend. UI
// actions must be derived from valid transitions, not from a partial deny-list.
export const BOOKING_STATUS_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  draft: ["pending_payment", "pending_supplier_assignment", "cancelled"],
  pending_payment: ["payment_authorized", "pending_supplier_assignment", "pending_supplier_acceptance", "cancellation_requested", "cancelled", "declined"],
  pending_supplier_assignment: ["pending_payment", "payment_authorized", "pending_supplier_acceptance", "supplier_reassignment_required", "cancellation_requested", "cancelled", "declined"],
  payment_authorized: ["pending_supplier_assignment", "pending_supplier_acceptance", "cancellation_requested", "cancelled", "declined"],
  pending_supplier_acceptance: ["pending_supplier_assignment", "supplier_accepted", "supplier_reassignment_required", "postponed", "cancellation_requested", "cancelled", "declined"],
  supplier_accepted: ["confirmed", "supplier_reassignment_required", "cancellation_requested", "cancelled", "declined"],
  supplier_reassignment_required: ["pending_supplier_assignment", "pending_supplier_acceptance", "cancellation_requested", "cancelled", "declined"],
  confirmed: ["ready_to_travel", "ongoing", "completed", "postponed", "supplier_reassignment_required", "cancellation_requested", "cancelled"],
  ready_to_travel: ["ongoing", "completed", "postponed", "cancellation_requested", "cancelled"],
  upcoming: ["confirmed", "ready_to_travel", "ongoing", "completed", "postponed", "cancellation_requested", "cancelled"],
  ongoing: ["completed", "postponed", "supplier_reassignment_required", "cancellation_requested", "cancelled"],
  postponed: ["confirmed", "ready_to_travel", "ongoing", "completed", "cancellation_requested", "cancelled"],
  cancellation_requested: ["pending_payment", "payment_authorized", "pending_supplier_acceptance", "confirmed", "ready_to_travel", "ongoing", "postponed", "cancelled"],
  cancelled: ["refunded"],
  declined: ["pending_supplier_assignment", "supplier_reassignment_required", "refunded"],
  completed: [],
  refunded: [],
};

export function bookingStatusTransitions(status?: string | null): readonly string[] {
  return BOOKING_STATUS_TRANSITIONS[(status || "").trim().toLowerCase()] ?? [];
}

export function canTransitionBookingStatus(status: string | null | undefined, target: string): boolean {
  return bookingStatusTransitions(status).includes(target.trim().toLowerCase());
}

export type BookingPortal = "customer" | "agent" | "supplier" | "admin";

export const BOOKING_AWAITING_CONFIRMATION_LABEL = "Booking Successful - Awaiting Tourvaa Confirmation";

/**
 * A booking state is operational data, not customer-facing copy. Keep one
 * vocabulary here so each portal shows the right amount of detail without
 * leaking supplier/payment workflow terminology to travellers.
 */
export function bookingStatusLabel(status?: string | null, portal: BookingPortal = "admin"): string {
  const value = (status || "").trim().toLowerCase();
  const bookingParty = portal === "customer" || portal === "agent";

  if (value === "draft") return portal === "admin" ? "Draft" : "Payment Required";
  if (value === "pending_payment") return bookingParty ? "Payment Required" : "Awaiting Payment";
  if (value === "pending_supplier_assignment") return bookingParty ? BOOKING_AWAITING_CONFIRMATION_LABEL : "Awaiting Supplier Assignment";
  if (value === "payment_authorized") return bookingParty ? BOOKING_AWAITING_CONFIRMATION_LABEL : "Payment Authorized";
  if (value === "pending_supplier_acceptance") {
    if (portal === "supplier") return "Awaiting Your Decision";
    return bookingParty ? BOOKING_AWAITING_CONFIRMATION_LABEL : "Awaiting Supplier Acceptance";
  }
  if (value === "supplier_accepted") {
    if (portal === "supplier") return "Acceptance Recorded";
    return bookingParty ? "Booking Accepted — Awaiting Tourvaa Confirmation" : "Supplier Accepted";
  }
  if (value === "supplier_reassignment_required") return bookingParty ? "Supplier Reassignment in Progress" : "Supplier Reassignment Required";
  if (CONFIRMED_STATUSES.has(value)) return bookingParty ? "Booking Confirmed" : value === "postponed" ? "Travel Date Updated" : "Booking Confirmed";
  if (value === "ongoing") return portal === "customer" ? "Tour In Progress" : "Tour In Progress";
  if (value === "completed") return "Tour Completed";
  if (value === "cancellation_requested") return "Cancellation Requested";
  if (value === "declined") return portal === "supplier" ? "Booking Declined" : "Booking Cancelled";
  if (value === "cancelled") return "Booking Cancelled";
  if (value === "refunded") return "Refund Completed";
  if (value === "partially_refunded") return "Partially Refunded";
  if (value === "paid") return "Paid";
  if (value === "partially_paid") return "Partially Paid";
  if (value === "unpaid") return "Unpaid";
  if (value === "failed") return "Payment Failed";
  if (value === "authorized") return "Authorized";
  if (value === "not_assigned") return "Not Assigned";
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Status Unavailable";
}

export function agentBookingStatusLabel(status?: string): string {
  return bookingStatusLabel(status, "agent");
}

export const BOOKING_AWAITING_CONFIRMATION_MESSAGE =
  "Your booking and payment have been successfully submitted. Please wait for Tourvaa to confirm your booking. We will notify you once it is confirmed.";

export const BOOKING_PAYMENT_REQUIRED_MESSAGE =
  "Your booking has been created. Please complete your payment to proceed with the booking confirmation process.";

export const BOOKING_PAYMENT_RECEIVED_MESSAGE =
  "Your booking and payment have been successfully submitted. Please wait for Tourvaa to confirm your booking. We will notify you once it is confirmed.";

export const BOOKING_PAYMENT_AUTHORIZED_MESSAGE =
  "Your payment has been authorized and is not charged yet. We will capture it only after the supplier accepts your tour; otherwise the hold is released within four days.";

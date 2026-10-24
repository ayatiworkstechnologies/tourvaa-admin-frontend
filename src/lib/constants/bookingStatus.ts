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

export const BOOKING_AWAITING_CONFIRMATION_LABEL = "Booking Request Received";

/**
 * A booking state is operational data, not customer-facing copy. Keep one
 * vocabulary here so each portal shows the right amount of detail without
 * leaking supplier/payment workflow terminology to travellers.
 */
export function bookingStatusLabel(status?: string | null, portal: BookingPortal = "admin", cancellationSource?: string | null): string {
  void portal;
  const source = (cancellationSource || "").trim().toLowerCase();
  const value = (status || "").trim().toLowerCase();

  if (["draft", "pending_payment", "pending_supplier_assignment", "payment_authorized", "pending_supplier_acceptance", "supplier_accepted", "supplier_reassignment_required", "cancellation_requested"].includes(value)) return "Booking Request Received";
  if (CONFIRMED_STATUSES.has(value)) return "Booking Confirmed";
  if (value === "ongoing") return "Ongoing";
  if (value === "completed") return "Completed";
  if (value === "cancelled") return ["customer_request", "customer_unpaid_removed"].includes(source) ? "Cancelled by Customer" : "Cancelled by Tourvaa";
  if (["declined", "refunded", "partially_refunded"].includes(value)) return "Cancelled by Tourvaa";
  if (value === "paid") return "Paid";
  if (value === "partially_paid") return "Partially Paid";
  if (value === "unpaid") return "Unpaid";
  if (value === "failed") return "Payment Failed";
  if (value === "authorized") return "Authorized";
  if (value === "not_assigned") return "Not Assigned";
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Status Unavailable";
}

export function agentBookingStatusLabel(status?: string, cancellationSource?: string | null): string {
  return bookingStatusLabel(status, "agent", cancellationSource);
}

export const BOOKING_AWAITING_CONFIRMATION_MESSAGE = "Booking Request Received";

export const BOOKING_PAYMENT_REQUIRED_MESSAGE =
  "Your booking has been created. Please complete your payment to proceed with the booking confirmation process.";

export const BOOKING_PAYMENT_RECEIVED_MESSAGE =
  "Your booking and payment have been successfully submitted. Please wait for Tourvaa to confirm your booking. We will notify you once it is confirmed.";

export const BOOKING_PAYMENT_AUTHORIZED_MESSAGE =
  "Your payment authorization covers this booking. Tourvaa will capture it once the booking request is confirmed.";

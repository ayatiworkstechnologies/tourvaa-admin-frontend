const CONFIRMED_STATUSES = new Set(["confirmed", "ready_to_travel", "upcoming", "postponed"]);

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
  if (value === "pending_credit_approval" || value === "credit_approval_pending") return bookingParty ? "Credit Approval in Progress" : "Credit Approval Pending";
  if (value === "bank_transfer_pending") return bookingParty ? "Bank Transfer Pending" : "Awaiting Bank Transfer";
  if (value === "pending_supplier_assignment") return bookingParty ? BOOKING_AWAITING_CONFIRMATION_LABEL : "Awaiting Supplier Assignment";
  if (value === "payment_authorized") return bookingParty ? BOOKING_AWAITING_CONFIRMATION_LABEL : "Payment Authorized";
  if (value === "pending_supplier_acceptance") {
    if (portal === "supplier") return "Awaiting Your Decision";
    return bookingParty ? BOOKING_AWAITING_CONFIRMATION_LABEL : "Awaiting Supplier Acceptance";
  }
  if (value === "supplier_accepted") {
    if (portal === "supplier") return "Acceptance Recorded";
    return bookingParty ? BOOKING_AWAITING_CONFIRMATION_LABEL : "Supplier Accepted";
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

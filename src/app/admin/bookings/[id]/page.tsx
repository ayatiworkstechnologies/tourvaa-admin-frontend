"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import DatePicker from "@/components/ui/DatePicker";
import { Booking, getBookingDetail, getBookingPaymentLink } from "@/lib/api/services/bookingService";
import BookingStatusBadge from "@/components/bookings/BookingStatusBadge";
import AdminBookingConversationHistory from "@/components/messaging/AdminBookingConversationHistory";
import SupplierPicker from "@/components/bookings/SupplierPicker";
import api from "@/lib/api/client";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuthContext } from "@/providers/AuthProvider";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import {
  LuArrowLeft as ArrowLeft,
  LuCircleCheckBig as CheckCircle2,
  LuLink as LinkIcon,
  LuLoaderCircle as Loader2,
  LuMail as Mail,
  LuMessageSquare as MessageSquare,
  LuRefreshCw as RefreshCw,
  LuTicket as Ticket,
  LuUserCheck as UserCheck,
  LuUsers as Users,
  LuCircleX as XCircle,
  LuCalendar as Calendar,
  LuMapPin as MapPin,
  LuCreditCard as CreditCard,
  LuDollarSign as DollarSign,
  LuClock as Clock,
  LuCheck as Check,
  LuChevronRight as ChevronRight,
  LuFileText as FileText,
  LuInfo as Info,
  LuX as X,
  LuBed as Bed,
  LuCompass as Compass,
  LuSparkles as Sparkles,
  LuUser as User,
  LuSend as Send,
  LuCalendarDays as CalendarDays,
} from "react-icons/lu";

// Kept in sync with BOOKING_STATUS_TRANSITIONS in backend
const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending_payment", "pending_credit_approval", "pending_supplier_assignment", "cancelled"],
  pending_payment: [
    "pending_credit_approval",
    "payment_authorized",
    "pending_supplier_assignment",
    "pending_supplier_acceptance",
    "confirmed",
    "cancellation_requested",
    "cancelled",
    "declined",
  ],
  pending_credit_approval: [
    "pending_payment",
    "payment_authorized",
    "pending_supplier_assignment",
    "cancellation_requested",
    "cancelled",
    "declined",
  ],
  pending_supplier_assignment: [
    "pending_payment",
    "payment_authorized",
    "pending_supplier_acceptance",
    "supplier_reassignment_required",
    "cancellation_requested",
    "cancelled",
    "declined",
  ],
  payment_authorized: [
    "pending_supplier_assignment",
    "pending_supplier_acceptance",
    "confirmed",
    "cancellation_requested",
    "cancelled",
    "declined",
  ],
  pending_supplier_acceptance: [
    "pending_supplier_assignment",
    "supplier_reassignment_required",
    "confirmed",
    "postponed",
    "cancellation_requested",
    "cancelled",
    "declined",
  ],
  supplier_reassignment_required: [
    "pending_supplier_assignment",
    "pending_supplier_acceptance",
    "cancellation_requested",
    "cancelled",
    "declined",
  ],
  confirmed: ["ready_to_travel", "ongoing", "completed", "postponed", "cancellation_requested", "cancelled"],
  ready_to_travel: ["ongoing", "completed", "postponed", "cancellation_requested", "cancelled"],
  upcoming: ["confirmed", "ready_to_travel", "ongoing", "completed", "postponed", "cancellation_requested", "cancelled"],
  ongoing: ["completed", "postponed", "cancellation_requested", "cancelled"],
  postponed: ["confirmed", "ready_to_travel", "ongoing", "completed", "cancellation_requested", "cancelled"],
  cancellation_requested: [
    "pending_payment",
    "payment_authorized",
    "pending_supplier_acceptance",
    "confirmed",
    "ready_to_travel",
    "ongoing",
    "postponed",
    "cancelled",
  ],
  cancelled: ["refunded"],
  declined: ["pending_supplier_assignment", "supplier_reassignment_required", "refunded"],
  completed: [],
  refunded: [],
};

type DetailPanelProps = {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

type DetailFieldProps = {
  label: string;
  value?: React.ReactNode;
  className?: string;
  highlight?: boolean;
};

function DetailPanel({ title, icon, subtitle, action, children, className = "" }: DetailPanelProps) {
  return (
    <section className={`rounded-2xl border border-dash-border bg-white p-5 md:p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] transition-all ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-dash-border-soft pb-3.5">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--portal-soft,#EDF2FA)] text-dash-brand">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-dash-text">{title}</h2>
            {subtitle && <p className="text-xs text-dash-muted font-normal">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}

function DetailField({ label, value, className = "", highlight = false }: DetailFieldProps) {
  const displayValue = value === null || value === undefined || value === "" ? "-" : value;
  return (
    <div
      className={`rounded-xl border px-3.5 py-3 transition-colors ${
        highlight
          ? "border-dash-brand/30 bg-[var(--portal-soft,#EDF2FA)]"
          : "border-dash-border-soft bg-dash-bg hover:bg-dash-bg-muted"
      } ${className}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-dash-subtle">{label}</p>
      <div className="mt-1 text-sm font-semibold text-dash-text break-words">{displayValue}</div>
    </div>
  );
}

function StatusTimeline({ booking }: { booking: Booking }) {
  const historyItems = booking.status_history || [];
  if (historyItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dash-border py-10 text-center">
        <Clock className="text-dash-subtle" size={32} />
        <p className="mt-2 text-sm font-bold text-dash-text">No status history yet</p>
        <p className="text-xs text-dash-muted">Changes to booking milestones and status will appear here.</p>
      </div>
    );
  }
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-dash-border">
      {historyItems.map((h, idx) => (
        <div key={h.id ?? idx} className="relative">
          <div className="absolute -left-6 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-dash-brand text-white shadow-sm ring-2 ring-dash-brand/20">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
          <div className="rounded-xl border border-dash-border-soft bg-dash-bg p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-dash-border-soft px-2 py-0.5 text-xs font-semibold capitalize text-dash-body">
                  {(h.old_status || "created").replaceAll("_", " ")}
                </span>
                <span className="text-xs text-dash-subtle">→</span>
                <span className="rounded-md bg-[var(--portal-soft,#EDF2FA)] px-2 py-0.5 text-xs font-bold capitalize text-dash-brand">
                  {h.new_status.replaceAll("_", " ")}
                </span>
              </div>
              {h.created_at && (
                <span className="text-[11px] font-medium text-dash-subtle">
                  {new Date(h.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              )}
            </div>
            {h.reason && (
              <p className="mt-2 text-xs text-dash-body italic bg-white/80 rounded-lg p-2 border border-dash-border-soft">
                &ldquo;{h.reason}&rdquo;
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// Visual Stepper for the booking execution workflow styled in Admin Theme
function BookingJourneyStepper({ status }: { status: string }) {
  const steps = [
    { key: "draft", label: "Created", statuses: ["draft", "initiated"] },
    {
      key: "payment",
      label: "Payment",
      statuses: ["pending_payment", "payment_authorized", "partially_paid", "pending_credit_approval"],
    },
    {
      key: "supplier",
      label: "Supplier",
      statuses: ["pending_supplier_assignment", "pending_supplier_acceptance", "supplier_reassignment_required"],
    },
    { key: "confirmed", label: "Confirmed", statuses: ["confirmed", "ready_to_travel", "upcoming"] },
    { key: "ongoing", label: "Ongoing", statuses: ["ongoing"] },
    { key: "completed", label: "Completed", statuses: ["completed"] },
  ];

  const isCancelled = ["cancelled", "declined", "cancellation_requested", "refunded"].includes(status);

  // Determine current step index
  let activeIndex = 0;
  if (isCancelled) {
    activeIndex = -1;
  } else {
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].statuses.includes(status)) {
        activeIndex = i;
        break;
      }
    }
    if (status === "completed") activeIndex = 5;
    else if (status === "ongoing") activeIndex = 4;
    else if (["confirmed", "ready_to_travel", "upcoming"].includes(status)) activeIndex = 3;
    else if (["pending_supplier_acceptance", "pending_supplier_assignment", "supplier_reassignment_required"].includes(status))
      activeIndex = 2;
  }

  return (
    <div className="rounded-2xl border border-dash-border bg-white p-4 md:p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--portal-soft,#EDF2FA)] text-dash-brand">
            <Compass size={15} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-dash-text">Booking Pipeline</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-dash-muted">Current Phase:</span>
          <BookingStatusBadge value={status} />
        </div>
      </div>

      {isCancelled ? (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
          <XCircle size={16} />
          <span>This booking has been flagged as: <span className="capitalize">{status.replaceAll("_", " ")}</span></span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {steps.map((st, idx) => {
            const isDone = activeIndex > idx;
            const isCurrent = activeIndex === idx;
            return (
              <div
                key={st.key}
                className={`relative flex flex-col rounded-xl border p-2.5 transition-all ${
                  isCurrent
                    ? "border-dash-brand bg-[var(--portal-soft,#EDF2FA)] shadow-xs"
                    : isDone
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-800"
                    : "border-dash-border-soft bg-dash-bg text-dash-subtle"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-dash-brand text-white animate-pulse"
                        : "bg-dash-border text-dash-muted"
                    }`}
                  >
                    {isDone ? <Check size={11} /> : idx + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-dash-subtle">Step {idx + 1}</span>
                </div>
                <p
                  className={`mt-1.5 text-xs font-bold truncate ${
                    isCurrent ? "text-dash-brand-dark" : isDone ? "text-emerald-900" : "text-dash-muted"
                  }`}
                >
                  {st.label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const { formatExact } = useCurrency();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  // Active tab state
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "operations" | "communications">("overview");

  // Status change state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  // Customer cancellation decision state
  const [showCancellationRejectModal, setShowCancellationRejectModal] = useState(false);
  const [cancellationRejectNotes, setCancellationRejectNotes] = useState("");
  const [processingCancellation, setProcessingCancellation] = useState(false);

  // Assign supplier state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Travel date change state
  const [showDateModal, setShowDateModal] = useState(false);
  const [newTravelDate, setNewTravelDate] = useState("");
  const [dateChangeReason, setDateChangeReason] = useState("");
  const [changingDate, setChangingDate] = useState(false);

  // Communication state
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [commMessage, setCommMessage] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [commVisibility, setCommVisibility] = useState<"internal" | "customer" | "supplier" | "agent" | "all">("internal");
  const [sendingComm, setSendingComm] = useState(false);

  const [fetchingLink, setFetchingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!params.id) return;
    setIsLoading(true);
    try {
      const b = await getBookingDetail(params.id);
      setBooking(b);
    } catch {
      setErrorMessage("Could not load booking.");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void fetchBooking();
  }, [fetchBooking]);

  async function changeStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatus) return;
    setChangingStatus(true);
    setActionErr("");
    try {
      await api.patch(`/bookings/${params.id}/status`, { booking_status: newStatus, reason: statusReason });
      setActionMsg(`Status successfully changed to ${newStatus.replaceAll("_", " ")}`);
      setShowStatusModal(false);
      setNewStatus("");
      setStatusReason("");
      await fetchBooking();
    } catch (err: unknown) {
      setActionErr(getApiErrorMessage(err));
    } finally {
      setChangingStatus(false);
    }
  }

  async function approveCancellationRequest() {
    if (!params.id) return;
    setProcessingCancellation(true);
    setActionErr("");
    try {
      await api.patch(`/bookings/${params.id}/cancellation-request/approve`, {});
      setActionMsg("Cancellation request confirmed. The booking is now cancelled.");
      await fetchBooking();
    } catch (err: unknown) {
      setActionErr(getApiErrorMessage(err));
    } finally {
      setProcessingCancellation(false);
    }
  }

  async function rejectCancellationRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!params.id || !cancellationRejectNotes.trim()) return;
    setProcessingCancellation(true);
    setActionErr("");
    try {
      await api.patch(`/bookings/${params.id}/cancellation-request/reject`, { admin_notes: cancellationRejectNotes.trim() });
      setActionMsg("Cancellation request declined. The booking has been restored to its previous status.");
      setShowCancellationRejectModal(false);
      setCancellationRejectNotes("");
      await fetchBooking();
    } catch (err: unknown) {
      setActionErr(getApiErrorMessage(err));
    } finally {
      setProcessingCancellation(false);
    }
  }

  async function assignSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) return;
    setAssigning(true);
    setActionErr("");
    try {
      await api.post(`/bookings/${params.id}/assign-supplier`, { supplier_id: supplierId });
      setActionMsg("Supplier assigned successfully");
      setShowAssignModal(false);
      setSupplierId(null);
      await fetchBooking();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setActionErr(e?.response?.data?.detail || "Failed to assign supplier.");
    } finally {
      setAssigning(false);
    }
  }

  async function changeTravelDate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTravelDate) return;
    setChangingDate(true);
    setActionErr("");
    try {
      await api.patch(`/bookings/${params.id}/travel-date`, {
        tour_date: newTravelDate,
        reason: dateChangeReason || "Customer requested travel date change",
      });
      setActionMsg(`Travel date successfully updated to ${newTravelDate}`);
      setShowDateModal(false);
      setNewTravelDate("");
      setDateChangeReason("");
      await fetchBooking();
    } catch (err: unknown) {
      setActionErr(getApiErrorMessage(err));
    } finally {
      setChangingDate(false);
    }
  }

  async function sendCommunication(e: React.FormEvent) {
    e.preventDefault();
    if (!commMessage) return;
    setSendingComm(true);
    setActionErr("");
    try {
      await api.post(`/bookings/${params.id}/communications`, {
        subject: commSubject || "Admin Note",
        message: commMessage,
        visibility: commVisibility,
        message_type: "admin_message",
      });
      setActionMsg(commVisibility === "internal" ? "Internal note logged successfully" : `Communication sent to ${commVisibility === "all" ? "all booking parties" : `the ${commVisibility}`} successfully`);
      setShowMsgModal(false);
      setCommMessage("");
      setCommSubject("");
      setCommVisibility("internal");
      await fetchBooking();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setActionErr(e?.response?.data?.detail || "Failed to send communication.");
    } finally {
      setSendingComm(false);
    }
  }

  async function copyPaymentLink() {
    if (!params.id) return;
    setFetchingLink(true);
    setActionErr("");
    try {
      const result = await getBookingPaymentLink(params.id);
      const absoluteLink = `${window.location.origin}${result.payment_link}`;
      await navigator.clipboard.writeText(absoluteLink);
      setLinkCopied(true);
      setActionMsg(`Payment link copied to clipboard: ${absoluteLink}`);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setActionErr(e?.response?.data?.detail || "Failed to generate payment link.");
    } finally {
      setFetchingLink(false);
    }
  }

  const { hasPermission } = useAuthContext();
  const canViewSupplierFinancials = hasPermission("reports.view");

  const activityItems = booking?.optional_activities || [];
  const accommodationItems = booking?.accommodations || [];
  const extensionItems = booking?.extensions || [];
  const travellers = booking?.travellers || [];
  const communications = booking?.communications || [];

  const hasFinancialBreakdown = booking?.final_amount != null;
  const latestPayment = [...(booking?.payments || [])].sort((a, b) => b.id - a.id)[0];
  const paymentMethod = latestPayment
    ? latestPayment.gateway || latestPayment.payment_method
    : booking?.agent_payment_method;
  const nextPaymentDate = booking?.balance_due_date || booking?.payment_due_date;

  const totalAmountNum = Number(booking?.final_amount ?? 0);
  const paidAmountNum = Number(booking?.amount_paid ?? 0);
  const percentPaid = totalAmountNum > 0 ? Math.min(100, Math.round((paidAmountNum / totalAmountNum) * 100)) : 0;

  // Format booking creation date
  const createdDateFormatted = useMemo(() => {
    if (!booking?.created_at) return null;
    return new Date(booking.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [booking]);

  return (
    <ModuleWrapper title="Booking Detail" requiredPermission="bookings.view">
      {isLoading ? <Loader label="Loading booking details..." /> : null}

      {!isLoading && (errorMessage || !booking) ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <XCircle className="mx-auto text-red-500" size={40} />
          <h2 className="mt-3 text-lg font-bold text-red-800">Booking Not Found</h2>
          <p className="mt-1 text-sm text-red-600">{errorMessage || "Could not retrieve the requested booking."}</p>
          <div className="mt-5">
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-dash-brand-hover transition"
            >
              <ArrowLeft size={14} /> Back to Bookings
            </Link>
          </div>
        </div>
      ) : null}

      {!isLoading && booking ? (
        <div className="space-y-6">
          {/* Top Breadcrumb & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex items-center gap-2 text-xs font-medium text-dash-muted">
              <Link href="/admin/bookings" className="text-dash-brand hover:text-dash-brand-hover transition flex items-center gap-1 font-semibold">
                <ArrowLeft size={14} /> Bookings
              </Link>
              <ChevronRight size={12} className="text-dash-subtle" />
              <span className="font-bold text-dash-text">{booking.booking_code}</span>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchBooking()}
                title="Refresh booking"
                className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-1.5 text-xs font-semibold text-dash-body hover:bg-dash-bg hover:text-dash-text transition shadow-xs"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {/* Action Feedback Alerts */}
          {actionMsg && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{actionMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionMsg("")}
                className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100 transition"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {actionErr && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-xs">
              <div className="flex items-center gap-2.5">
                <XCircle size={18} className="text-red-500 shrink-0" />
                <span>{actionErr}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionErr("")}
                className="rounded-lg p-1 text-red-500 hover:bg-red-100 transition"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Modern Hero Header Card - Admin Brand Themed */}
          <section className="relative overflow-hidden rounded-3xl border border-dash-border bg-white shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <div className="h-2 bg-gradient-to-r from-dash-brand to-dash-brand-hover" />
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                {/* Left Info Column */}
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-dash-brand to-dash-brand-dark text-xl font-black text-white shadow-[0_4px_12px_rgb(29,58,109,0.25)]">
                    {initials(booking.customer_name || booking.booking_code)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-dash-text">
                        {booking.booking_code}
                      </h1>
                      <BookingStatusBadge value={booking.booking_status} />
                      <BookingStatusBadge value={booking.payment_status} />
                      {booking.booking_source && (
                        <span className="rounded-full bg-dash-bg px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-dash-muted border border-dash-border-soft">
                          {booking.booking_source}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-base font-bold text-dash-text flex items-center gap-2">
                      <Compass size={17} className="text-dash-brand shrink-0" />
                      {booking.tour_name}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-dash-muted">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Users size={14} className="text-dash-subtle" />
                        {booking.customer_name || `Customer #${booking.customer_id}`}
                      </span>
                      {booking.customer_email && (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Mail size={14} className="text-dash-subtle" />
                          {booking.customer_email}
                        </span>
                      )}
                      {booking.country && (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <MapPin size={14} className="text-dash-subtle" />
                          {booking.country}
                        </span>
                      )}
                      {createdDateFormatted && (
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Clock size={14} className="text-dash-subtle" />
                          Booked on {createdDateFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                  {booking.booking_status === "cancellation_requested" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void approveCancellationRequest()}
                        disabled={processingCancellation}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                      >
                        {processingCancellation ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Confirm Cancellation
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancellationRejectModal(true)}
                        disabled={processingCancellation}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 shadow-xs transition hover:bg-rose-50 active:scale-95 disabled:opacity-60"
                      >
                        <XCircle size={14} /> Decline Request
                      </button>
                    </>
                  ) : (BOOKING_STATUS_TRANSITIONS[booking.booking_status] ?? []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowStatusModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-dash-brand-hover transition active:scale-95"
                    >
                      <RefreshCw size={14} /> Change Status
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setNewTravelDate(booking.tour_date || "");
                      setShowDateModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-bold text-dash-body shadow-xs hover:bg-dash-bg hover:text-dash-text transition active:scale-95"
                  >
                    <CalendarDays size={14} className="text-dash-brand" /> Change Travel Date
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSupplierId(booking.supplier_id ?? null);
                      setShowAssignModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-bold text-dash-body shadow-xs hover:bg-dash-bg hover:text-dash-text transition active:scale-95"
                  >
                    <UserCheck size={14} className="text-dash-brand" /> Assign Supplier
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMsgModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-bold text-dash-body shadow-xs hover:bg-dash-bg hover:text-dash-text transition active:scale-95"
                  >
                    <MessageSquare size={14} className="text-dash-brand" /> Add Note
                  </button>

                  <button
                    type="button"
                    onClick={() => void copyPaymentLink()}
                    disabled={fetchingLink}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition active:scale-95 ${
                      linkCopied
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-dash-border bg-white text-dash-body hover:bg-dash-bg hover:text-dash-text"
                    } shadow-xs disabled:opacity-60`}
                  >
                    {fetchingLink ? (
                      <Loader2 className="animate-spin text-dash-brand" size={14} />
                    ) : linkCopied ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <LinkIcon size={14} className="text-dash-brand" />
                    )}
                    {linkCopied ? "Link Copied!" : "Payment Link"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Booking Pipeline Journey Stepper */}
          <BookingJourneyStepper status={booking.booking_status} />

          {showCancellationRejectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="decline-cancellation-title">
              <form onSubmit={rejectCancellationRequest} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h2 id="decline-cancellation-title" className="text-lg font-black text-dash-text">Decline cancellation request</h2>
                <p className="mt-2 text-sm leading-6 text-dash-muted">Provide the reason that will be sent to the customer. The booking will return to its status before the request.</p>
                <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-dash-muted" htmlFor="cancellation-rejection-notes">Reason</label>
                <textarea
                  id="cancellation-rejection-notes"
                  value={cancellationRejectNotes}
                  onChange={(event) => setCancellationRejectNotes(event.target.value)}
                  required
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm text-dash-text outline-none focus:border-dash-brand"
                  placeholder="Explain why the cancellation request is declined"
                />
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCancellationRejectModal(false)} disabled={processingCancellation} className="rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-bold text-dash-body hover:bg-dash-bg">Keep request</button>
                  <button type="submit" disabled={processingCancellation || !cancellationRejectNotes.trim()} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60">
                    {processingCancellation && <Loader2 className="animate-spin" size={14} />} Decline request
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4 KPI Metrics Strip */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Financial Status */}
            <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-dash-muted">Total Price</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <DollarSign size={16} />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-dash-text">
                  {formatExact(booking.final_amount, booking.currency)}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-dash-muted">Paid: {formatExact(booking.amount_paid, booking.currency)}</span>
                  <span className="text-dash-brand font-bold">{percentPaid}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-dash-bg">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-dash-brand transition-all duration-500"
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-dash-muted font-medium">
                  Pending: {formatExact(booking.amount_pending, booking.currency)}
                </div>
              </div>
            </div>

            {/* KPI 2: Travel Date & Destination */}
            <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-dash-muted">Travel Date</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--portal-soft,#EDF2FA)] text-dash-brand">
                    <Calendar size={16} />
                  </span>
                </div>
                <div className="mt-2 text-xl font-black text-dash-text">
                  {booking.tour_date ? new Date(booking.tour_date).toLocaleDateString(undefined, { dateStyle: "medium" }) : "-"}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-1.5 text-xs text-dash-body font-semibold">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-dash-brand" />
                  <span>{booking.country || "Global Tour"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewTravelDate(booking.tour_date || "");
                    setShowDateModal(true);
                  }}
                  className="text-xs font-bold text-dash-brand hover:text-dash-brand-hover"
                >
                  Change
                </button>
              </div>
            </div>

            {/* KPI 3: Travellers Capacity */}
            <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-dash-muted">Travellers</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--portal-soft,#EDF2FA)] text-dash-brand">
                    <Users size={16} />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-dash-text">
                  {booking.total_travellers || (booking.no_of_adults ?? 0) + (booking.no_of_children ?? 0) + (booking.no_of_infants ?? 0)} Pax
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-dash-body">
                <span className="rounded-md bg-dash-bg px-2 py-0.5 border border-dash-border-soft">{booking.no_of_adults || 0} Adults</span>
                <span className="rounded-md bg-dash-bg px-2 py-0.5 border border-dash-border-soft">{booking.no_of_children || 0} Kids</span>
                {Number(booking.no_of_infants || 0) > 0 && (
                  <span className="rounded-md bg-dash-bg px-2 py-0.5 border border-dash-border-soft">{booking.no_of_infants} Infants</span>
                )}
              </div>
            </div>

            {/* KPI 4: Supplier Fulfillment */}
            <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-dash-muted">Assigned Supplier</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <UserCheck size={16} />
                  </span>
                </div>
                <div className="mt-2 text-base font-black text-dash-text truncate" title={booking.supplier_name || "Unassigned"}>
                  {booking.supplier_name || "Unassigned"}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <BookingStatusBadge value={booking.supplier_acceptance_status || "not_assigned"} />
                <button
                  type="button"
                  onClick={() => {
                    setSupplierId(booking.supplier_id ?? null);
                    setShowAssignModal(true);
                  }}
                  className="text-xs font-bold text-dash-brand hover:text-dash-brand-hover transition"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation Bar - Styled in Admin Theme */}
          <div className="border-b border-dash-border">
            <nav className="flex space-x-6">
              {[
                { id: "overview", label: "Overview & Itinerary", icon: Compass },
                { id: "financials", label: "Financials & Accounting", icon: CreditCard },
                { id: "operations", label: "Audit & Status History", icon: Clock },
                { id: "communications", label: "Notes & Messages", icon: MessageSquare, count: communications.length },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 border-b-2 py-3.5 text-sm font-bold transition-all ${
                      isActive
                        ? "border-dash-brand text-dash-brand"
                        : "border-transparent text-dash-muted hover:border-dash-border hover:text-dash-text"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="rounded-full bg-dash-bg border border-dash-border-soft px-2 py-0.5 text-xs font-bold text-dash-muted">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* TAB 1: OVERVIEW & ITINERARY */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column (2 Cols) */}
              <div className="space-y-6 lg:col-span-2">
                {/* Tour & Travel Details */}
                <DetailPanel
                  title="Travel"
                  icon={<Compass size={18} />}
                  subtitle="Destination, dates, and group composition"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setNewTravelDate(booking.tour_date || "");
                        setShowDateModal(true);
                      }}
                      className="text-xs font-bold text-dash-brand hover:text-dash-brand-hover inline-flex items-center gap-1"
                    >
                      <CalendarDays size={13} /> Change Travel Date
                    </button>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    <DetailField label="Date" value={booking.tour_date} />
                    <DetailField label="Country" value={booking.country} />
                    <DetailField label="Supplier" value={booking.supplier_name} />
                    <DetailField label="Adults" value={booking.no_of_adults} />
                    <DetailField label="Children" value={booking.no_of_children} />
                    <DetailField label="Infants" value={booking.no_of_infants} />
                  </div>
                </DetailPanel>

                {/* Add-ons Section */}
                <DetailPanel
                  title="Add-ons"
                  icon={<Ticket size={18} />}
                  subtitle="Optional activities, hotel upgrades, and itinerary extensions"
                >
                  {activityItems.length === 0 && accommodationItems.length === 0 && extensionItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dash-border py-8 text-center">
                      <Sparkles size={28} className="text-dash-subtle" />
                      <p className="mt-2 text-sm font-bold text-dash-text">No Add-ons Selected</p>
                      <p className="text-xs text-dash-muted">This reservation does not have any supplemental activities or hotel extensions.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {[
                        { label: "Optional Activities", items: activityItems, icon: Sparkles },
                        { label: "Accommodations", items: accommodationItems, icon: Bed },
                        { label: "Extensions", items: extensionItems, icon: Compass },
                      ]
                        .filter((group) => group.items.length > 0)
                        .map((group) => {
                          const GroupIcon = group.icon;
                          return (
                            <div key={group.label} className="space-y-2">
                              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dash-muted">
                                <GroupIcon size={14} className="text-dash-brand" />
                                {group.label}
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {group.items.map((item, index) => {
                                  const name =
                                    item.activity_name_snapshot ||
                                    item.accommodation_name_snapshot ||
                                    item.extension_name_snapshot ||
                                    item.name ||
                                    item.title ||
                                    "Item";
                                  const price = item.total_price || item.unit_price || item.amount || item.price || "-";
                                  return (
                                    <div
                                      key={item.id ?? index}
                                      className="flex items-center justify-between rounded-xl border border-dash-border-soft bg-dash-bg p-3 text-sm transition hover:bg-dash-bg-muted"
                                    >
                                      <div className="min-w-0 pr-3">
                                        <p className="font-semibold text-dash-text truncate" title={name}>
                                          {name}
                                        </p>
                                        {item.quantity && item.quantity > 1 && (
                                          <p className="text-xs text-dash-subtle">Qty: {item.quantity}</p>
                                        )}
                                      </div>
                                      <span className="font-bold text-dash-text shrink-0">
                                        {formatExact(price, booking.currency)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </DetailPanel>

                {/* Travellers List */}
                <DetailPanel
                  title="Travellers"
                  icon={<Users size={18} />}
                  subtitle={`Roster of ${travellers.length} registered participant(s)`}
                >
                  {travellers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-dash-border py-6 text-center text-sm text-dash-muted">
                      No individual traveller names registered yet.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {travellers.map((t, index) => (
                        <div
                          key={t.id ?? index}
                          className="rounded-xl border border-dash-border-soft bg-dash-bg p-3.5 flex items-start gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-soft,#EDF2FA)] text-xs font-bold text-dash-brand">
                            {initials(t.full_name || "Pax")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-dash-text truncate" title={t.full_name}>
                              {t.full_name}
                            </p>
                            <p className="text-xs text-dash-muted font-medium">
                              {t.traveller_type ? t.traveller_type.charAt(0).toUpperCase() + t.traveller_type.slice(1) : "Traveller"}
                              {t.age !== undefined && t.age !== null ? ` · ${t.age} yrs` : ""}
                            </p>
                            {t.passport_number && (
                              <p className="mt-1 text-[11px] font-mono text-dash-subtle">
                                Pass: {t.passport_number}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DetailPanel>
              </div>

              {/* Right Column (1 Col) */}
              <div className="space-y-6">
                {/* Summary Card */}
                <DetailPanel title="Summary" icon={<Info size={18} />}>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-dash-subtle">Booking Status</p>
                      <div className="mt-1">
                        <BookingStatusBadge value={booking.booking_status} />
                      </div>
                    </div>
                    <DetailField label="Supplier Status" value={booking.supplier_acceptance_status?.replaceAll("_", " ")} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-dash-subtle">Payment Status</p>
                      <div className="mt-1">
                        <BookingStatusBadge value={booking.payment_status} />
                      </div>
                    </div>
                    <DetailField label="Travellers" value={booking.total_travellers} />
                    <DetailField label="Source Channel" value={booking.booking_source?.toUpperCase() || "DIRECT"} />
                  </div>
                </DetailPanel>

                {/* Lead Customer Contact Card */}
                <DetailPanel title="Customer" icon={<User size={18} />}>
                  <div className="space-y-3">
                    <DetailField label="Name" value={booking.customer_name || `Customer #${booking.customer_id}`} />
                    <DetailField label="Email" value={booking.customer_email} />
                    <DetailField label="Phone" value={booking.customer_phone ?? booking.contact_phone} />
                    {booking.customer_id && (
                      <div className="pt-1">
                        <Link
                          href={`/admin/users?search=${encodeURIComponent(booking.customer_email || "")}`}
                          className="text-xs font-bold text-dash-brand hover:text-dash-brand-hover transition inline-flex items-center gap-1"
                        >
                          View Customer Profile →
                        </Link>
                      </div>
                    )}
                  </div>
                </DetailPanel>

                {/* Notes Snapshot */}
                <DetailPanel
                  title="Notes"
                  icon={<FileText size={18} />}
                  action={
                    <button
                      type="button"
                      onClick={() => setActiveTab("communications")}
                      className="text-xs font-bold text-dash-brand hover:text-dash-brand-hover"
                    >
                      View All
                    </button>
                  }
                >
                  <div className="space-y-3 text-xs">
                    <div className="rounded-xl border border-dash-border-soft bg-dash-bg p-3">
                      <span className="font-bold uppercase tracking-wider text-dash-subtle">Customer Note</span>
                      <p className="mt-1 font-medium text-dash-body italic">
                        {booking.customer_notes || "No special requests from customer."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-dash-border-soft bg-dash-bg p-3">
                      <span className="font-bold uppercase tracking-wider text-dash-subtle">Admin Note</span>
                      <p className="mt-1 font-medium text-dash-body italic">
                        {booking.admin_notes || "No internal admin notes."}
                      </p>
                    </div>
                  </div>
                </DetailPanel>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIALS & ACCOUNTING */}
          {activeTab === "financials" && (
            <div className="space-y-6">
              {/* Top Row: Payment Status & Breakdown */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Booking Payment Status */}
                <DetailPanel
                  title="Booking Payment Status"
                  icon={<CreditCard size={18} />}
                  subtitle="Gateway transactions, terms, and balance due"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField
                      label="Total Booking Amount"
                      value={formatExact(booking.final_amount, booking.currency)}
                      highlight
                    />
                    <DetailField
                      label="Paid Amount"
                      value={formatExact(booking.amount_paid, booking.currency)}
                    />
                    <DetailField
                      label="Pending Amount"
                      value={formatExact(booking.amount_pending, booking.currency)}
                    />
                    <DetailField label="Payment Type" value={booking.payment_type} />
                    <DetailField
                      label="Payment Method"
                      value={paymentMethod?.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    />
                    <DetailField
                      label="Next Payment Date"
                      value={nextPaymentDate ? new Date(nextPaymentDate).toLocaleDateString() : null}
                    />
                  </div>
                </DetailPanel>

                {/* Tourvaa Profitability / Financial Breakdown */}
                {canViewSupplierFinancials && hasFinancialBreakdown && (
                  <DetailPanel
                    title="Financial Breakdown"
                    icon={<DollarSign size={18} />}
                    subtitle="Revenue after partner commissions and supplier settlement"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailField
                        label="Total Booking Amount"
                        value={formatExact(booking.final_amount, booking.currency)}
                      />
                      <DetailField
                        label="Supplier Net Payable"
                        value={formatExact(booking.supplier_net_payable, booking.currency)}
                      />
                      {booking.booking_source === "agent" && (
                        <DetailField
                          label="Agent Commission Payable"
                          value={formatExact(booking.agent_commission_amount, booking.currency)}
                        />
                      )}
                      <DetailField
                        label="Tourvaa Gross Revenue"
                        value={formatExact(booking.tourvaa_net_revenue, booking.currency)}
                        highlight
                      />
                    </div>
                  </DetailPanel>
                )}
              </div>

              {/* Middle Row: Supplier Payments & Agent Payments */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Supplier Payments Block */}
                {booking.supplier_breakdown && canViewSupplierFinancials && (
                  <DetailPanel
                    title="Supplier Payments"
                    icon={<UserCheck size={18} />}
                    subtitle="Payout calculation and commission remittance"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailField
                        label="Supplier Gross Amount"
                        value={formatExact(booking.supplier_breakdown.gross_amount, booking.supplier_breakdown.currency)}
                      />
                      <DetailField
                        label="Commission to Tourvaa"
                        value={`${booking.supplier_breakdown.commission_percentage}%`}
                      />
                      <DetailField
                        label="Commission Amount"
                        value={formatExact(booking.supplier_breakdown.commission_amount, booking.supplier_breakdown.currency)}
                      />
                      <DetailField
                        label="Supplier Net Payable"
                        value={formatExact(booking.supplier_breakdown.net_payable, booking.supplier_breakdown.currency)}
                        highlight
                      />
                      <DetailField
                        label="Supplier Payment Status"
                        value={booking.supplier_breakdown.payment_status?.replaceAll("_", " ")}
                      />
                      <DetailField
                        label="Supplier Payment Date"
                        value={
                          booking.supplier_breakdown.payment_date
                            ? new Date(booking.supplier_breakdown.payment_date).toLocaleDateString()
                            : null
                        }
                      />
                    </div>
                    {booking.cancellation_reason && (
                      <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p className="text-xs font-bold text-rose-700">Cancellation Reason</p>
                        <p className="mt-1 text-sm text-rose-800">{booking.cancellation_reason}</p>
                      </div>
                    )}
                  </DetailPanel>
                )}

                {/* Agent Payments Block */}
                {booking.agent_payment_summary && (
                  <DetailPanel
                    title="Agent Payments"
                    icon={<FileText size={18} />}
                    subtitle="B2B travel partner commission and settlement terms"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailField label="Agent Transaction Type" value={booking.agent_payment_summary.transaction_type} />
                      {booking.agent_payment_summary.is_reserved ? (
                        <>
                          <DetailField
                            label="Total Booking Amount"
                            value={formatExact(booking.agent_payment_summary.total_booking_amount, booking.currency)}
                          />
                          <DetailField
                            label="Agent Commission"
                            value={`${booking.agent_payment_summary.commission_percentage}%`}
                          />
                          <DetailField
                            label="Agent Price After Commission"
                            value={formatExact(booking.agent_payment_summary.agent_price_after_commission, booking.currency)}
                            highlight
                          />
                          <DetailField
                            label="Agent Commission Amount"
                            value={formatExact(booking.agent_payment_summary.commission_amount, booking.currency)}
                          />
                          <DetailField
                            label="Invoice Status"
                            value={booking.agent_payment_summary.invoice_status.replaceAll("_", " ")}
                          />
                          <DetailField
                            label="Payment Due Date"
                            value={
                              booking.agent_payment_summary.payment_due_date
                                ? new Date(booking.agent_payment_summary.payment_due_date).toLocaleDateString()
                                : null
                            }
                          />
                          <DetailField
                            label="Amount Paid by Agent"
                            value={formatExact(booking.agent_payment_summary.amount_paid, booking.currency)}
                          />
                        </>
                      ) : (
                        <>
                          <DetailField
                            label="Total Booking Amount"
                            value={formatExact(booking.agent_payment_summary.total_booking_amount, booking.currency)}
                          />
                          <DetailField
                            label="Amount Paid by Agent"
                            value={formatExact(booking.agent_payment_summary.amount_paid, booking.currency)}
                          />
                          <DetailField
                            label="Agent Commission"
                            value={`${booking.agent_payment_summary.commission_percentage}%`}
                          />
                          <DetailField
                            label="Commission Amount"
                            value={formatExact(booking.agent_payment_summary.commission_amount, booking.currency)}
                          />
                          <DetailField
                            label="Agent Price After Commission"
                            value={formatExact(booking.agent_payment_summary.agent_price_after_commission, booking.currency)}
                            highlight
                          />
                          <DetailField
                            label="Commission Payable to Agent"
                            value={formatExact(booking.agent_payment_summary.commission_payable, booking.currency)}
                          />
                          <DetailField
                            label="Commission Status"
                            value={booking.agent_payment_summary.commission_status.replaceAll("_", " ")}
                          />
                          <DetailField
                            label="Commission Payment Date"
                            value={
                              booking.agent_payment_summary.commission_payment_date
                                ? new Date(booking.agent_payment_summary.commission_payment_date).toLocaleDateString()
                                : null
                            }
                          />
                        </>
                      )}
                    </div>
                  </DetailPanel>
                )}
              </div>

              {/* Payment Attempts Ledger Table */}
              <DetailPanel
                title="Payment Attempts"
                icon={<CreditCard size={18} />}
                subtitle="Historical transaction ledger and gateway audit"
              >
                {(booking.payments?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-dash-border py-8 text-center text-sm text-dash-muted">
                    No payment attempts recorded for this booking yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-dash-border text-[11px] font-bold uppercase tracking-wider text-dash-subtle">
                          <th className="pb-3 pl-1">Payment Code</th>
                          <th className="pb-3">Method / Gateway</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right">Amount</th>
                          <th className="pb-3 text-right pr-1">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dash-border-soft">
                        {booking.payments!.map((p) => (
                          <tr key={p.id} className="hover:bg-dash-bg/70 transition">
                            <td className="py-3 pl-1 font-mono font-bold text-dash-text">
                              {p.payment_code}
                            </td>
                            <td className="py-3 text-dash-body font-medium">
                              {p.payment_method} <span className="text-xs text-dash-subtle">({p.gateway})</span>
                            </td>
                            <td className="py-3 text-xs text-dash-muted">
                              {p.created_at ? new Date(p.created_at).toLocaleString() : "-"}
                            </td>
                            <td className="py-3 text-right font-bold text-dash-text">
                              {formatExact(p.total_amount, booking.currency)}
                            </td>
                            <td className="py-3 text-right pr-1">
                              <BookingStatusBadge value={p.payment_status} />
                              {p.failure_reason && (
                                <p className="mt-1 text-[11px] text-red-500 italic max-w-xs ml-auto">
                                  {p.failure_reason}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DetailPanel>
            </div>
          )}

          {/* TAB 3: AUDIT & STATUS HISTORY */}
          {activeTab === "operations" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DetailPanel
                  title="Status Timeline"
                  icon={<Clock size={18} />}
                  subtitle="Complete lifecycle progression and transitions"
                >
                  <StatusTimeline booking={booking} />
                </DetailPanel>
              </div>

              <div>
                <DetailPanel title="Audit Summary" icon={<Info size={18} />}>
                  <div className="space-y-3">
                    <DetailField
                      label="Created At"
                      value={booking.created_at ? new Date(booking.created_at).toLocaleString() : "-"}
                    />
                    <DetailField
                      label="Updated At"
                      value={booking.updated_at ? new Date(booking.updated_at).toLocaleString() : "-"}
                    />
                    <DetailField label="Booking Code" value={booking.booking_code} />
                    <DetailField label="Current Status" value={booking.booking_status.replaceAll("_", " ")} />
                    {booking.cancellation_source && (
                      <DetailField label="Cancellation Source" value={booking.cancellation_source} />
                    )}
                  </div>
                </DetailPanel>
              </div>
            </div>
          )}

          {/* TAB 4: NOTES & COMMUNICATIONS */}
          {activeTab === "communications" && (
            <div className="space-y-6">
              <DetailPanel
                title="Portal Messages"
                icon={<MessageSquare size={18} />}
                subtitle="Customer, agent, and supplier messages sent from the booking portals"
              >
                <AdminBookingConversationHistory bookingId={booking.id} />
              </DetailPanel>

              {/* Notes Grid */}
              <DetailPanel
                title="Notes"
                icon={<FileText size={18} />}
                subtitle="General, customer-supplied, and internal administrator notes"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <DetailField label="General" value={booking.notes || "No general notes."} />
                  <DetailField label="Customer" value={booking.customer_notes || "No customer notes."} />
                  <DetailField label="Admin" value={booking.admin_notes || "No admin notes."} />
                </div>
              </DetailPanel>

              {/* Communications Thread */}
              <DetailPanel
                title="Communications"
                icon={<MessageSquare size={18} />}
                subtitle="Internal notes and outgoing communications, labelled by sender and audience"
                action={
                  <button
                    type="button"
                    onClick={() => setShowMsgModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-dash-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-dash-brand-hover transition shadow-sm"
                  >
                    <Send size={12} /> Log New Message
                  </button>
                }
              >
                {communications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dash-border py-10 text-center">
                    <MessageSquare size={32} className="text-dash-subtle" />
                    <p className="mt-2 text-sm font-bold text-dash-text">No Messages Logged</p>
                    <p className="text-xs text-dash-muted">Communications with customer or suppliers will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communications.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-dash-border-soft bg-dash-bg p-4 transition hover:bg-dash-bg-muted"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-[var(--portal-soft,#EDF2FA)] px-2 py-0.5 text-[11px] font-bold uppercase text-dash-brand">
                              From {c.sender_type || "System"}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-600">
                              {c.visibility === "internal" ? "Internal note" : c.visibility === "all" ? "To all parties" : `To ${c.visibility}`}
                            </span>
                            {c.subject && <span className="text-xs font-bold text-dash-text">{c.subject}</span>}
                          </div>
                          {c.created_at && (
                            <span className="text-[11px] text-dash-subtle">
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-dash-body whitespace-pre-wrap">{c.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </DetailPanel>
            </div>
          )}

          {/* ===================== MODALS ===================== */}

          {/* 1. Change Status Modal */}
          {showStatusModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-3xl border border-dash-border bg-white p-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-dash-border-soft pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--portal-soft,#EDF2FA)] text-dash-brand">
                      <RefreshCw size={16} />
                    </span>
                    <h3 className="text-base font-bold text-dash-text">Change Booking Status</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="rounded-lg p-1 text-dash-subtle hover:bg-dash-bg hover:text-dash-text"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={changeStatus} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dash-muted mb-1.5">
                      Target Status
                    </label>
                    <select
                      required
                      title="New booking status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full rounded-xl border border-dash-border bg-white px-3.5 py-2.5 text-sm text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                    >
                      <option value="">Select new status…</option>
                      {(BOOKING_STATUS_TRANSITIONS[booking.booking_status] ?? []).map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dash-muted mb-1.5">
                      Reason / Internal Audit Note
                    </label>
                    <textarea
                      rows={3}
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Optional reason for status transition…"
                      className="w-full resize-none rounded-xl border border-dash-border px-3.5 py-2.5 text-sm text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowStatusModal(false)}
                      className="rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-bold text-dash-body hover:bg-dash-bg hover:text-dash-text"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={changingStatus || !newStatus}
                      className="flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-dash-brand-hover disabled:opacity-50 shadow-sm"
                    >
                      {changingStatus ? <Loader2 className="animate-spin" size={14} /> : null}
                      Update Status
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. Change Travel Date Modal */}
          {showDateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-3xl border border-dash-border bg-white p-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-dash-border-soft pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--portal-soft,#EDF2FA)] text-dash-brand">
                      <CalendarDays size={16} />
                    </span>
                    <h3 className="text-base font-bold text-dash-text">Change Travel Date</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDateModal(false)}
                    className="rounded-lg p-1 text-dash-subtle hover:bg-dash-bg hover:text-dash-text"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={changeTravelDate} className="mt-4 space-y-4">
                  <p className="text-xs text-dash-muted">
                    Seat availability is checked automatically against tour calendar availability for the selected new departure date.
                  </p>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dash-muted mb-1.5">
                      New Travel Date
                    </label>
                    <DatePicker
                      value={newTravelDate}
                      onChange={setNewTravelDate}
                      required
                      placeholder="Select new travel date"
                      buttonClassName="w-full rounded-xl border border-dash-border bg-white px-3.5 py-2.5 text-sm text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dash-muted mb-1.5">
                      Change Reason
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={dateChangeReason}
                      onChange={(e) => setDateChangeReason(e.target.value)}
                      placeholder="e.g. Customer requested date reschedule due to flight changes…"
                      className="w-full resize-none rounded-xl border border-dash-border px-3.5 py-2.5 text-sm text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDateModal(false)}
                      className="rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-bold text-dash-body hover:bg-dash-bg hover:text-dash-text"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={changingDate || !newTravelDate}
                      className="flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-dash-brand-hover disabled:opacity-50 shadow-sm"
                    >
                      {changingDate ? <Loader2 className="animate-spin" size={14} /> : null}
                      Update Travel Date
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 3. Assign Supplier Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-3xl border border-dash-border bg-white p-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-dash-border-soft pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--portal-soft,#EDF2FA)] text-dash-brand">
                      <UserCheck size={16} />
                    </span>
                    <h3 className="text-base font-bold text-dash-text">Assign Supplier</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="rounded-lg p-1 text-dash-subtle hover:bg-dash-bg hover:text-dash-text"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={assignSupplier} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dash-muted mb-1.5">
                      Select Supplier
                    </label>
                    <SupplierPicker
                      value={supplierId}
                      name={supplierId === booking.supplier_id ? booking.supplier_name : undefined}
                      onChange={(id) => setSupplierId(id)}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-bold text-dash-body hover:bg-dash-bg hover:text-dash-text"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assigning || !supplierId}
                      className="flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-dash-brand-hover disabled:opacity-50 shadow-sm"
                    >
                      {assigning ? <Loader2 className="animate-spin" size={14} /> : null}
                      Save Assignment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 4. Send Communication Modal */}
          {showMsgModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-3xl border border-dash-border bg-white p-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-dash-border-soft pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--portal-soft,#EDF2FA)] text-dash-brand">
                      <MessageSquare size={16} />
                    </span>
                    <h3 className="text-base font-bold text-dash-text">Log Note or Communication</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMsgModal(false)}
                    className="rounded-lg p-1 text-dash-subtle hover:bg-dash-bg hover:text-dash-text"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={sendCommunication} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dash-muted mb-1.5">
                      Send to
                    </label>
                    <select
                      value={commVisibility}
                      onChange={(e) => setCommVisibility(e.target.value as typeof commVisibility)}
                      className="w-full rounded-xl border border-dash-border bg-white px-3.5 py-2.5 text-sm text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                    >
                      <option value="internal">Internal note (Admin only)</option>
                      <option value="customer">Customer (send email)</option>
                      <option value="supplier">Supplier (send email)</option>
                      <option value="agent">Agent (send email)</option>
                      <option value="all">All booking parties (send email)</option>
                    </select>
                    <p className="mt-1.5 text-xs text-dash-muted">
                      {commVisibility === "internal" ? "This note is visible only in the Admin Portal." : "This communication is emailed to the selected booking recipient and recorded below."}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dash-muted mb-1.5">
                      Subject
                    </label>
                    <input
                      value={commSubject}
                      onChange={(e) => setCommSubject(e.target.value)}
                      placeholder="e.g. Flight delay notice, supplier inquiry…"
                      className="w-full rounded-xl border border-dash-border px-3.5 py-2.5 text-sm text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dash-muted mb-1.5">
                      Message Content
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={commMessage}
                      onChange={(e) => setCommMessage(e.target.value)}
                      placeholder="Write message details or notes…"
                      className="w-full resize-none rounded-xl border border-dash-border px-3.5 py-2.5 text-sm text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMsgModal(false)}
                      className="rounded-xl border border-dash-border bg-white px-4 py-2.5 text-xs font-bold text-dash-body hover:bg-dash-bg hover:text-dash-text"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingComm || !commMessage.trim()}
                      className="flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-dash-brand-hover disabled:opacity-50 shadow-sm"
                    >
                      {sendingComm ? <Loader2 className="animate-spin" size={14} /> : null}
                      Post Communication
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </ModuleWrapper>
  );
}

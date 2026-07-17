"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { Booking, getBookingDetail } from "@/lib/api/services/bookingService";
import BookingStatusBadge from "@/components/bookings/BookingStatusBadge";
import SupplierPicker from "@/components/bookings/SupplierPicker";
import api from "@/lib/api/client";
import { LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2, LuMail as Mail, LuMessageSquare as MessageSquare, LuRefreshCw as RefreshCw, LuTicket as Ticket, LuUserCheck as UserCheck, LuUsers as Users, LuCircleX as XCircle } from "react-icons/lu";

type DetailPanelProps = { title: string; children: React.ReactNode };
type DetailFieldProps = { label: string; value?: React.ReactNode };

function DetailPanel({ title, children }: DetailPanelProps) {
  return (
    <section className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <h2 className="mb-4 text-sm font-bold uppercase text-dash-muted">{title}</h2>
      {children}
    </section>
  );
}

function DetailField({ label, value }: DetailFieldProps) {
  const displayValue = value === null || value === undefined || value === "" ? "-" : value;
  return (
    <div>
      <p className="text-xs font-bold uppercase text-dash-subtle">{label}</p>
      <p className="mt-1 text-sm font-semibold text-dash-text">{displayValue}</p>
    </div>
  );
}

function StatusTimeline({ booking }: { booking: Booking }) {
  const historyItems = booking.status_history || [];
  if (historyItems.length === 0) {
    return <p className="text-sm text-dash-muted">No status history yet.</p>;
  }
  return (
    <div className="space-y-3">
      {historyItems.map((h) => (
        <div key={h.id} className="border-l-2 border-dash-brand/40 pl-3">
          <p className="text-sm font-bold text-dash-text">
            {(h.old_status || "created").replaceAll("_", " ")} → {h.new_status.replaceAll("_", " ")}
          </p>
          <p className="text-xs text-dash-muted">{h.reason || "No reason"}</p>
          {h.created_at && <p className="text-[11px] text-dash-subtle">{new Date(h.created_at).toLocaleString()}</p>}
        </div>
      ))}
    </div>
  );
}

const BOOKING_STATUSES = [
  "draft",
  "pending_payment",
  "payment_authorized",
  "pending_supplier_acceptance",
  "confirmed",
  "upcoming",
  "ongoing",
  "postponed",
  "completed",
  "declined",
  "cancelled",
  "refunded",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  // Status change state
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  // Assign supplier state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Communication state
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [commMessage, setCommMessage] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [sendingComm, setSendingComm] = useState(false);

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
      setActionMsg(`Status changed to ${newStatus.replaceAll("_", " ")}`);
      setShowStatusForm(false);
      setNewStatus("");
      setStatusReason("");
      await fetchBooking();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setActionErr(e?.response?.data?.detail || "Failed to change status.");
    } finally {
      setChangingStatus(false);
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
      setShowAssignForm(false);
      setSupplierId(null);
      await fetchBooking();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setActionErr(e?.response?.data?.detail || "Failed to assign supplier.");
    } finally {
      setAssigning(false);
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
        visibility: "internal",
        message_type: "admin_message",
      });
      setActionMsg("Communication sent");
      setShowMsgForm(false);
      setCommMessage("");
      setCommSubject("");
      await fetchBooking();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setActionErr(e?.response?.data?.detail || "Failed to send communication.");
    } finally {
      setSendingComm(false);
    }
  }

  const activityItems = booking?.optional_activities || [];
  const accommodationItems = booking?.accommodations || [];
  const extensionItems = booking?.extensions || [];
  const travellers = booking?.travellers || [];
  const communications = booking?.communications || [];

  return (
    <ModuleWrapper title="Booking Detail" requiredPermission="bookings.view">
      {isLoading ? <Loader label="Loading booking..." /> : null}

      {!isLoading && (errorMessage || !booking) ? (
        <p className="text-sm text-red-600">{errorMessage || "Booking not found."}</p>
      ) : null}

      {!isLoading && booking ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="h-2 bg-gradient-to-r from-dash-brand to-dash-brand-hover" />
            <div className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-dash-brand to-dash-brand-hover text-lg font-black text-white shadow-[0_4px_12px_rgb(67,169,246,0.35)]">
                    {initials(booking.customer_name || booking.booking_code)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl font-black tracking-tight text-dash-text">{booking.booking_code}</h1>
                      <BookingStatusBadge value={booking.booking_status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-dash-body">{booking.tour_name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dash-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={14} className="text-dash-subtle" />
                        {booking.customer_name || `Customer #${booking.customer_id}`}
                      </span>
                      {booking.customer_email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={14} className="text-dash-subtle" />
                          {booking.customer_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setShowStatusForm(!showStatusForm); setShowAssignForm(false); setShowMsgForm(false); }}
                    className="flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-bold text-dash-body hover:bg-[#F3F8FC] transition-all">
                    <RefreshCw size={14} /> Change Status
                  </button>
                  <button type="button" onClick={() => { setShowAssignForm(!showAssignForm); setShowStatusForm(false); setShowMsgForm(false); }}
                    className="flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-bold text-dash-body hover:bg-[#F3F8FC] transition-all">
                    <UserCheck size={14} /> Assign Supplier
                  </button>
                  <button type="button" onClick={() => { setShowMsgForm(!showMsgForm); setShowStatusForm(false); setShowAssignForm(false); }}
                    className="flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-bold text-dash-body hover:bg-[#F3F8FC] transition-all">
                    <MessageSquare size={14} /> Send Communication
                  </button>
                </div>
              </div>
            </div>
          </section>

          {actionMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={16} />{actionMsg}
              <button type="button" onClick={() => setActionMsg("")} className="ml-auto text-xs font-bold opacity-60 hover:opacity-100">×</button>
            </div>
          )}
          {actionErr && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              <XCircle size={16} />{actionErr}
              <button type="button" onClick={() => setActionErr("")} className="ml-auto text-xs font-bold opacity-60 hover:opacity-100">×</button>
            </div>
          )}

          {showStatusForm && (
            <form onSubmit={changeStatus} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <p className="mb-3 font-bold text-dash-text">Change Booking Status</p>
              <div className="flex flex-wrap gap-3">
                <select required title="New booking status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand">
                  <option value="">Select new status…</option>
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                  ))}
                </select>
                <input value={statusReason} onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="flex-1 min-w-[200px] rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand" />
                <button type="submit" disabled={changingStatus}
                  className="flex items-center gap-2 rounded-xl bg-dash-text px-4 py-2 text-sm font-bold text-white hover:bg-[#1e2d3f] disabled:opacity-60">
                  {changingStatus ? <Loader2 className="animate-spin" size={14} /> : null}
                  Update Status
                </button>
              </div>
            </form>
          )}

          {showAssignForm && (
            <form onSubmit={assignSupplier} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <p className="mb-3 font-bold text-dash-text">Assign Supplier</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[260px] flex-1">
                  <SupplierPicker value={supplierId} onChange={(id) => setSupplierId(id)} />
                </div>
                <button type="submit" disabled={assigning || !supplierId}
                  className="flex items-center gap-2 rounded-xl bg-dash-text px-4 py-2 text-sm font-bold text-white hover:bg-[#1e2d3f] disabled:opacity-60">
                  {assigning ? <Loader2 className="animate-spin" size={14} /> : null}
                  Assign
                </button>
              </div>
            </form>
          )}

          {showMsgForm && (
            <form onSubmit={sendCommunication} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <p className="mb-3 font-bold text-dash-text">Send Communication</p>
              <div className="space-y-3">
                <input value={commSubject} onChange={(e) => setCommSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="w-full rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand" />
                <textarea required rows={3} value={commMessage} onChange={(e) => setCommMessage(e.target.value)}
                  placeholder="Message to send..."
                  className="w-full resize-none rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand" />
                <button type="submit" disabled={sendingComm}
                  className="flex items-center gap-2 rounded-xl bg-dash-text px-4 py-2 text-sm font-bold text-white hover:bg-[#1e2d3f] disabled:opacity-60">
                  {sendingComm ? <Loader2 className="animate-spin" size={14} /> : null}
                  Send
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <DetailPanel title="Summary">
              <div className="grid gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-dash-subtle">Booking Status</p>
                  <div className="mt-1"><BookingStatusBadge value={booking.booking_status} /></div>
                </div>
                <DetailField label="Supplier Status" value={booking.supplier_acceptance_status?.replaceAll("_", " ")} />
                <div>
                  <p className="text-xs font-bold uppercase text-dash-subtle">Payment Status</p>
                  <div className="mt-1"><BookingStatusBadge value={booking.payment_status} /></div>
                </div>
                <DetailField label="Travellers" value={booking.total_travellers} />
              </div>
            </DetailPanel>

            <DetailPanel title="Money">
              <div className="grid gap-4">
                <DetailField label="Final" value={`${booking.currency} ${booking.final_amount}`} />
                <DetailField label="Paid" value={`${booking.currency} ${booking.amount_paid}`} />
                <DetailField label="Pending" value={`${booking.currency} ${booking.amount_pending}`} />
                <DetailField label="Payment Type" value={booking.payment_type} />
              </div>
            </DetailPanel>

            <DetailPanel title="Travel">
              <div className="grid gap-4">
                <DetailField label="Date" value={booking.tour_date} />
                <DetailField label="Country" value={booking.country} />
                <DetailField label="Supplier" value={booking.supplier_name} />
                <DetailField label="Adults" value={booking.no_of_adults} />
                <DetailField label="Children" value={booking.no_of_children} />
                <DetailField label="Infants" value={booking.no_of_infants} />
              </div>
            </DetailPanel>
          </div>

          {travellers.length > 0 && (
            <DetailPanel title="Travellers">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {travellers.map((t, index) => (
                  <div key={t.id ?? index} className="rounded-xl bg-dash-bg p-3">
                    <p className="text-sm font-bold text-dash-text">{t.full_name}</p>
                    <p className="text-xs text-dash-subtle">
                      {t.traveller_type ? t.traveller_type.charAt(0).toUpperCase() + t.traveller_type.slice(1) : "Traveller"}
                      {t.age !== undefined && t.age !== null ? ` · ${t.age} yrs` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}

          {(activityItems.length > 0 || accommodationItems.length > 0 || extensionItems.length > 0) && (
            <DetailPanel title="Add-ons">
              <div className="space-y-4">
                {[
                  { label: "Optional Activities", items: activityItems },
                  { label: "Accommodations", items: accommodationItems },
                  { label: "Extensions", items: extensionItems },
                ]
                  .filter((group) => group.items.length > 0)
                  .map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-dash-subtle">
                        <Ticket size={13} /> {group.label}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.items.map((item, index) => (
                          <div key={item.id ?? index} className="flex items-center justify-between rounded-xl bg-dash-bg px-3 py-2 text-sm">
                            <span className="font-semibold text-dash-body">{item.activity_name_snapshot || item.accommodation_name_snapshot || item.extension_name_snapshot || item.name || item.title || "Item"}</span>
                            <span className="font-bold text-dash-text">{item.total_price || item.unit_price || item.amount || item.price || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </DetailPanel>
          )}

          <DetailPanel title="Status Timeline">
            <StatusTimeline booking={booking} />
          </DetailPanel>

          {communications.length > 0 && (
            <DetailPanel title="Communications">
              <div className="space-y-3">
                {communications.map((c) => (
                  <div key={c.id} className="rounded-xl bg-dash-bg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-dash-subtle">
                        <MessageSquare size={12} /> {c.sender_type || "System"}
                      </span>
                      {c.created_at && <span className="text-[11px] text-dash-subtle">{new Date(c.created_at).toLocaleString()}</span>}
                    </div>
                    <p className="mt-1 text-sm text-dash-body">{c.message}</p>
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}

          <DetailPanel title="Notes">
            <div className="grid gap-4 md:grid-cols-3">
              <DetailField label="General" value={booking.notes || "No general notes."} />
              <DetailField label="Customer" value={booking.customer_notes || "No customer notes."} />
              <DetailField label="Admin" value={booking.admin_notes || "No admin notes."} />
            </div>
          </DetailPanel>
        </div>
      ) : null}
    </ModuleWrapper>
  );
}

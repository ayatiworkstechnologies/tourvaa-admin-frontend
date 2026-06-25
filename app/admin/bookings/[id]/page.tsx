"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { Booking, getBookingDetail } from "@/lib/services/bookingService";
import api from "@/lib/api";
import { CheckCircle2, Loader2, MessageSquare, RefreshCw, UserCheck, XCircle } from "lucide-react";

type DetailPanelProps = { title: string; children: React.ReactNode };
type DetailFieldProps = { label: string; value?: React.ReactNode };

function DetailPanel({ title, children }: DetailPanelProps) {
  return (
    <section className="rounded-lg border border-[#E7EAF0] bg-white p-5">
      <h2 className="mb-4 text-sm font-bold uppercase text-[#667085]">{title}</h2>
      {children}
    </section>
  );
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[#98A2B3]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#121826]">{value || "-"}</p>
    </div>
  );
}

function StatusTimeline({ booking }: { booking: Booking }) {
  const historyItems = booking.status_history || [];
  if (historyItems.length === 0) {
    return <p className="text-sm text-[#667085]">No status history yet.</p>;
  }
  return (
    <div className="space-y-3">
      {historyItems.map((h) => (
        <div key={h.id} className="border-l-2 border-blue-200 pl-3">
          <p className="text-sm font-bold text-[#121826]">
            {h.old_status || "created"} → {h.new_status}
          </p>
          <p className="text-xs text-[#667085]">{h.reason || "No reason"}</p>
        </div>
      ))}
    </div>
  );
}

const BOOKING_STATUSES = [
  "confirmed", "ongoing", "completed", "cancelled", "pending_payment", "pending_supplier_acceptance",
];

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
  const [supplierId, setSupplierId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Communication state
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [commMessage, setCommMessage] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [sendingComm, setSendingComm] = useState(false);

  async function fetchBooking() {
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
  }

  useEffect(() => { void fetchBooking(); }, [params.id]);

  async function changeStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatus) return;
    setChangingStatus(true);
    setActionErr("");
    try {
      await api.patch(`/bookings/${params.id}/status`, { booking_status: newStatus, reason: statusReason });
      setActionMsg(`Status changed to ${newStatus}`);
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
      await api.post(`/bookings/${params.id}/assign-supplier`, { supplier_id: Number(supplierId) });
      setActionMsg("Supplier assigned successfully");
      setShowAssignForm(false);
      setSupplierId("");
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setActionErr(e?.response?.data?.detail || "Failed to send communication.");
    } finally {
      setSendingComm(false);
    }
  }

  return (
    <ModuleWrapper title="Booking Detail" requiredPermission="bookings.view">
      {isLoading ? <Loader label="Loading booking..." /> : null}

      {!isLoading && (errorMessage || !booking) ? (
        <p className="text-sm text-red-600">{errorMessage || "Booking not found."}</p>
      ) : null}

      {!isLoading && booking ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#121826]">{booking.booking_code}</h1>
              <p className="text-sm text-[#667085]">{booking.tour_name}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setShowStatusForm(!showStatusForm); setShowAssignForm(false); setShowMsgForm(false); }}
                className="flex items-center gap-1.5 rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-xs font-bold text-[#344054] hover:bg-[#F3F8FC] transition-all">
                <RefreshCw size={14} /> Change Status
              </button>
              <button type="button" onClick={() => { setShowAssignForm(!showAssignForm); setShowStatusForm(false); setShowMsgForm(false); }}
                className="flex items-center gap-1.5 rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-xs font-bold text-[#344054] hover:bg-[#F3F8FC] transition-all">
                <UserCheck size={14} /> Assign Supplier
              </button>
              <button type="button" onClick={() => { setShowMsgForm(!showMsgForm); setShowStatusForm(false); setShowAssignForm(false); }}
                className="flex items-center gap-1.5 rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-xs font-bold text-[#344054] hover:bg-[#F3F8FC] transition-all">
                <MessageSquare size={14} /> Send Communication
              </button>
            </div>
          </div>

          {/* Feedback banners */}
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

          {/* Change status form */}
          {showStatusForm && (
            <form onSubmit={changeStatus} className="rounded-xl border border-[#E7EAF0] bg-white p-5">
              <p className="mb-3 font-bold text-[#121826]">Change Booking Status</p>
              <div className="flex flex-wrap gap-3">
                <select required title="New booking status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-[#43A9F6]">
                  <option value="">Select new status…</option>
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                  ))}
                </select>
                <input value={statusReason} onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="flex-1 min-w-[200px] rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-[#43A9F6]" />
                <button type="submit" disabled={changingStatus}
                  className="flex items-center gap-2 rounded-xl bg-[#121826] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e2d3f] disabled:opacity-60">
                  {changingStatus ? <Loader2 className="animate-spin" size={14} /> : null}
                  Update Status
                </button>
              </div>
            </form>
          )}

          {/* Assign supplier form */}
          {showAssignForm && (
            <form onSubmit={assignSupplier} className="rounded-xl border border-[#E7EAF0] bg-white p-5">
              <p className="mb-3 font-bold text-[#121826]">Assign Supplier</p>
              <div className="flex gap-3">
                <input required type="number" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                  placeholder="Supplier ID"
                  className="rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-[#43A9F6] w-40" />
                <button type="submit" disabled={assigning}
                  className="flex items-center gap-2 rounded-xl bg-[#121826] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e2d3f] disabled:opacity-60">
                  {assigning ? <Loader2 className="animate-spin" size={14} /> : null}
                  Assign
                </button>
              </div>
            </form>
          )}

          {/* Communication form */}
          {showMsgForm && (
            <form onSubmit={sendCommunication} className="rounded-xl border border-[#E7EAF0] bg-white p-5">
              <p className="mb-3 font-bold text-[#121826]">Send Communication</p>
              <div className="space-y-3">
                <input value={commSubject} onChange={(e) => setCommSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-[#43A9F6]" />
                <textarea required rows={3} value={commMessage} onChange={(e) => setCommMessage(e.target.value)}
                  placeholder="Message to send..."
                  className="w-full resize-none rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm outline-none focus:border-[#43A9F6]" />
                <button type="submit" disabled={sendingComm}
                  className="flex items-center gap-2 rounded-xl bg-[#121826] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e2d3f] disabled:opacity-60">
                  {sendingComm ? <Loader2 className="animate-spin" size={14} /> : null}
                  Send
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <DetailPanel title="Summary">
              <div className="grid gap-4">
                <DetailField label="Booking Status" value={booking.booking_status} />
                <DetailField label="Supplier Status" value={booking.supplier_acceptance_status} />
                <DetailField label="Payment Status" value={booking.payment_status} />
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
              </div>
            </DetailPanel>
          </div>

          <DetailPanel title="Status Timeline">
            <StatusTimeline booking={booking} />
          </DetailPanel>

          <DetailPanel title="Notes">
            <p className="text-sm text-[#667085]">{booking.notes || "No notes."}</p>
          </DetailPanel>
        </div>
      ) : null}
    </ModuleWrapper>
  );
}

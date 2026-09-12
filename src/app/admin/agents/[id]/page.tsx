"use client";

import Link from "next/link";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuBan as Ban, LuBriefcase as Briefcase, LuCalendarCheck as CalendarCheck, LuCheck as Check, LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuFileCheck2 as FileText, LuLayoutDashboard as LayoutDashboard, LuMapPin as MapPin, LuPercent as Percent, LuReceipt as Receipt, LuShieldHalf as ShieldHalf, LuUsers as Users, LuWallet as Wallet, LuX as X, LuCircleX as XCircle } from "react-icons/lu";

import api from "@/lib/api/client";
import ActionModal from "@/components/operations/ActionModal";
import CompletionChecklist from "@/components/operations/CompletionChecklist";
import ReviewProfileHero from "@/components/operations/ReviewProfileHero";
import LocationEditModal from "@/components/common/LocationEditModal";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/operations/StatusBadge";
import { approveReviewRecord, getReviewRecord, partialApproveReviewRecord, rejectAgentCommissionRequest, rejectReviewRecord, reviewAgentDocument, ReviewRecord, updateCommercialValue, updateReviewRecord } from "@/lib/api/services/operationsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { openPrivateDocument } from "@/lib/api/services/privateDocumentService";

type DetailValue = string | number | boolean | null | undefined;
type DetailObject = Record<string, DetailValue>;
type AgentDocument = DetailObject & { id?: number; file_url?: string; file_path?: string };
type AgentContact = DetailObject & { id?: number; email?: string; phone?: string; is_primary?: boolean };

function apiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  return error.response?.data?.message || error.response?.data?.detail || fallback;
}

function valueText(value: DetailValue) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function titleize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function InfoGrid({ rows }: { rows: [string, DetailValue][] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-dash-bg p-4">
          <p className="text-xs font-bold uppercase text-dash-subtle">{label}</p>
          <div className="mt-1 text-sm font-semibold text-dash-text">
            {label.toLowerCase().includes("status") || label.toLowerCase() === "approval" ? (
              <StatusBadge value={String(value || "")} />
            ) : (
              valueText(value)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompletionCard({ record }: { record: ReviewRecord }) {
  const documents = (record.documents ?? []) as AgentDocument[];
  const checks = [
    { label: "Profile", done: Boolean(record.agent_name && record.agent_type && record.country_name && record.city_name) },
    { label: "Business registration", done: Boolean(record.business_info?.iata_registration_number || record.business_info?.gst_tax_number) },
    { label: "Invoicing", done: Boolean(record.invoicing && Object.values(record.invoicing).some(Boolean)) },
    { label: "Documents", done: documents.length > 0 },
  ];

  return <CompletionChecklist checks={checks} />;
}

function KeyValueList({ data, empty }: { data?: Record<string, unknown> | null; empty: string }) {
  const entries = Object.entries(data ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (entries.length === 0) return <p className="rounded-lg bg-dash-bg p-4 text-sm font-semibold text-dash-muted">{empty}</p>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg bg-dash-bg p-4">
          <p className="text-xs font-bold uppercase text-dash-subtle">{titleize(key)}</p>
          <p className="mt-1 break-words text-sm font-semibold text-dash-text">{valueText(value as DetailValue)}</p>
        </div>
      ))}
    </div>
  );
}

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [record, setRecord] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"reject" | "partial" | "commercial" | "block" | "reject-document" | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "customers" | "business" | "invoicing" | "documents">("overview");
  const [reviewDocumentId, setReviewDocumentId] = useState<number | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [agentCommissionMax, setAgentCommissionMax] = useState<number | null>(null);

  useEffect(() => {
    api.get("/settings/public")
      .then((res) => {
        const raw = res.data?.data?.agent_commission_max_percentage;
        if (raw !== undefined) setAgentCommissionMax(Number(raw));
      })
      .catch(() => {});
  }, []);

  const approvalStatus = String(record?.approval_status || "").toLowerCase();
  const accountStatus = String(record?.status || "").toLowerCase();
  const isApproved = ["approved", "approved_live"].includes(approvalStatus);
  const isRejected = approvalStatus === "rejected";
  const isBlocked = ["blocked", "suspended"].includes(accountStatus) || ["blocked", "suspended"].includes(approvalStatus);
  const canApprove = hasPermission("agents.approve") && !isApproved && !isBlocked;
  const canReject = hasPermission("agents.reject") && !isRejected && !isBlocked;
  const canPartial = !isApproved && !isBlocked && (hasPermission("agents.partial_approve") || canApprove);
  const canCommercial = hasPermission("agents.manage_discount");
  const canBlock = hasPermission("agents.edit") || hasPermission("agents.approve");
  const canEditLocation = hasPermission("agents.edit");
  const canReviewDocuments = hasPermission("agents.approve") || hasPermission("agents.reject");
  const canViewBookings = hasPermission("bookings.view") || hasPermission("view-bookings");
  const canViewCustomers = hasPermission("customers.view") || hasPermission("view-customers");
  const canViewTour = hasPermission("tours.view") || hasPermission("view-tours");

  const requestIdRef = useRef(0);

  const fetchRecord = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getReviewRecord("agents", id);
      if (requestIdRef.current !== requestId) return;
      setRecord(data);
    } catch {
      if (requestIdRef.current !== requestId) return;
      toast.error("Could not load agent detail.");
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { void fetchRecord(); }, [fetchRecord]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setSaving(true);
    try {
      await action();
      toast.success(message);
      setModal(null);
      await fetchRecord();
    } catch (error) {
      toast.error(apiError(error, "Action failed."));
    } finally {
      setSaving(false);
    }
  };

  const documents = (record?.documents ?? []) as AgentDocument[];
  const contacts = (record?.contacts ?? []) as AgentContact[];
  const primaryContact = contacts.find((contact) => contact.is_primary) ?? contacts[0];
  const activity = record?.activity;
  const summary = activity?.summary;

  const moneyText = (value?: string, currency = "USD") => {
    const amount = Number(value || 0);
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const viewDocument = async (documentId: number) => {
    try {
      await openPrivateDocument("agent", documentId);
    } catch {
      toast.error("Could not open agent document.");
    }
  };

  const approveDocument = (documentId: number) =>
    void run(() => reviewAgentDocument(id, documentId, { status: "approved" }), "Document approved.");

  const rejectDocument = (payload: Record<string, string | number>) => {
    if (reviewDocumentId === null) return;
    void run(
      () => reviewAgentDocument(id, reviewDocumentId, { status: "rejected", rejection_reason: String(payload.rejection_reason || "") }),
      "Document rejected and re-upload requested."
    );
  };

  const saveLocation = async (value: { country_id: number | null; city_id: number | null }) => {
    setSaving(true);
    try {
      await updateReviewRecord("agents", id, value);
      toast.success("Agent location updated.");
      setLocationModalOpen(false);
      await fetchRecord();
    } catch (error) {
      toast.error(apiError(error, "Could not update agent location."));
    } finally {
      setSaving(false);
    }
  };

  const tabs = useMemo(
    () => [
      { key: "overview" as const, label: "Overview", icon: LayoutDashboard },
      ...(canViewBookings ? [{ key: "bookings" as const, label: "Bookings", icon: CalendarCheck, count: summary?.total_bookings ?? 0 }] : []),
      ...(canViewCustomers ? [{ key: "customers" as const, label: "Customers", icon: Users, count: summary?.total_customers ?? 0 }] : []),
      { key: "business" as const, label: "Business Info", icon: Briefcase },
      { key: "invoicing" as const, label: "Invoicing", icon: Receipt },
      { key: "documents" as const, label: "Documents", icon: FileText, count: documents.length },
    ],
    [canViewBookings, canViewCustomers, documents.length, summary?.total_bookings, summary?.total_customers]
  );

  return (
    <ModuleWrapper title="Agent Detail" requiredPermission="agents.view">
      {loading ? (
        <Loader label="Loading agent detail..." />
      ) : record ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/admin/agents" className="inline-flex items-center gap-2 text-sm font-bold text-dash-text hover:text-dash-brand-hover">
              <ArrowLeft size={16} /> Back to agents
            </Link>
            <div className="flex flex-wrap gap-2">
              {canApprove && <button onClick={() => void run(() => approveReviewRecord("agents", id), "Agent approved.")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 size={16} /> Approve</button>}
              {canPartial && <button onClick={() => setModal("partial")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><ShieldHalf size={16} /> Request Changes</button>}
              {canReject && <button onClick={() => setModal("reject")} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"><XCircle size={16} /> Reject</button>}
              {canBlock && <button onClick={() => isBlocked ? void run(() => updateReviewRecord("agents", id, { status: "active" }), "Agent unblocked.") : setModal("block")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><Ban size={16} /> {isBlocked ? "Unblock" : "Block"}</button>}
              {canCommercial && <button onClick={() => setModal("commercial")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><Percent size={16} /> Discount</button>}
              {canEditLocation && <button onClick={() => setLocationModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><MapPin size={16} /> Edit Location</button>}
            </div>
          </div>

          <ReviewProfileHero
            name={String(record.agent_name || record.name || "-")}
            code={record.agent_code || record.code}
            entityType={record.agent_type || record.type}
            countryName={record.country_name}
            cityName={record.city_name}
            yearsInOperation={record.years_in_operation}
            status={record.status}
            approvalStatus={record.approval_status}
            rejectionReason={record.rejection_reason}
            adminComments={record.admin_comments || record.pending_requirements}
            contactEmail={primaryContact?.email}
            contactPhone={primaryContact?.phone}
          />

          {record.discount_type && (
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <p className="text-xs font-bold uppercase tracking-wide text-dash-subtle">Discount</p>
              <p className="mt-1 text-lg font-black text-dash-text">
                {record.discount_type}: {record.discount_value ?? 0}
              </p>
            </div>
          )}

          {record.commission_request_status === "pending" && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Commission request pending</p>
                <p className="mt-1 text-lg font-black text-dash-text">{record.commission_request_type}: {record.commission_request_value ?? 0}</p>
                <p className="mt-1 text-xs text-dash-muted">Submitted from the agent dashboard for administration approval.</p>
              </div>
              <div className="flex gap-2">
                {canCommercial && <button type="button" disabled={saving} onClick={() => void run(() => rejectAgentCommissionRequest(id), "Commission request rejected.")} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-50"><X size={16} />Reject request</button>}
                {canCommercial && <button type="button" disabled={saving} onClick={() => void run(() => updateCommercialValue("agents", id, { discount_type: String(record.commission_request_type || "percentage"), discount_value: Number(record.commission_request_value || 0) }), "Commission request approved.")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Check size={16} />Approve request</button>}
              </div>
            </div>
          )}

          <CompletionCard record={record} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total bookings", value: summary?.total_bookings ?? 0, icon: CalendarCheck },
              { label: "Customers", value: summary?.total_customers ?? 0, icon: Users },
              { label: "Booking value", value: moneyText(summary?.total_booking_value), icon: Receipt },
              { label: "Amount paid", value: moneyText(summary?.amount_paid), icon: Wallet },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-dash-subtle">{item.label}</p>
                    <p className="mt-2 text-2xl font-black text-dash-text">{item.value}</p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#EDF5FF] text-dash-brand-hover"><item.icon size={21} /></span>
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap gap-1 border-b border-[#F0F3F8] p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                    activeTab === tab.key ? "bg-[#EDF5FF] text-dash-brand-hover" : "text-dash-muted hover:bg-dash-bg"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        activeTab === tab.key ? "bg-white text-dash-brand-hover" : "bg-[#F0F3F8] text-dash-subtle"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-dash-border p-5">
                    <h3 className="text-base font-black text-dash-text">Booking performance</h3>
                    <InfoGrid rows={[
                      ["Confirmed", summary?.confirmed_bookings],
                      ["Completed", summary?.completed_bookings],
                      ["Cancelled", summary?.cancelled_bookings],
                      ["Amount pending", moneyText(summary?.amount_pending)],
                    ]} />
                  </div>
                  <div className="rounded-xl border border-dash-border p-5">
                    <h3 className="text-base font-black text-dash-text">Agent account</h3>
                    <InfoGrid rows={[
                      ["Agent code", record.agent_code],
                      ["Agent type", record.agent_type],
                      ["Account status", record.status],
                      ["Approval", record.approval_status],
                      ["Years operating", record.years_in_operation],
                      ["Created", record.created_at],
                    ]} />
                  </div>
                </div>
              )}

              {activeTab === "bookings" && canViewBookings && (
                activity?.recent_bookings.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead><tr className="border-b border-dash-border text-xs uppercase text-dash-subtle"><th className="p-3">Booking</th><th className="p-3">Customer</th><th className="p-3">Tour</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr></thead>
                      <tbody>{activity.recent_bookings.map((booking) => <tr key={booking.id} className="border-b border-dash-border-soft last:border-0"><td className="p-3 font-bold text-dash-text">{booking.booking_code}</td><td className="p-3 text-dash-muted">{booking.customer_name || "-"}</td><td className="p-3 text-dash-muted">{canViewTour && booking.tour_id ? <Link href={`/admin/tours/${booking.tour_id}/edit`} className="inline-flex items-center gap-1.5 font-semibold text-dash-brand-hover hover:underline"><Eye size={14} className="shrink-0" />{booking.tour_name || "View tour"}</Link> : (booking.tour_name || "-")}</td><td className="p-3 font-semibold text-dash-text">{moneyText(booking.final_amount, booking.currency)}</td><td className="p-3"><StatusBadge value={booking.booking_status} /></td><td className="p-3 text-right"><Link href={`/admin/bookings/${booking.id}`} className="inline-flex items-center gap-1.5 font-bold text-dash-brand-hover hover:underline"><Eye size={15} /> View</Link></td></tr>)}</tbody>
                    </table>
                  </div>
                ) : <p className="rounded-lg bg-dash-bg p-4 text-sm font-semibold text-dash-muted">No bookings have been created by this agent yet.</p>
              )}

              {activeTab === "customers" && canViewCustomers && (
                activity?.customers.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead><tr className="border-b border-dash-border text-xs uppercase text-dash-subtle"><th className="p-3">Customer</th><th className="p-3">Contact</th><th className="p-3">Bookings</th><th className="p-3">Booking value</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr></thead>
                      <tbody>{activity.customers.map((customer) => <tr key={customer.id} className="border-b border-dash-border-soft last:border-0"><td className="p-3"><p className="font-bold text-dash-text">{customer.full_name}</p><p className="text-xs text-dash-subtle">{customer.customer_code || `#${customer.id}`}</p></td><td className="p-3"><p className="text-dash-muted">{customer.email}</p><p className="text-xs text-dash-subtle">{customer.phone || "-"}</p></td><td className="p-3 font-semibold text-dash-text">{customer.booking_count}</td><td className="p-3 font-semibold text-dash-text">{moneyText(customer.booking_value)}</td><td className="p-3"><StatusBadge value={customer.status} /></td><td className="p-3 text-right"><Link href={`/admin/customers/${customer.id}`} className="inline-flex items-center gap-1.5 font-bold text-dash-brand-hover hover:underline"><Eye size={15} /> View</Link></td></tr>)}</tbody>
                    </table>
                  </div>
                ) : <p className="rounded-lg bg-dash-bg p-4 text-sm font-semibold text-dash-muted">No customers are associated with this agent yet.</p>
              )}

              {activeTab === "business" && (
                <KeyValueList data={record.business_info} empty="No business registration information submitted yet." />
              )}

              {activeTab === "invoicing" && (
                <KeyValueList data={record.invoicing} empty="No invoicing information submitted yet." />
              )}

              {activeTab === "documents" &&
                (documents.length === 0 ? (
                  <p className="rounded-lg bg-dash-bg p-4 text-sm font-semibold text-dash-muted">No agent documents uploaded yet.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {documents.map((doc, index) => (
                      <div key={doc.id ?? index} className="rounded-xl border border-dash-border p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-dash-brand" />
                            <p className="text-sm font-bold text-dash-text">{valueText(doc.document_name || doc.document_type)}</p>
                          </div>
                          <StatusBadge value={String(doc.status || "pending")} />
                        </div>
                        <InfoGrid rows={[
                          ["Type", doc.document_type],
                          ["Mime", doc.mime_type],
                          ["Uploaded", doc.uploaded_at],
                          ["Reason", doc.rejection_reason],
                        ]} />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {(doc.file_url || doc.file_path) && doc.id !== undefined && (
                            <button type="button" onClick={() => void viewDocument(doc.id!)} className="inline-flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-brand-hover hover:bg-[#E7F5FF]">
                              <Eye size={14} /> View document
                            </button>
                          )}
                          {canReviewDocuments && doc.status !== "approved" && doc.id !== undefined && (
                            <button type="button" onClick={() => approveDocument(doc.id!)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><Check size={14} />Accept</button>
                          )}
                          {canReviewDocuments && doc.status !== "rejected" && doc.id !== undefined && (
                            <button type="button" onClick={() => { setReviewDocumentId(doc.id!); setModal("reject-document"); }} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"><X size={14} />Reject</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </section>

          <ActionModal open={modal === "reject"} title="Reject agent" saving={saving} submitLabel="Reject" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => rejectReviewRecord("agents", id, { rejection_reason: String(payload.rejection_reason || ""), admin_comments: String(payload.admin_comments || "") }), "Agent rejected.")} fields={[{ name: "rejection_reason", label: "Rejection reason" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "partial"} title="Request agent changes" saving={saving} submitLabel="Send request" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => partialApproveReviewRecord("agents", id, { admin_comments: String(payload.admin_comments || ""), pending_requirements: String(payload.pending_requirements || "") }), "Agent change request sent.")} fields={[{ name: "pending_requirements", label: "Required changes", type: "textarea" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "block"} title="Block agent" saving={saving} submitLabel="Block" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => updateReviewRecord("agents", id, { status: "blocked", admin_comments: String(payload.admin_comments || "") }), "Agent blocked.")} fields={[{ name: "admin_comments", label: "Block reason / admin note", type: "textarea" }]} />
          <ActionModal open={modal === "commercial"} title="Update discount" saving={saving} submitLabel="Save" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => updateCommercialValue("agents", id, { discount_type: payload.value_type, discount_value: payload.value }), "Discount updated.")} fields={[{ name: "value_type", label: "Discount type", type: "select", options: [{ label: "Percentage", value: "percentage" }, { label: "Fixed", value: "fixed" }] }, { name: "value", label: `Discount value${agentCommissionMax !== null ? ` (max ${agentCommissionMax}% if percentage)` : ""}`, type: "number" }]} />
          <ActionModal open={modal === "reject-document"} title="Reject agent document" saving={saving} submitLabel="Reject and request re-upload" onClose={() => { setModal(null); setReviewDocumentId(null); }} onSubmit={rejectDocument} fields={[{ name: "rejection_reason", label: "Reason and re-upload instructions", type: "textarea" }]} />
          <LocationEditModal
            open={locationModalOpen}
            title="Edit agent location"
            countryId={record.country_id ?? null}
            cityId={record.city_id ?? null}
            saving={saving}
            onClose={() => setLocationModalOpen(false)}
            onSave={(value) => void saveLocation(value)}
          />
        </div>
      ) : (
        <section className="rounded-xl border border-dash-border bg-white p-10 text-center text-dash-muted">Agent not found.</section>
      )}
    </ModuleWrapper>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuBan as Ban, LuBriefcase as Briefcase, LuCalendarDays as CalendarDays, LuCheck as Check, LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuFileText as FileText, LuMapPin as MapPin, LuPercent as Percent, LuReceipt as Receipt, LuShieldHalf as ShieldHalf, LuTruck as Truck, LuX as X, LuCircleX as XCircle } from "react-icons/lu";

import api from "@/lib/api/client";
import ActionModal from "@/components/operations/ActionModal";
import CompletionChecklist from "@/components/operations/CompletionChecklist";
import ReviewProfileHero from "@/components/operations/ReviewProfileHero";
import LocationEditModal from "@/components/common/LocationEditModal";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/operations/StatusBadge";
import {
  acceptSupplier,
  getReviewRecord,
  partialApproveReviewRecord,
  rejectReviewRecord,
  reviewSupplierDocument,
  reviewSupplierVehicle,
  setSupplierAccountState,
  ReviewRecord,
  updateReviewRecord,
} from "@/lib/api/services/operationsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { openPrivateDocument } from "@/lib/api/services/privateDocumentService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

type DetailValue = string | number | boolean | null | undefined;
type DetailObject = Record<string, DetailValue>;
type SupplierDocument = DetailObject & { id?: number; file_url?: string; file_path?: string };
type SupplierVehicle = DetailObject & { id?: number };
type SupplierContact = DetailObject & { id?: number; email?: string; phone?: string; is_primary?: boolean };

type DocRequirement = { key: string; label: string };

// Fallback only - the source of truth is GET /suppliers/document-requirements
// (app/services/suppliers.py SUPPLIER_DOCUMENT_TYPES), used if that call fails.
const FALLBACK_DOCUMENT_TYPES: DocRequirement[] = [
  { key: "company_registration", label: "Company Registration Certificate" },
  { key: "trade_license", label: "Trade License" },
  { key: "tax_certificate", label: "Tax Registration Certificate" },
  { key: "identity_proof", label: "Identity Proof (Passport / Emirates ID)" },
  { key: "bank_details", label: "Bank Account Details / Cheque" },
];

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
        <div key={label} className="min-w-0 rounded-lg bg-dash-bg p-4">
          <p className="text-xs font-bold uppercase text-dash-subtle">{label}</p>
          <div className="mt-1 break-all text-sm font-semibold text-dash-text">
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
  const documents = (record.documents ?? []) as SupplierDocument[];
  const vehicles = (record.vehicles ?? []) as SupplierVehicle[];
  const checks = [
    { label: "Profile", done: Boolean(record.supplier_name && record.supplier_type && record.country_name && record.city_name) },
    { label: "Business registration", done: Boolean(record.business_info?.business_registration_number || record.business_info?.gst_tax_number) },
    { label: "Invoicing", done: Boolean(record.invoicing && Object.values(record.invoicing).some(Boolean)) },
    { label: "Documents", done: documents.length > 0 },
    { label: "Vehicles", done: vehicles.length > 0 },
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

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [record, setRecord] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"accept" | "reject" | "partial" | "deactivate" | "suspend" | "reject-item" | null>(null);
  const [activeTab, setActiveTab] = useState<"business" | "invoicing" | "documents" | "vehicles">("business");
  const [reviewTarget, setReviewTarget] = useState<{ type: "document" | "vehicle"; id: number } | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const approvalStatus = String(record?.approval_status || "").toLowerCase();
  const accountStatus = String(record?.status || "").toLowerCase();
  const isApproved = ["approved", "approved_live"].includes(approvalStatus);
  // Suppliers have no terminal "rejected" state -- reject/reject-item both
  // resolve to more_information_required (see suppliers.py's reject_supplier).
  const isRejected = approvalStatus === "more_information_required";
  const isBlocked = ["inactive", "blocked", "suspended"].includes(accountStatus) || ["blocked", "suspended"].includes(approvalStatus);
  const canApprove = hasPermission("suppliers.approve") && !isApproved && !isBlocked;
  const canReject = hasPermission("suppliers.reject") && !isRejected && !isBlocked;
  const canPartial = !isApproved && !isBlocked && (hasPermission("suppliers.partial_approve") || canApprove);
  const canBlock = hasPermission("suppliers.edit") || hasPermission("suppliers.approve");
  const canEditLocation = hasPermission("suppliers.edit");
  const canReviewItems = hasPermission("suppliers.approve") || hasPermission("suppliers.reject");
  const canCommission = hasPermission("suppliers.edit") || hasPermission("suppliers.approve");

  const requestIdRef = useRef(0);
  const [documentTypes, setDocumentTypes] = useState<DocRequirement[]>(FALLBACK_DOCUMENT_TYPES);
  const [minCommissionRate, setMinCommissionRate] = useState<number | null>(null);
  const [commissionInput, setCommissionInput] = useState("");
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionError, setCommissionError] = useState("");

  async function saveSupplierCommission(clear: boolean) {
    if (!clear) {
      const value = Number(commissionInput);
      if (commissionInput === "" || Number.isNaN(value)) {
        setCommissionError("Enter a valid commission percentage.");
        return;
      }
      if (minCommissionRate !== null && value < minCommissionRate) {
        setCommissionError(`Commission cannot be lower than the platform minimum of ${minCommissionRate}%.`);
        return;
      }
    }
    setCommissionSaving(true);
    setCommissionError("");
    try {
      await updateReviewRecord("suppliers", id, { commission_percentage: clear ? null : Number(commissionInput) });
      toast.success(clear ? "Commission override cleared - now tracking the platform rate." : "Commission updated.");
      setCommissionInput("");
      await fetchRecord();
    } catch (error) {
      setCommissionError(getApiErrorMessage(error));
    } finally {
      setCommissionSaving(false);
    }
  }

  useEffect(() => {
    api.get("/settings/public")
      .then((res) => {
        const raw = res.data?.data?.supplier_commission_percentage;
        if (raw !== undefined) setMinCommissionRate(Number(raw));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/suppliers/document-requirements")
      .then((res) => {
        const requirements = res.data?.data;
        if (Array.isArray(requirements) && requirements.length) {
          setDocumentTypes(requirements.map((item: { document_type: string; label: string }) => ({ key: item.document_type, label: item.label })));
        }
      })
      .catch(() => {});
  }, []);

  const fetchRecord = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getReviewRecord("suppliers", id);
      if (requestIdRef.current !== requestId) return;
      setRecord(data);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      toast.error(getApiErrorMessage(error));
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
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const documents = (record?.documents ?? []) as SupplierDocument[];
  const vehicles = (record?.vehicles ?? []) as SupplierVehicle[];
  const contacts = (record?.contacts ?? []) as SupplierContact[];
  const primaryContact = contacts.find((contact) => contact.is_primary) ?? contacts[0];

  const missingRequiredDocs = documentTypes.filter(
    (docType) => !documents.some((doc) => doc.document_type === docType.key && doc.status === "approved")
  );

  const approveDocument = (documentId: number) =>
    void run(() => reviewSupplierDocument(id, documentId, { status: "approved" }), "Document approved.");

  const approveVehicle = (vehicleId: number) =>
    void run(() => reviewSupplierVehicle(id, vehicleId, { approval_status: "approved" }), "Vehicle approved.");

  const viewDocument = async (documentId: number) => {
    try {
      await openPrivateDocument("supplier", documentId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const saveLocation = async (value: { country_id: number | null; city_id: number | null }) => {
    setSaving(true);
    try {
      await updateReviewRecord("suppliers", id, value);
      toast.success("Supplier location updated.");
      setLocationModalOpen(false);
      await fetchRecord();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openRejectItem = (type: "document" | "vehicle", itemId: number) => {
    setReviewTarget({ type, id: itemId });
    setModal("reject-item");
  };

  const submitRejectItem = (payload: Record<string, string | number>) => {
    if (!reviewTarget) return;
    const rejection_reason = String(payload.rejection_reason || "");
    if (reviewTarget.type === "document") {
      void run(
        () => reviewSupplierDocument(id, reviewTarget.id, { status: "rejected", rejection_reason }),
        "Document rejected."
      );
    } else {
      void run(
        () => reviewSupplierVehicle(id, reviewTarget.id, { approval_status: "rejected", rejection_reason }),
        "Vehicle rejected."
      );
    }
  };

  const tabs = useMemo(
    () => [
      { key: "business" as const, label: "Business Info", icon: Briefcase },
      { key: "invoicing" as const, label: "Invoicing", icon: Receipt },
      { key: "documents" as const, label: "Documents", icon: FileText, count: documents.length },
      { key: "vehicles" as const, label: "Vehicles", icon: Truck, count: vehicles.length },
    ],
    [documents.length, vehicles.length]
  );

  return (
    <ModuleWrapper title="Supplier Detail" requiredPermission="suppliers.view">
      {loading ? (
        <Loader label="Loading supplier detail..." />
      ) : record ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/admin/suppliers" className="inline-flex items-center gap-2 text-sm font-bold text-dash-text hover:text-dash-brand-hover">
              <ArrowLeft size={16} /> Back to suppliers
            </Link>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/tours?supplier_id=${id}`} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><MapPin size={16} /> View Tours</Link>
              <Link href={`/admin/bookings?supplier_id=${id}`} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><CalendarDays size={16} /> View Bookings</Link>
              {canEditLocation && <button onClick={() => setLocationModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><MapPin size={16} /> Edit Location</button>}
              {canApprove && <button onClick={() => setModal("accept")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 size={16} /> Accept Supplier</button>}
              {canPartial && <button onClick={() => setModal("partial")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><ShieldHalf size={16} /> Request Changes</button>}
              {canReject && <button onClick={() => setModal("reject")} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"><XCircle size={16} /> Reject</button>}
              {canBlock && isBlocked && <button onClick={() => void run(() => setSupplierAccountState(id, "reactivate"), "Supplier account reactivated.")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><CheckCircle2 size={16} /> Reactivate</button>}
              {canBlock && !isBlocked && <button onClick={() => setModal("deactivate")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><Ban size={16} /> Deactivate</button>}
              {canBlock && !isBlocked && <button onClick={() => setModal("suspend")} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-50"><Ban size={16} /> Suspend</button>}
            </div>
          </div>

          <ReviewProfileHero
            name={String(record.supplier_name || record.name || "-")}
            code={record.supplier_code || record.code}
            entityType={record.supplier_type || record.type}
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

          <CompletionCard record={record} />

          <section className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Percent size={18} /></span>
                <div>
                  <p className="text-xs font-bold uppercase text-dash-subtle">Commission Rate</p>
                  <p className="text-lg font-black text-dash-text">
                    {record.commission_percentage !== undefined && record.commission_percentage !== null
                      ? `${record.commission_percentage}% (override)`
                      : minCommissionRate !== null
                        ? `Using the platform rate (${minCommissionRate}%) - updates automatically if that changes`
                        : "Using the platform rate"}
                  </p>
                </div>
              </div>
              {minCommissionRate !== null && <p className="text-xs text-dash-subtle">Platform minimum: <strong>{minCommissionRate}%</strong>. Leave blank to always track the platform rate; an explicit override can never go lower.</p>}
            </div>
            {canCommission && (
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-dash-border pt-4">
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Set an override rate (%)</span>
                  <input type="number" min={minCommissionRate ?? 0} step="0.01" value={commissionInput} onChange={(e) => setCommissionInput(e.target.value)} placeholder={record.commission_percentage != null ? String(record.commission_percentage) : String(minCommissionRate ?? "")} className="w-48 rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </label>
                <button type="button" onClick={() => void saveSupplierCommission(false)} disabled={commissionSaving} className="rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {commissionSaving ? "Saving..." : "Set Override"}
                </button>
                {record.commission_percentage != null && (
                  <button type="button" onClick={() => void saveSupplierCommission(true)} disabled={commissionSaving} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg">
                    Clear Override
                  </button>
                )}
                {commissionError && <p className="w-full text-xs font-semibold text-red-600">{commissionError}</p>}
              </div>
            )}
          </section>

          {contacts.length > 0 && (
            <section className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <h2 className="font-black text-dash-text">Contacts</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {contacts.map((contact, index) => (
                  <div key={contact.id ?? index} className="rounded-xl bg-dash-bg p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-dash-text">{valueText(contact.contact_name)}</p>
                      {contact.is_primary && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Primary</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold uppercase text-dash-subtle">{valueText(contact.designation)}</p>
                    <div className="mt-2 space-y-1 text-sm text-dash-muted">
                      {contact.email && <p>{contact.email}</p>}
                      {contact.phone && <p>{contact.phone}</p>}
                      {contact.alternate_phone && <p>Alt: {contact.alternate_phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {record.approval_history && record.approval_history.length > 0 && (
            <section className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <h2 className="font-black text-dash-text">Approval history</h2>
              <div className="mt-4 space-y-3">
                {record.approval_history.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-1 rounded-xl bg-dash-bg p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <StatusBadge value={entry.to_status} />
                      {entry.notes && <p className="mt-2 text-sm text-dash-muted">{entry.notes}</p>}
                    </div>
                    <time className="text-xs font-semibold text-dash-subtle">{entry.created_at ? new Date(entry.created_at).toLocaleString() : ""}</time>
                  </div>
                ))}
              </div>
            </section>
          )}

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
              {activeTab === "business" && (
                <KeyValueList data={record.business_info} empty="No business registration information submitted yet." />
              )}

              {activeTab === "invoicing" && (
                <KeyValueList data={record.invoicing} empty="No invoicing information submitted yet." />
              )}

              {activeTab === "documents" && (
                <p
                  className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ring-1 ring-inset ${
                    missingRequiredDocs.length === 0
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                      : "bg-amber-50 text-amber-700 ring-amber-100"
                  }`}
                >
                  {documentTypes.length - missingRequiredDocs.length} of {documentTypes.length} required documents approved
                  {missingRequiredDocs.length > 0 && ` — missing: ${missingRequiredDocs.map((docType) => docType.label).join(", ")}`}
                </p>
              )}

              {activeTab === "documents" &&
                (documents.length === 0 ? (
                  <p className="rounded-lg bg-dash-bg p-4 text-sm font-semibold text-dash-muted">No supplier documents uploaded yet.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {documents.map((doc, index) => (
                      <div key={doc.id ?? index} className="min-w-0 rounded-xl border border-dash-border p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <FileText size={16} className="shrink-0 text-dash-brand" />
                            <p
                              className="min-w-0 truncate text-sm font-bold text-dash-text"
                              title={valueText(doc.document_name || doc.document_type)}
                            >
                              {valueText(doc.document_name || doc.document_type)}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <StatusBadge value={String(doc.status || "pending")} />
                          </div>
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
                          {canReviewItems && doc.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => doc.id !== undefined && approveDocument(doc.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              <Check size={14} /> Accept
                            </button>
                          )}
                          {canReviewItems && doc.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => doc.id !== undefined && openRejectItem("document", doc.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                            >
                              <X size={14} /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {activeTab === "vehicles" &&
                (vehicles.length === 0 ? (
                  <p className="rounded-lg bg-dash-bg p-4 text-sm font-semibold text-dash-muted">No vehicles added yet.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {vehicles.map((vehicle, index) => (
                      <div key={vehicle.id ?? index} className="min-w-0 rounded-xl border border-dash-border p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Truck size={16} className="shrink-0 text-dash-brand" />
                            <p
                              className="min-w-0 truncate text-sm font-bold text-dash-text"
                              title={[vehicle.make, vehicle.model].filter(Boolean).join(" ") || `Vehicle ${index + 1}`}
                            >
                              {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || `Vehicle ${index + 1}`}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <StatusBadge value={String(vehicle.approval_status || "pending")} />
                          </div>
                        </div>
                        <InfoGrid rows={[
                          ["Year", vehicle.year],
                          ["Capacity", vehicle.capacity],
                          ["Reason", vehicle.rejection_reason],
                        ]} />
                        {(vehicle.fitness_certificate || vehicle.insurance_document || vehicle.vehicle_photos) && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {vehicle.fitness_certificate && (
                              <a href={String(vehicle.fitness_certificate)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-brand-hover hover:bg-[#E7F5FF]">
                                <Eye size={14} /> Fitness certificate
                              </a>
                            )}
                            {vehicle.insurance_document && (
                              <a href={String(vehicle.insurance_document)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-brand-hover hover:bg-[#E7F5FF]">
                                <Eye size={14} /> Insurance
                              </a>
                            )}
                            {vehicle.vehicle_photos && (
                              <a href={String(vehicle.vehicle_photos)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-brand-hover hover:bg-[#E7F5FF]">
                                <Eye size={14} /> Photos
                              </a>
                            )}
                          </div>
                        )}
                        {canReviewItems && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {vehicle.approval_status !== "approved" && (
                              <button
                                type="button"
                                onClick={() => vehicle.id !== undefined && approveVehicle(vehicle.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                              >
                                <Check size={14} /> Accept
                              </button>
                            )}
                            {vehicle.approval_status !== "rejected" && (
                              <button
                                type="button"
                                onClick={() => vehicle.id !== undefined && openRejectItem("vehicle", vehicle.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                              >
                                <X size={14} /> Reject
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </section>

          <ActionModal open={modal === "accept"} title="Accept supplier" saving={saving} submitLabel="Accept and unlock operations" onClose={() => setModal(null)} onSubmit={() => void run(() => acceptSupplier(id), "Supplier approved and operational modules unlocked.")}>
            <p className="text-sm leading-6 text-dash-muted">Accepting this supplier immediately unlocks tour creation, departures, bookings, calendar, payments, payouts and operational reports.</p>
            {missingRequiredDocs.length > 0 && (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
                ⚠ {missingRequiredDocs.length} of {documentTypes.length} required documents are missing or not yet approved: {missingRequiredDocs.map((docType) => docType.label).join(", ")}.
              </p>
            )}
          </ActionModal>
          <ActionModal open={modal === "reject"} title="Reject supplier" saving={saving} submitLabel="Reject" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => rejectReviewRecord("suppliers", id, { rejection_reason: String(payload.rejection_reason || ""), admin_comments: String(payload.admin_comments || "") }), "Supplier rejected.")} fields={[{ name: "rejection_reason", label: "Rejection reason", required: true }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "partial"} title="Request supplier changes" saving={saving} submitLabel="Send request" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => partialApproveReviewRecord("suppliers", id, { admin_comments: String(payload.admin_comments || ""), pending_requirements: String(payload.pending_requirements || "") }), "Supplier change request sent.")} fields={[{ name: "pending_requirements", label: "Required changes", type: "textarea" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "deactivate"} title="Deactivate supplier account" saving={saving} submitLabel="Deactivate" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => setSupplierAccountState(id, "deactivate", String(payload.reason || "")), "Supplier account deactivated.")} fields={[{ name: "reason", label: "Reason", type: "textarea" }]} />
          <ActionModal open={modal === "suspend"} title="Suspend supplier account" saving={saving} submitLabel="Suspend" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => setSupplierAccountState(id, "suspend", String(payload.reason || "")), "Supplier account suspended.")} fields={[{ name: "reason", label: "Reason", type: "textarea" }]} />
          <ActionModal
            open={modal === "reject-item"}
            title={reviewTarget?.type === "vehicle" ? "Reject vehicle" : "Reject document"}
            saving={saving}
            submitLabel="Reject"
            onClose={() => {
              setModal(null);
              setReviewTarget(null);
            }}
            onSubmit={submitRejectItem}
            fields={[{ name: "rejection_reason", label: "Rejection reason", required: true }]}
          />
          <LocationEditModal
            open={locationModalOpen}
            title="Edit supplier location"
            countryId={record.country_id ?? null}
            cityId={record.city_id ?? null}
            saving={saving}
            onClose={() => setLocationModalOpen(false)}
            onSave={(value) => void saveLocation(value)}
          />
        </div>
      ) : (
        <section className="rounded-xl border border-dash-border bg-white p-10 text-center text-dash-muted">Supplier not found.</section>
      )}
    </ModuleWrapper>
  );
}

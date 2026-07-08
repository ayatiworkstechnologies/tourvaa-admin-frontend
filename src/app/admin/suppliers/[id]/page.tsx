"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuBan as Ban, LuBriefcase as Briefcase, LuCheck as Check, LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuFileText as FileText, LuPercent as Percent, LuReceipt as Receipt, LuShieldHalf as ShieldHalf, LuTruck as Truck, LuX as X, LuCircleX as XCircle } from "react-icons/lu";

import ActionModal from "@/components/operations/ActionModal";
import CompletionChecklist from "@/components/operations/CompletionChecklist";
import ReviewProfileHero from "@/components/operations/ReviewProfileHero";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/operations/StatusBadge";
import {
  approveReviewRecord,
  getReviewRecord,
  partialApproveReviewRecord,
  rejectReviewRecord,
  reviewSupplierDocument,
  reviewSupplierVehicle,
  ReviewRecord,
  updateCommercialValue,
  updateReviewRecord,
} from "@/lib/api/services/operationsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type DetailValue = string | number | boolean | null | undefined;
type DetailObject = Record<string, DetailValue>;
type SupplierDocument = DetailObject & { id?: number; file_url?: string; file_path?: string };
type SupplierVehicle = DetailObject & { id?: number };
type SupplierContact = DetailObject & { id?: number; email?: string; phone?: string; is_primary?: boolean };

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
  const [modal, setModal] = useState<"reject" | "partial" | "commercial" | "block" | "reject-item" | null>(null);
  const [activeTab, setActiveTab] = useState<"business" | "invoicing" | "documents" | "vehicles">("business");
  const [reviewTarget, setReviewTarget] = useState<{ type: "document" | "vehicle"; id: number } | null>(null);

  const approvalStatus = String(record?.approval_status || "").toLowerCase();
  const accountStatus = String(record?.status || "").toLowerCase();
  const isApproved = ["approved", "approved_live"].includes(approvalStatus);
  const isRejected = approvalStatus === "rejected";
  const isBlocked = ["blocked", "suspended"].includes(accountStatus) || ["blocked", "suspended"].includes(approvalStatus);
  const canApprove = hasPermission("suppliers.approve") && !isApproved && !isBlocked;
  const canReject = hasPermission("suppliers.reject") && !isRejected && !isBlocked;
  const canPartial = !isApproved && !isBlocked && (hasPermission("suppliers.partial_approve") || canApprove);
  const canCommercial = hasPermission("suppliers.manage_markup");
  const hasCommissionRequest = String(record?.pending_requirements || "").toLowerCase().includes("commission request");
  const canBlock = hasPermission("suppliers.edit") || hasPermission("suppliers.approve");
  const canReviewItems = hasPermission("suppliers.approve") || hasPermission("suppliers.reject");

  const fetchRecord = useCallback(async () => {
    setLoading(true);
    try {
      setRecord(await getReviewRecord("suppliers", id));
    } catch {
      toast.error("Could not load supplier detail.");
    } finally {
      setLoading(false);
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
    } catch {
      toast.error("Action failed.");
    } finally {
      setSaving(false);
    }
  };

  const documents = (record?.documents ?? []) as SupplierDocument[];
  const vehicles = (record?.vehicles ?? []) as SupplierVehicle[];
  const contacts = (record?.contacts ?? []) as SupplierContact[];
  const primaryContact = contacts.find((contact) => contact.is_primary) ?? contacts[0];

  const approveDocument = (documentId: number) =>
    void run(() => reviewSupplierDocument(id, documentId, { status: "approved" }), "Document approved.");

  const approveVehicle = (vehicleId: number) =>
    void run(() => reviewSupplierVehicle(id, vehicleId, { approval_status: "approved" }), "Vehicle approved.");

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
              {canApprove && <button onClick={() => void run(() => approveReviewRecord("suppliers", id), "Supplier approved.")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 size={16} /> Approve</button>}
              {canPartial && <button onClick={() => setModal("partial")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><ShieldHalf size={16} /> Request Changes</button>}
              {canReject && <button onClick={() => setModal("reject")} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"><XCircle size={16} /> Reject</button>}
              {canBlock && <button onClick={() => isBlocked ? void run(() => updateReviewRecord("suppliers", id, { status: "active" }), "Supplier unblocked.") : setModal("block")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><Ban size={16} /> {isBlocked ? "Unblock" : "Block"}</button>}
              {canCommercial && <button onClick={() => setModal("commercial")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${hasCommissionRequest ? "bg-amber-500 text-white hover:bg-amber-600" : "border border-dash-border text-dash-text hover:bg-dash-bg"}`}><Percent size={16} /> {hasCommissionRequest ? "Approve Commission" : "Commission"}</button>}
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

          {record.markup_type && (
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <p className="text-xs font-bold uppercase tracking-wide text-dash-subtle">Commission / Markup</p>
              <p className="mt-1 text-lg font-black text-dash-text">
                {record.markup_type}: {record.markup_value ?? 0}
              </p>
            </div>
          )}

          <CompletionCard record={record} />

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

              {activeTab === "documents" &&
                (documents.length === 0 ? (
                  <p className="rounded-lg bg-dash-bg p-4 text-sm font-semibold text-dash-muted">No supplier documents uploaded yet.</p>
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
                          {(doc.file_url || doc.file_path) && (
                            <a href={String(doc.file_url || doc.file_path)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-brand-hover hover:bg-[#E7F5FF]">
                              <Eye size={14} /> View document
                            </a>
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
                      <div key={vehicle.id ?? index} className="rounded-xl border border-dash-border p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-dash-brand" />
                            <p className="text-sm font-bold text-dash-text">{[vehicle.make, vehicle.model].filter(Boolean).join(" ") || `Vehicle ${index + 1}`}</p>
                          </div>
                          <StatusBadge value={String(vehicle.approval_status || "pending")} />
                        </div>
                        <InfoGrid rows={[
                          ["Year", vehicle.year],
                          ["Capacity", vehicle.capacity],
                          ["Fitness certificate", vehicle.fitness_certificate],
                          ["Insurance", vehicle.insurance_document],
                          ["Photos", vehicle.vehicle_photos],
                          ["Reason", vehicle.rejection_reason],
                        ]} />
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

          <ActionModal open={modal === "reject"} title="Reject supplier" saving={saving} submitLabel="Reject" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => rejectReviewRecord("suppliers", id, { rejection_reason: String(payload.rejection_reason || ""), admin_comments: String(payload.admin_comments || "") }), "Supplier rejected.")} fields={[{ name: "rejection_reason", label: "Rejection reason" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "partial"} title="Request supplier changes" saving={saving} submitLabel="Send request" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => partialApproveReviewRecord("suppliers", id, { admin_comments: String(payload.admin_comments || ""), pending_requirements: String(payload.pending_requirements || "") }), "Supplier change request sent.")} fields={[{ name: "pending_requirements", label: "Required changes", type: "textarea" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "block"} title="Block supplier" saving={saving} submitLabel="Block" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => updateReviewRecord("suppliers", id, { status: "blocked", admin_comments: String(payload.admin_comments || "") }), "Supplier blocked.")} fields={[{ name: "admin_comments", label: "Block reason / admin note", type: "textarea" }]} />
          <ActionModal open={modal === "commercial"} title={hasCommissionRequest ? "Approve commission request" : "Update commission / markup"} saving={saving} submitLabel={hasCommissionRequest ? "Approve Commission" : "Save"} onClose={() => setModal(null)} initialValues={{ value_type: record.markup_type || "percentage", value: record.markup_value ?? 0 }} onSubmit={(payload) => void run(() => updateCommercialValue("suppliers", id, { markup_type: payload.value_type, markup_value: payload.value }), hasCommissionRequest ? "Commission request approved." : "Commission updated.")} fields={[{ name: "value_type", label: "Commission type", type: "select", options: [{ label: "Percentage", value: "percentage" }, { label: "Fixed", value: "fixed" }] }, { name: "value", label: "Commission / markup value", type: "number" }]} />
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
            fields={[{ name: "rejection_reason", label: "Rejection reason" }]}
          />
        </div>
      ) : (
        <section className="rounded-xl border border-dash-border bg-white p-10 text-center text-dash-muted">Supplier not found.</section>
      )}
    </ModuleWrapper>
  );
}

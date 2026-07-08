"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuBan as Ban, LuBriefcase as Briefcase, LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuFileText as FileText, LuPercent as Percent, LuReceipt as Receipt, LuShieldHalf as ShieldHalf, LuCircleX as XCircle } from "react-icons/lu";

import ActionModal from "@/components/operations/ActionModal";
import CompletionChecklist from "@/components/operations/CompletionChecklist";
import ReviewProfileHero from "@/components/operations/ReviewProfileHero";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/operations/StatusBadge";
import { approveReviewRecord, getReviewRecord, partialApproveReviewRecord, rejectReviewRecord, ReviewRecord, updateCommercialValue, updateReviewRecord } from "@/lib/api/services/operationsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type DetailValue = string | number | boolean | null | undefined;
type DetailObject = Record<string, DetailValue>;
type AgentDocument = DetailObject & { id?: number; file_url?: string; file_path?: string };
type AgentContact = DetailObject & { id?: number; email?: string; phone?: string; is_primary?: boolean };

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
  const [modal, setModal] = useState<"reject" | "partial" | "commercial" | "block" | null>(null);
  const [activeTab, setActiveTab] = useState<"business" | "invoicing" | "documents">("business");

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

  const fetchRecord = useCallback(async () => {
    setLoading(true);
    try {
      setRecord(await getReviewRecord("agents", id));
    } catch {
      toast.error("Could not load agent detail.");
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

  const documents = (record?.documents ?? []) as AgentDocument[];
  const contacts = (record?.contacts ?? []) as AgentContact[];
  const primaryContact = contacts.find((contact) => contact.is_primary) ?? contacts[0];

  const tabs = useMemo(
    () => [
      { key: "business" as const, label: "Business Info", icon: Briefcase },
      { key: "invoicing" as const, label: "Invoicing", icon: Receipt },
      { key: "documents" as const, label: "Documents", icon: FileText, count: documents.length },
    ],
    [documents.length]
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
                        {(doc.file_url || doc.file_path) && (
                          <a href={String(doc.file_url || doc.file_path)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-brand-hover hover:bg-[#E7F5FF]">
                            <Eye size={14} /> View document
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </section>

          <ActionModal open={modal === "reject"} title="Reject agent" saving={saving} submitLabel="Reject" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => rejectReviewRecord("agents", id, { rejection_reason: String(payload.rejection_reason || ""), admin_comments: String(payload.admin_comments || "") }), "Agent rejected.")} fields={[{ name: "rejection_reason", label: "Rejection reason" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "partial"} title="Request agent changes" saving={saving} submitLabel="Send request" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => partialApproveReviewRecord("agents", id, { admin_comments: String(payload.admin_comments || ""), pending_requirements: String(payload.pending_requirements || "") }), "Agent change request sent.")} fields={[{ name: "pending_requirements", label: "Required changes", type: "textarea" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "block"} title="Block agent" saving={saving} submitLabel="Block" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => updateReviewRecord("agents", id, { status: "blocked", admin_comments: String(payload.admin_comments || "") }), "Agent blocked.")} fields={[{ name: "admin_comments", label: "Block reason / admin note", type: "textarea" }]} />
          <ActionModal open={modal === "commercial"} title="Update discount" saving={saving} submitLabel="Save" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => updateCommercialValue("agents", id, { discount_type: payload.value_type, discount_value: payload.value }), "Discount updated.")} fields={[{ name: "value_type", label: "Discount type", type: "select", options: [{ label: "Percentage", value: "percentage" }, { label: "Fixed", value: "fixed" }] }, { name: "value", label: "Discount value", type: "number" }]} />
        </div>
      ) : (
        <section className="rounded-xl border border-dash-border bg-white p-10 text-center text-dash-muted">Agent not found.</section>
      )}
    </ModuleWrapper>
  );
}

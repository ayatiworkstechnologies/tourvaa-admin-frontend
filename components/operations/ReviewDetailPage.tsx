"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LinkIcon, Percent, ShieldHalf, XCircle } from "lucide-react";

import ActionModal from "@/components/operations/ActionModal";
import StatusBadge from "@/components/operations/StatusBadge";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { approveReviewRecord, getReviewRecord, partialApproveReviewRecord, rejectReviewRecord, ReviewModule, ReviewRecord, updateAffiliateApiLink, updateCommercialValue } from "@/lib/services/operationsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type Props = {
  module: ReviewModule;
  id: string;
  title: string;
  requiredPermission: string;
};

function fieldRows(record: ReviewRecord) {
  return [
    ["Name", record.name || record.supplier_name || record.agent_name],
    ["Code", record.code || record.supplier_code || record.agent_code || record.affiliate_code],
    ["Type", record.type || record.business_type],
    ["Country", record.country_name],
    ["City", record.city_name],
    ["Status", record.status],
    ["Approval", record.approval_status],
    ["Comments", record.admin_comments],
    ["Reason", record.rejection_reason],
  ];
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
      <h3 className="text-lg font-bold text-[#121826]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ReviewDetailPage({ module, id, title, requiredPermission }: Props) {
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [record, setRecord] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"reject" | "partial" | "commercial" | "api" | null>(null);

  const canApprove = hasPermission(`${module}.approve`);
  const canReject = hasPermission(`${module}.reject`);
  const canPartial = module !== "affiliates" && (hasPermission(`${module}.partial_approve`) || canApprove);
  const canCommercial = module === "suppliers" ? hasPermission("suppliers.manage_markup") : module === "agents" ? hasPermission("agents.manage_discount") : hasPermission("affiliates.manage_api_link");

  const fetchRecord = useCallback(async () => {
    setLoading(true);
    try {
      setRecord(await getReviewRecord(module, id));
    } catch {
      toast.error("Could not load detail.");
    } finally {
      setLoading(false);
    }
  }, [id, module, toast]);

  useEffect(() => {
     
    void fetchRecord();
  }, [fetchRecord]);

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

  return (
    <ModuleWrapper title={title} requiredPermission={requiredPermission}>
      {loading ? (
        <Loader label="Loading detail..." />
      ) : record ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href={`/admin/${module}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#2F9FE9]">
              <ArrowLeft size={16} /> Back to {module}
            </Link>
            <div className="flex flex-wrap gap-2">
              {canApprove && <button onClick={() => void run(() => approveReviewRecord(module, id), "Approved.")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 size={16} /> Approve</button>}
              {canPartial && <button onClick={() => setModal("partial")} className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC]"><ShieldHalf size={16} /> Partial</button>}
              {canReject && <button onClick={() => setModal("reject")} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"><XCircle size={16} /> Reject</button>}
              {canCommercial && <button onClick={() => setModal(module === "affiliates" ? "api" : "commercial")} className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC]">{module === "affiliates" ? <LinkIcon size={16} /> : <Percent size={16} />} {module === "suppliers" ? "Markup" : module === "agents" ? "Discount" : "API Link"}</button>}
            </div>
          </div>

          <DetailSection title="Profile">
            <div className="grid gap-4 md:grid-cols-3">
              {fieldRows(record).map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[#F7F9FC] p-4">
                  <p className="text-xs font-bold uppercase text-[#98A2B3]">{label}</p>
                  <div className="mt-1 text-sm font-semibold text-[#121826]">{label === "Status" || label === "Approval" ? <StatusBadge value={String(value || "")} /> : value || "-"}</div>
                </div>
              ))}
            </div>
          </DetailSection>

          <div className="grid gap-6 xl:grid-cols-2">
            <DetailSection title="Business Information">
              <pre className="overflow-auto rounded-lg bg-[#F7F9FC] p-4 text-xs text-[#344054]">{JSON.stringify(record.business_info || record.marketing_info || {}, null, 2)}</pre>
            </DetailSection>
            <DetailSection title="Invoicing">
              <pre className="overflow-auto rounded-lg bg-[#F7F9FC] p-4 text-xs text-[#344054]">{JSON.stringify(record.invoicing || {}, null, 2)}</pre>
            </DetailSection>
          </div>

          <DetailSection title="Documents">
            <pre className="overflow-auto rounded-lg bg-[#F7F9FC] p-4 text-xs text-[#344054]">{JSON.stringify(record.documents || [], null, 2)}</pre>
          </DetailSection>

          <ActionModal open={modal === "reject"} title="Reject" saving={saving} submitLabel="Reject" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => rejectReviewRecord(module, id, { rejection_reason: String(payload.rejection_reason || ""), admin_comments: String(payload.admin_comments || "") }), "Rejected.")} fields={[{ name: "rejection_reason", label: "Rejection reason" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "partial"} title="Partially approve" saving={saving} submitLabel="Save" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => partialApproveReviewRecord(module as "suppliers" | "agents", id, { admin_comments: String(payload.admin_comments || ""), pending_requirements: String(payload.pending_requirements || "") }), "Partially approved.")} fields={[{ name: "pending_requirements", label: "Pending requirements", type: "textarea" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "commercial"} title={module === "suppliers" ? "Set markup" : "Set discount"} saving={saving} submitLabel="Save" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => updateCommercialValue(module as "suppliers" | "agents", id, module === "suppliers" ? { markup_type: payload.value_type, markup_value: payload.value } : { discount_type: payload.value_type, discount_value: payload.value }), "Updated.")} fields={[{ name: "value_type", label: "Type", type: "select", options: [{ label: "Percentage", value: "percentage" }, { label: "Fixed", value: "fixed" }] }, { name: "value", label: "Value", type: "number" }]} />
          <ActionModal open={modal === "api"} title="Set API link" saving={saving} submitLabel="Save" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => updateAffiliateApiLink(id, String(payload.api_link || "")), "API link updated.")} fields={[{ name: "api_link", label: "API link" }]} />
        </div>
      ) : (
        <section className="rounded-xl border border-[#E7EAF0] bg-white p-10 text-center text-[#667085]">Record not found.</section>
      )}
    </ModuleWrapper>
  );
}


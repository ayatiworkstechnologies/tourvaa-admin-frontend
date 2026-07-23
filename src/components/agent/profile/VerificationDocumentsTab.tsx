"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  LuCircleAlert as AlertCircle,
  LuCircleCheckBig as CheckCircle2,
  LuClock3 as Clock3,
  LuEye as Eye,
  LuFileText as FileText,
  LuLoaderCircle as Loader2,
  LuRefreshCw as RefreshCw,
  LuUpload as Upload,
} from "react-icons/lu";

import api from "@/lib/api/client";
import { IMAGE_AND_PDF_EXTENSIONS_ACCEPT, IMAGE_FORMAT_LABEL } from "@/lib/uploads/imageFormats";
import { openPrivateDocument } from "@/lib/api/services/privateDocumentService";
import { useToast } from "@/hooks/useToast";

type DocumentRequirement = { document_type: string; label: string; required: boolean };
type AgentDocument = {
  id: number;
  document_type: string;
  document_name?: string;
  status: string;
  rejection_reason?: string | null;
  uploaded_at?: string;
};

const FALLBACK_REQUIREMENTS: DocumentRequirement[] = [
  { document_type: "company_registration", label: "Business Registration Certificate", required: true },
  { document_type: "tax_certificate", label: "Tax Registration (GST / VAT / TIN)", required: true },
  { document_type: "identity_proof", label: "Owner / Authorized Signatory ID", required: true },
  { document_type: "bank_details", label: "Bank Proof / Cancelled Cheque", required: true },
  { document_type: "travel_license", label: "Travel License / IATA Accreditation", required: false },
  { document_type: "address_proof", label: "Business Address Proof", required: false },
];

function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  return error.response?.data?.message || error.response?.data?.detail || fallback;
}

function statusClass(status: string) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "rejected") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export default function VerificationDocumentsTab() {
  const toast = useToast();
  const [agentId, setAgentId] = useState<number | null>(null);
  const [approvalStatus, setApprovalStatus] = useState("pending");
  const [pendingRequirements, setPendingRequirements] = useState("");
  const [requirements, setRequirements] = useState(FALLBACK_REQUIREMENTS);
  const [documents, setDocuments] = useState<AgentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [agentResponse, requirementsResponse] = await Promise.all([
        api.get("/agents/me"),
        api.get("/agents/document-requirements").catch(() => null),
      ]);
      const agent = agentResponse.data?.data ?? agentResponse.data;
      const id = Number(agent?.id);
      if (!id) throw new Error("Agent profile not found");
      setAgentId(id);
      setApprovalStatus(String(agent?.approval_status || "pending").toLowerCase());
      setPendingRequirements(String(agent?.pending_requirements || agent?.rejection_reason || ""));
      const serverRequirements = requirementsResponse?.data?.data;
      if (Array.isArray(serverRequirements) && serverRequirements.length) setRequirements(serverRequirements);
      const documentsResponse = await api.get(`/agents/${id}/documents`);
      setDocuments(documentsResponse.data?.data ?? []);
    } catch (loadError) {
      setError(errorMessage(loadError, "Verification documents could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function upload(documentType: string, file: File) {
    if (!agentId) return;
    setUploading(documentType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);
      await api.post(`/agents/${agentId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded and queued for review.");
      await load();
    } catch (uploadError) {
      toast.error(errorMessage(uploadError, "Document upload failed."));
    } finally {
      setUploading(null);
      if (fileInputs.current[documentType]) fileInputs.current[documentType]!.value = "";
    }
  }

  async function submitVerification() {
    setSubmitting(true);
    try {
      await api.post("/agents/submit-verification");
      toast.success("Verification submitted. An admin will review each document.");
      await load();
    } catch (submitError) {
      toast.error(errorMessage(submitError, "Verification could not be submitted."));
    } finally {
      setSubmitting(false);
    }
  }

  async function viewDocument(documentId: number) {
    try {
      await openPrivateDocument("agent", documentId);
    } catch {
      toast.error("Could not open document.");
    }
  }

  const documentMap = Object.fromEntries(documents.map((document) => [document.document_type, document]));
  const required = requirements.filter((requirement) => requirement.required);
  const uploadedRequired = required.filter((requirement) => documentMap[requirement.document_type]).length;
  const allRequiredReady = required.every((requirement) => {
    const document = documentMap[requirement.document_type];
    return document && document.status !== "rejected";
  });
  const isSubmitted = ["admin_review_pending", "approved", "approved_live"].includes(approvalStatus);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 to-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Verification status</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              {approvalStatus.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{uploadedRequired} of {required.length} required documents uploaded.</p>
          </div>
          <button
            type="button"
            onClick={() => void submitVerification()}
            disabled={!allRequiredReady || submitting || isSubmitted}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : isSubmitted ? <Clock3 size={16} /> : <CheckCircle2 size={16} />}
            {isSubmitted ? "Submitted for review" : "Submit for verification"}
          </button>
        </div>
        {pendingRequirements && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Admin request: {pendingRequirements}
          </div>
        )}
      </section>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 font-bold underline"><RefreshCw size={14} />Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {requirements.map((requirement) => {
            const document = documentMap[requirement.document_type];
            return (
              <article key={requirement.document_type} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${document ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}><FileText size={20} /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{requirement.label}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${requirement.required ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{requirement.required ? "Required" : "Optional"}</span>
                      </div>
                      {document ? (
                        <div className="mt-2 space-y-1.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${statusClass(document.status)}`}>{document.status}</span>
                          <p className="truncate text-xs text-slate-500">{document.document_name}</p>
                        </div>
                      ) : <p className="mt-1 text-xs text-slate-500">PDF or {IMAGE_FORMAT_LABEL} · maximum 10 MB</p>}
                    </div>
                  </div>
                </div>
                {document?.rejection_reason && <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Re-upload required: {document.rejection_reason}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    ref={(element) => { fileInputs.current[requirement.document_type] = element; }}
                    type="file"
                    accept={IMAGE_AND_PDF_EXTENSIONS_ACCEPT}
                    className="hidden"
                    aria-label={`Upload ${requirement.label}`}
                    onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(requirement.document_type, file); }}
                  />
                  <button type="button" onClick={() => fileInputs.current[requirement.document_type]?.click()} disabled={uploading === requirement.document_type} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                    {uploading === requirement.document_type ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}{document ? "Replace file" : "Upload file"}
                  </button>
                  {document && <button type="button" onClick={() => void viewDocument(document.id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Eye size={14} />View</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !allRequiredReady && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Upload every required document and replace any rejected file before submitting. Optional documents may be requested depending on the agent&apos;s country and accreditation.</p>
      )}
    </div>
  );
}

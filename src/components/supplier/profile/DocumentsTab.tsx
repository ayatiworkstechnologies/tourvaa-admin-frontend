"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2, LuFileText as FileText, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw, LuUpload as Upload } from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type Document = { id: number; document_type: string; file_url: string; status: string; uploaded_at?: string; notes?: string };

const DOC_TYPES = [
  { key: "company_registration", label: "Company Registration Certificate" },
  { key: "trade_license", label: "Trade License" },
  { key: "tax_certificate", label: "Tax Registration Certificate" },
  { key: "identity_proof", label: "Identity Proof (Passport / Emirates ID)" },
  { key: "bank_details", label: "Bank Account Details / Cheque" },
];

function statusCls(s: string) {
  const v = (s || "").toLowerCase();
  if (["approved", "verified"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "submitted"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["rejected"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

export default function DocumentsTab() {
  const toast = useToast();
  const { dashboard } = useAuthContext();
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Resolve supplier record ID from /suppliers/me (not user.id)
  useEffect(() => {
    setError("");
    api.get("/suppliers/me")
      .then(res => {
        const id = res.data?.data?.id ?? res.data?.id;
        if (id) setSupplierId(Number(id));
      })
      .catch(() => {
        setLoading(false);
        setError("Supplier account details could not be loaded.");
      });
  }, [dashboard, retryKey]);

  const load = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/suppliers/${supplierId}/documents`);
      setDocs(res.data?.data ?? res.data ?? []);
    } catch {
      setDocs([]);
      setError("Documents could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => { void load(); }, [load]);

  async function upload(docType: string, file: File) {
    if (!supplierId) return;
    setUploading(docType);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", docType);
      await api.post(`/suppliers/${supplierId}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Document uploaded successfully.");
      await load();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(null);
      if (fileRefs.current[docType]) fileRefs.current[docType]!.value = "";
    }
  }

  async function viewDocument(fileUrl: string) {
    if (fileUrl.startsWith("/api/private-documents/") || fileUrl.includes("/private-documents/")) {
      // Private document - fetch with auth header, open as blob
      try {
        const res = await api.get(fileUrl.replace(/^\/api/, ""), { responseType: "blob" });
        const contentType = String(res.headers["content-type"] || "application/octet-stream");
        const blob = new Blob([res.data as BlobPart], { type: contentType });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } catch {
        toast.error("Could not open document.");
      }
    } else {
      window.open(fileUrl, "_blank");
    }
  }

  async function submitVerification() {
    if (!supplierId) return;
    setSubmitting(true);
    try {
      await api.post(`/suppliers/submit-verification`);
      toast.success("Verification submitted. Admin will review your documents.");
    } catch {
      toast.error("Could not submit verification.");
    } finally {
      setSubmitting(false);
    }
  }

  const docMap = Object.fromEntries(docs.map(d => [d.document_type, d]));
  const allUploaded = DOC_TYPES.every(t => docMap[t.key]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-dash-muted">Upload the required documents to get your supplier account approved.</p>
        </div>
        {allUploaded && (
          <button type="button" onClick={submitVerification} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
            {submitting ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            Submit for Verification
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span>
          <button type="button" onClick={() => supplierId ? void load() : setRetryKey((key) => key + 1)} className="inline-flex items-center gap-1.5 font-bold underline"><RefreshCw size={14} />Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-20 rounded-xl border border-dash-border bg-white" />)}</div>
      ) : (
        <div className="space-y-4">
          {DOC_TYPES.map(({ key, label }) => {
            const doc = docMap[key];
            return (
              <div key={key} className="rounded-xl border border-dash-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${doc ? "bg-emerald-50" : "bg-dash-bg-muted"}`}>
                      <FileText size={18} className={doc ? "text-emerald-600" : "text-dash-subtle"} />
                    </div>
                    <div>
                      <p className="font-semibold text-dash-text">{label}</p>
                      {doc ? (
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusCls(doc.status)}`}>{doc.status}</span>
                          {doc.uploaded_at && <span className="text-xs text-dash-subtle">{new Date(doc.uploaded_at).toLocaleDateString()}</span>}
                          <button type="button" onClick={() => viewDocument(doc.file_url)} className="text-xs font-bold text-emerald-600 hover:underline">View file</button>
                        </div>
                      ) : (
                        <p className="text-xs text-dash-subtle">Not uploaded yet</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={el => { fileRefs.current[key] = el; }} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
                      aria-label={`Upload ${label}`}
                      onChange={e => { if (e.target.files?.[0]) void upload(key, e.target.files[0]); }} />
                    <button type="button" onClick={() => fileRefs.current[key]?.click()} disabled={uploading === key}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-colors">
                      {uploading === key ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                      {doc ? "Replace" : "Upload"}
                    </button>
                  </div>
                </div>
                {doc?.notes && (
                  <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Note: {doc.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !allUploaded && (
        <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Please upload all required documents before submitting for verification.
        </div>
      )}
    </div>
  );
}

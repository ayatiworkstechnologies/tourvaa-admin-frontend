"use client";

import Link from "next/link";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuBriefcase as Briefcase,
  LuCalculator as Calculator,
  LuCheck as Check,
  LuCircleCheckBig as CheckCircle2,
  LuCoins as Coins,
  LuEye as Eye,
  LuFileText as FileText,
  LuLink as LinkIcon,
  LuPercent as Percent,
  LuPlus as Plus,
  LuReceipt as Receipt,
  LuX as X,
  LuCircleX as XCircle,
} from "react-icons/lu";

import api from "@/lib/api/client";
import ActionModal from "@/components/operations/ActionModal";
import CompletionChecklist from "@/components/operations/CompletionChecklist";
import ReviewProfileHero from "@/components/operations/ReviewProfileHero";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/operations/StatusBadge";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { openPrivateDocument } from "@/lib/api/services/privateDocumentService";
import {
  approveReviewRecord,
  getReviewRecord,
  rejectReviewRecord,
  reviewAffiliateDocument,
  ReviewRecord,
  updateAffiliateApiLink,
  updateReviewRecord,
} from "@/lib/api/services/operationsService";
import {
  AffiliateClick,
  AffiliateCommissionSummary,
  AffiliateConversion,
  AffiliateLink,
  AffiliatePayout,
  getAffiliateClicks,
  getAffiliateCommissions,
  getAffiliateConversions,
  getAffiliateLinks,
  getAffiliatePayouts,
} from "@/lib/api/services/affiliateService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type DetailValue = string | number | boolean | null | undefined;
type AffiliateDocument = { id?: number; document_type?: string; document_name?: string; status?: string; uploaded_at?: string; mime_type?: string; rejection_reason?: string; file_url?: string; file_path?: string };

const PROFILE_TABS = [
  { key: "marketing" as const, label: "Marketing Info", icon: Briefcase },
  { key: "invoicing" as const, label: "Invoicing", icon: Receipt },
  { key: "documents" as const, label: "Documents", icon: FileText },
];

const PERFORMANCE_TABS = [
  { key: "links" as const, label: "Links" },
  { key: "clicks" as const, label: "Clicks" },
  { key: "conversions" as const, label: "Conversions" },
  { key: "payouts" as const, label: "Payouts" },
];

const PAGE_SIZE = 10;

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

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FD] text-[#7E22CE]">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-dash-subtle">{label}</p>
          <p className="mt-0.5 text-xl font-black text-dash-text">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AffiliateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const { hasPermission } = useAuthContext();

  const [record, setRecord] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"reject" | "api" | "reject-document" | null>(null);
  const [reviewDocumentId, setReviewDocumentId] = useState<number | null>(null);
  const [profileTab, setProfileTab] = useState<"marketing" | "invoicing" | "documents">("marketing");
  const [performanceTab, setPerformanceTab] = useState<"links" | "clicks" | "conversions" | "payouts">("links");

  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [linksPage, setLinksPage] = useState(1);
  const [linksTotal, setLinksTotal] = useState(0);
  const [linksTotalPages, setLinksTotalPages] = useState(1);

  const [clicks, setClicks] = useState<AffiliateClick[]>([]);
  const [clicksPage, setClicksPage] = useState(1);
  const [clicksTotal, setClicksTotal] = useState(0);
  const [clicksTotalPages, setClicksTotalPages] = useState(1);

  const [conversions, setConversions] = useState<AffiliateConversion[]>([]);
  const [conversionsPage, setConversionsPage] = useState(1);
  const [conversionsTotal, setConversionsTotal] = useState(0);
  const [conversionsTotalPages, setConversionsTotalPages] = useState(1);

  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsTotal, setPayoutsTotal] = useState(0);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);

  const [commissions, setCommissions] = useState<AffiliateCommissionSummary | null>(null);
  const [maxCommissionRate, setMaxCommissionRate] = useState<number | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState("");

  const [calcAmount, setCalcAmount] = useState("");
  const [calcResult, setCalcResult] = useState<{ gross_amount: string; commission_amount: string; commission_percentage: string | null } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const approvalStatus = String(record?.approval_status || "").toLowerCase();
  const accountStatus = String(record?.status || "").toLowerCase();
  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";
  const isBlocked = ["blocked", "suspended"].includes(accountStatus);
  const canApprove = hasPermission("affiliates.approve") && !isApproved && !isBlocked;
  const canReject = hasPermission("affiliates.reject") && !isRejected && !isBlocked;
  const canCommercial = hasPermission("affiliates.manage_api_link");
  const canReviewDocuments = hasPermission("affiliates.approve") || hasPermission("affiliates.reject");

  const requestIdRef = useRef(0);

  const fetchRecord = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getReviewRecord("affiliates", id);
      if (requestIdRef.current !== requestId) return;
      setRecord(data);
    } catch {
      if (requestIdRef.current !== requestId) return;
      toast.error("Could not load affiliate detail.");
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { void fetchRecord(); }, [fetchRecord]);

  useEffect(() => {
    api.get("/settings/public")
      .then((res) => {
        const raw = res.data?.data?.affiliate_commission_max_percentage;
        if (raw !== undefined) setMaxCommissionRate(Number(raw));
      })
      .catch(() => {});
  }, []);

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

  const viewDocument = async (documentId: number) => {
    try {
      await openPrivateDocument("affiliate", documentId);
    } catch {
      toast.error("Could not open affiliate document.");
    }
  };

  const approveDocument = (documentId: number) =>
    void run(() => reviewAffiliateDocument(id, documentId, { status: "approved" }), "Document approved.");

  const rejectDocument = (payload: Record<string, string | number>) => {
    if (reviewDocumentId === null) return;
    void run(
      () => reviewAffiliateDocument(id, reviewDocumentId, { status: "rejected", rejection_reason: String(payload.rejection_reason || "") }),
      "Document rejected and re-upload requested."
    );
  };

  async function saveCommissionRate() {
    const value = Number(rateInput);
    if (!rateInput || Number.isNaN(value)) {
      setRateError("Enter a valid commission percentage.");
      return;
    }
    if (maxCommissionRate !== null && value > maxCommissionRate) {
      setRateError(`Commission cannot exceed the platform maximum of ${maxCommissionRate}%.`);
      return;
    }
    setRateSaving(true);
    setRateError("");
    try {
      await updateReviewRecord("affiliates", id, { commission_percentage: value });
      await fetchRecord();
      setRateInput("");
      toast.success("Commission rate updated.");
    } catch (error) {
      setRateError(apiError(error, "Failed to update commission."));
    } finally {
      setRateSaving(false);
    }
  }

  async function runCommissionCalculator() {
    const amount = Number(calcAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setCalcLoading(true);
    try {
      const res = await api.get(`/affiliates/${id}/commission-calculator`, { params: { amount } });
      setCalcResult(res.data?.data ?? null);
    } catch {
      setCalcResult(null);
    } finally {
      setCalcLoading(false);
    }
  }

  const fetchLinks = useCallback(async (page: number) => {
    const res = await getAffiliateLinks({ affiliate_id: Number(id), page, limit: PAGE_SIZE });
    setLinks(res.items ?? []);
    setLinksTotal(res.total ?? 0);
    setLinksTotalPages(res.total_pages ?? 1);
  }, [id]);

  const fetchClicks = useCallback(async (page: number) => {
    const res = await getAffiliateClicks(id, { page, limit: PAGE_SIZE });
    setClicks(res.items ?? []);
    setClicksTotal(res.total ?? 0);
    setClicksTotalPages(res.total_pages ?? 1);
  }, [id]);

  const fetchConversions = useCallback(async (page: number) => {
    const res = await getAffiliateConversions(id, { page, limit: PAGE_SIZE });
    setConversions(res.items ?? []);
    setConversionsTotal(res.total ?? 0);
    setConversionsTotalPages(res.total_pages ?? 1);
  }, [id]);

  const fetchPayouts = useCallback(async (page: number) => {
    const res = await getAffiliatePayouts({ affiliate_id: Number(id), page, limit: PAGE_SIZE });
    setPayouts(res.items ?? []);
    setPayoutsTotal(res.total ?? 0);
    setPayoutsTotalPages(res.total_pages ?? 1);
  }, [id]);

  const [performanceLoading, setPerformanceLoading] = useState(true);
  useEffect(() => {
    setPerformanceLoading(true);
    Promise.allSettled([
      fetchLinks(1),
      fetchClicks(1),
      fetchConversions(1),
      fetchPayouts(1),
      getAffiliateCommissions(id),
    ]).then(([, , , , commissionsRes]) => {
      if (commissionsRes.status === "fulfilled") setCommissions(commissionsRes.value);
    }).finally(() => setPerformanceLoading(false));
  }, [id, fetchLinks, fetchClicks, fetchConversions, fetchPayouts]);

  const documents = (record?.documents ?? []) as AffiliateDocument[];

  const checks = useMemo(() => [
    { label: "Profile", done: Boolean(record?.name && record?.business_type && record?.country_name) },
    { label: "Marketing Info", done: Boolean(record?.marketing_info && Object.values(record.marketing_info).some(Boolean)) },
    { label: "Invoicing", done: Boolean(record?.invoicing && Object.values(record.invoicing).some(Boolean)) },
    { label: "Documents", done: documents.length > 0 },
  ], [record, documents.length]);

  const linkColumns: DataTableColumn<AffiliateLink>[] = [
    { key: "no", header: "No", className: "w-20 font-bold text-dash-muted", render: (_row, index) => (linksPage - 1) * PAGE_SIZE + index + 1 },
    { key: "link", header: "Link", render: (l) => <Link href={`/admin/affiliates/links/${l.id}`} className="font-bold text-dash-brand hover:underline">{l.campaign_name || l.label || l.ref_code}</Link> },
    { key: "target", header: "Tour / Destination", render: (l) => l.tour_title || l.destination_url || "-" },
    { key: "clicks", header: "Clicks", render: (l) => l.total_clicks },
    { key: "bookings", header: "Bookings", render: (l) => l.total_conversions },
    { key: "status", header: "Status", className: "capitalize", render: (l) => <StatusBadge value={String(l.status || "")} /> },
  ];

  const clickColumns: DataTableColumn<AffiliateClick>[] = [
    { key: "no", header: "No", className: "w-20 font-bold text-dash-muted", render: (_row, index) => (clicksPage - 1) * PAGE_SIZE + index + 1 },
    { key: "link_id", header: "Link", render: (c) => `#${c.link_id}` },
    { key: "ip_address", header: "IP", render: (c) => c.ip_address || "-" },
    { key: "referrer", header: "Referrer", className: "max-w-xs truncate", render: (c) => c.referrer || "-" },
    { key: "clicked_at", header: "When", render: (c) => (c.clicked_at ? new Date(c.clicked_at).toLocaleString() : "-") },
  ];

  const conversionColumns: DataTableColumn<AffiliateConversion>[] = [
    { key: "no", header: "No", className: "w-20 font-bold text-dash-muted", render: (_row, index) => (conversionsPage - 1) * PAGE_SIZE + index + 1 },
    { key: "booking_id", header: "Booking", render: (c) => (c.booking_code || (c.booking_id ? `#${c.booking_id}` : "-")) },
    { key: "commission_amount", header: "Commission", render: (c) => c.commission_amount || "-" },
    { key: "status", header: "Status", render: (c) => <StatusBadge value={String(c.status || "")} /> },
    { key: "converted_at", header: "When", render: (c) => (c.converted_at ? new Date(c.converted_at).toLocaleString() : "-") },
  ];

  const payoutColumns: DataTableColumn<AffiliatePayout>[] = [
    { key: "no", header: "No", className: "w-20 font-bold text-dash-muted", render: (_row, index) => (payoutsPage - 1) * PAGE_SIZE + index + 1 },
    { key: "total_amount", header: "Amount", render: (p) => `${p.total_amount ?? "-"} ${p.currency ?? ""}`.trim() },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={String(p.status || "")} /> },
    { key: "created_at", header: "Requested", render: (p) => (p.created_at ? new Date(p.created_at).toLocaleString() : "-") },
  ];

  return (
    <ModuleWrapper title="Affiliate Detail" requiredPermission="affiliates.view">
      {loading ? (
        <Loader label="Loading affiliate detail..." />
      ) : record ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/admin/affiliates" className="inline-flex items-center gap-2 text-sm font-bold text-dash-text hover:text-dash-brand-hover">
              <ArrowLeft size={16} /> Back to affiliates
            </Link>
            <div className="flex flex-wrap gap-2">
              {canApprove && <button onClick={() => void run(() => approveReviewRecord("affiliates", id), "Affiliate approved.")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 size={16} /> Approve</button>}
              {canReject && <button onClick={() => setModal("reject")} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"><XCircle size={16} /> Reject</button>}
              {canCommercial && <button onClick={() => setModal("api")} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg"><LinkIcon size={16} /> API Link</button>}
            </div>
          </div>

          <ReviewProfileHero
            name={String(record.name || "-")}
            code={record.affiliate_code || record.code}
            entityType={record.business_type}
            countryName={record.country_name}
            cityName={record.city_name}
            status={record.status}
            approvalStatus={record.approval_status}
            rejectionReason={record.rejection_reason}
            adminComments={record.admin_comments}
            contactEmail={record.email}
            contactPhone={record.phone}
          />

          <CompletionChecklist checks={checks} />

          <section className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FD] text-[#7E22CE]"><Percent size={18} /></span>
                <div>
                  <p className="text-xs font-bold uppercase text-dash-subtle">Base Commission Rate</p>
                  <p className="mt-1 text-lg font-black text-dash-text">{record.commission_percentage ?? "0"}%</p>
                  <p className="mt-1 text-xs text-dash-muted">
                    Used when no more specific commission rule matches.{" "}
                    {maxCommissionRate !== null && <>Platform maximum: <strong>{maxCommissionRate}%</strong>.</>}
                  </p>
                </div>
              </div>
              {canCommercial && (
                <div className="flex items-end gap-2">
                  <label>
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">New rate (%)</span>
                    <input type="number" min={0} max={maxCommissionRate ?? 100} step="0.01" value={rateInput} onChange={(e) => setRateInput(e.target.value)} className="w-32 rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10" />
                  </label>
                  <button type="button" onClick={() => void saveCommissionRate()} disabled={rateSaving} className="rounded-xl bg-dash-brand px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-dash-brand-hover disabled:cursor-not-allowed disabled:opacity-60">{rateSaving ? "Saving..." : "Update Rate"}</button>
                </div>
              )}
            </div>
            {rateError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{rateError}</p>}

            <div className="mt-5 border-t border-dash-border pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-dash-subtle"><Calculator size={13} /> Commission Calculator</p>
              <div className="flex flex-wrap items-end gap-2">
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Booking amount</span>
                  <input type="number" min={0} step="0.01" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} className="w-40 rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10" />
                </label>
                <button type="button" onClick={() => void runCommissionCalculator()} disabled={calcLoading} className="rounded-xl border border-dash-border px-4 py-2.5 text-xs font-bold text-dash-body transition-colors hover:bg-dash-bg disabled:cursor-not-allowed disabled:opacity-60">{calcLoading ? "Calculating..." : "Calculate"}</button>
                {calcResult && (
                  <p className="text-sm text-dash-body">
                    Tourvaa would pay <strong className="text-emerald-700">{calcResult.commission_amount}</strong>
                    {calcResult.commission_percentage ? ` (${calcResult.commission_percentage}%)` : ""} on a {calcResult.gross_amount} booking.
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Coins} label="Total Earned" value={String(commissions?.total_commission ?? "0")} />
            <StatCard icon={Coins} label="Total Paid" value={String(commissions?.paid_commission ?? "0")} />
            <StatCard icon={Coins} label="Pending" value={String(commissions?.pending_commission ?? "0")} />
          </div>

          <section className="rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap gap-1 border-b border-[#F0F3F8] p-2">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setProfileTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                    profileTab === tab.key ? "bg-[#F3E8FD] text-[#7E22CE]" : "text-dash-muted hover:bg-dash-bg"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.key === "documents" && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${profileTab === "documents" ? "bg-white text-[#7E22CE]" : "bg-[#F0F3F8] text-dash-subtle"}`}>{documents.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {profileTab === "marketing" && <KeyValueList data={record.marketing_info} empty="No marketing information submitted yet." />}
              {profileTab === "invoicing" && <KeyValueList data={record.invoicing} empty="No invoicing information submitted yet." />}
              {profileTab === "documents" && (
                documents.length === 0 ? (
                  <p className="rounded-lg bg-dash-bg p-4 text-sm font-semibold text-dash-muted">No documents uploaded yet.</p>
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
                        {doc.rejection_reason && (
                          <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-600">{doc.rejection_reason}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {(doc.file_url || doc.file_path) && doc.id !== undefined && (
                            <button type="button" onClick={() => void viewDocument(doc.id!)} className="inline-flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-[#7E22CE] hover:bg-[#F3E8FD]">
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
                )
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F3F8] p-2">
              <div className="flex flex-wrap gap-1">
                {PERFORMANCE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setPerformanceTab(tab.key)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                      performanceTab === tab.key ? "bg-[#F3E8FD] text-[#7E22CE]" : "text-dash-muted hover:bg-dash-bg"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {performanceTab === "links" && (
                <Link href={`/admin/affiliates/links/new?affiliate_id=${id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-dash-brand-hover">
                  <Plus size={15} /> Generate Link
                </Link>
              )}
            </div>

            {performanceTab === "links" && (
              <DataTable ariaLabel="Affiliate links" columns={linkColumns} rows={links} loading={performanceLoading} page={linksPage} pageSize={PAGE_SIZE} total={linksTotal} totalPages={linksTotalPages} onPageChange={(page) => { setLinksPage(page); void fetchLinks(page); }} emptyTitle="No links generated yet" />
            )}
            {performanceTab === "clicks" && (
              <DataTable ariaLabel="Affiliate clicks" columns={clickColumns} rows={clicks} loading={performanceLoading} page={clicksPage} pageSize={PAGE_SIZE} total={clicksTotal} totalPages={clicksTotalPages} onPageChange={(page) => { setClicksPage(page); void fetchClicks(page); }} emptyTitle="No clicks recorded" />
            )}
            {performanceTab === "conversions" && (
              <DataTable ariaLabel="Affiliate conversions" columns={conversionColumns} rows={conversions} loading={performanceLoading} page={conversionsPage} pageSize={PAGE_SIZE} total={conversionsTotal} totalPages={conversionsTotalPages} onPageChange={(page) => { setConversionsPage(page); void fetchConversions(page); }} emptyTitle="No conversions recorded" />
            )}
            {performanceTab === "payouts" && (
              <DataTable ariaLabel="Affiliate payouts" columns={payoutColumns} rows={payouts} loading={performanceLoading} page={payoutsPage} pageSize={PAGE_SIZE} total={payoutsTotal} totalPages={payoutsTotalPages} onPageChange={(page) => { setPayoutsPage(page); void fetchPayouts(page); }} emptyTitle="No payouts yet" />
            )}
          </section>

          <ActionModal open={modal === "reject"} title="Reject affiliate" saving={saving} submitLabel="Reject" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => rejectReviewRecord("affiliates", id, { rejection_reason: String(payload.rejection_reason || ""), admin_comments: String(payload.admin_comments || "") }), "Affiliate rejected.")} fields={[{ name: "rejection_reason", label: "Rejection reason" }, { name: "admin_comments", label: "Admin comments", type: "textarea" }]} />
          <ActionModal open={modal === "api"} title="Set API link" saving={saving} submitLabel="Save" onClose={() => setModal(null)} onSubmit={(payload) => void run(() => updateAffiliateApiLink(id, String(payload.api_link || "")), "API link updated.")} fields={[{ name: "api_link", label: "API link" }]} />
          <ActionModal open={modal === "reject-document"} title="Reject affiliate document" saving={saving} submitLabel="Reject and request re-upload" onClose={() => { setModal(null); setReviewDocumentId(null); }} onSubmit={rejectDocument} fields={[{ name: "rejection_reason", label: "Reason and re-upload instructions", type: "textarea" }]} />
        </div>
      ) : (
        <section className="rounded-xl border border-dash-border bg-white p-10 text-center text-dash-muted">Affiliate not found.</section>
      )}
    </ModuleWrapper>
  );
}

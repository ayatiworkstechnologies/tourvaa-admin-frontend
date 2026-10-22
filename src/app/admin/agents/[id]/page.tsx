"use client";

import Link from "next/link";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuBan as Ban,
  LuBriefcase as Briefcase,
  LuBuilding2 as Building2,
  LuCalendarCheck as CalendarCheck,
  LuCalendarDays as CalendarDays,
  LuCheck as Check,
  LuCircleCheckBig as CheckCircle2,
  LuCircleX as XCircle,
  LuClock as Clock,
  LuCoins as Coins,
  LuCopy as Copy,
  LuCreditCard as CreditCard,
  LuExternalLink as ExternalLink,
  LuEye as Eye,
  LuFileCheck2 as FileText,
  LuGlobe as Globe,
  LuHistory as History,
  LuLayoutDashboard as LayoutDashboard,
  LuLock as Lock,
  LuMail as Mail,
  LuMapPin as MapPin,
  LuPercent as Percent,
  LuPhone as Phone,
  LuReceipt as Receipt,
  LuShieldAlert as ShieldAlert,
  LuShieldCheck as ShieldCheck,
  LuShieldHalf as ShieldHalf,
  LuUser as UserIcon,
  LuUsers as Users,
  LuWallet as Wallet,
  LuX as X,
} from "react-icons/lu";

import api from "@/lib/api/client";
import ActionModal from "@/components/operations/ActionModal";
import ReviewProfileHero from "@/components/operations/ReviewProfileHero";
import LocationEditModal from "@/components/common/LocationEditModal";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/operations/StatusBadge";
import {
  approveReviewRecord,
  getReviewRecord,
  partialApproveReviewRecord,
  rejectAgentCommissionRequest,
  rejectReviewRecord,
  reviewAgentDocument,
  ReviewRecord,
  updateCommercialValue,
  updateReviewRecord,
} from "@/lib/api/services/operationsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { useGeoCountries } from "@/hooks/useGeo";
import { useCurrency } from "@/hooks/useCurrency";
import { openPrivateDocument } from "@/lib/api/services/privateDocumentService";

type DetailValue = string | number | boolean | null | undefined;
type DetailObject = Record<string, DetailValue>;

type AgentDocument = DetailObject & {
  id?: number;
  document_type?: string;
  document_name?: string;
  file_url?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  status?: string;
  rejection_reason?: string | null;
  uploaded_at?: string;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
};

type AgentContact = DetailObject & {
  id?: number;
  contact_name?: string;
  first_name?: string;
  last_name?: string;
  designation?: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  preferred_contact_method?: string;
  is_primary?: boolean;
};

function apiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  return (
    error.response?.data?.message || error.response?.data?.detail || fallback
  );
}

function valueText(value: DetailValue) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function titleize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readableValue(value: DetailValue) {
  if (value === null || value === undefined || value === "") return valueText(value);
  return typeof value === "string" ? titleize(value) : valueText(value);
}

function formatDocDate(iso?: DetailValue) {
  if (!iso || typeof iso !== "string") return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function formatFileSize(bytes?: DetailValue) {
  if (bytes === null || bytes === undefined || typeof bytes !== "number" || isNaN(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileFormat(filename?: DetailValue, mime?: DetailValue) {
  if (typeof filename === "string") {
    const ext = filename.split(".").pop()?.toUpperCase();
    if (ext && ext.length <= 5 && !ext.includes("/")) return ext;
  }
  if (typeof mime === "string") {
    if (mime.includes("pdf")) return "PDF";
    if (mime.includes("webp")) return "WEBP";
    if (mime.includes("png")) return "PNG";
    if (mime.includes("jpeg") || mime.includes("jpg")) return "JPG";
  }
  return null;
}

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const { countries } = useGeoCountries();
  const { code: displayCurrency, format: moneyText } = useCurrency();

  const [record, setRecord] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<
    "reject" | "partial" | "commercial" | "block" | "reject-document" | null
  >(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "bookings"
    | "customers"
    | "contacts"
    | "invoicing"
    | "documents"
    | "history"
  >("overview");
  const [reviewDocumentId, setReviewDocumentId] = useState<number | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [agentCommissionMax, setAgentCommissionMax] = useState<number | null>(
    null,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyValue = (value: string, label: string) => {
    if (!value) return;
    void navigator.clipboard.writeText(value);
    setCopiedKey(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCountryName = useCallback(
    (countryId?: DetailValue) => {
      if (!countryId) return "-";
      const num = Number(countryId);
      const match = countries.find((c) => c.id === num);
      return match?.name || String(countryId);
    },
    [countries],
  );

  useEffect(() => {
    api
      .get("/settings/public")
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
  const isBlocked =
    ["blocked", "suspended"].includes(accountStatus) ||
    ["blocked", "suspended"].includes(approvalStatus);
  const canApprove =
    hasPermission("agents.approve") && !isApproved && !isBlocked;
  const canReject = hasPermission("agents.reject") && !isRejected && !isBlocked;
  const canPartial =
    !isApproved &&
    !isBlocked &&
    (hasPermission("agents.partial_approve") || canApprove);
  const canCommercial = hasPermission("agents.manage_discount");
  const canBlock =
    hasPermission("agents.edit") || hasPermission("agents.approve");
  const canEditLocation = hasPermission("agents.edit");
  const canReviewDocuments =
    hasPermission("agents.approve") || hasPermission("agents.reject");
  const canViewBookings =
    hasPermission("bookings.view") || hasPermission("view-bookings");
  const canViewCustomers =
    hasPermission("customers.view") || hasPermission("view-customers");
  const canViewTour =
    hasPermission("tours.view") || hasPermission("view-tours");

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
    } catch (error) {
      toast.error(apiError(error, "Action failed."));
    } finally {
      setSaving(false);
    }
  };

  const documents = (record?.documents ?? []) as AgentDocument[];
  const contacts = (record?.contacts ?? []) as AgentContact[];
  const primaryContact =
    contacts.find((contact) => contact.is_primary) ?? contacts[0];
  const registrationContact = record?.registration_contact;
  const businessInfo = record?.business_info as Record<string, unknown> | null;
  const invoicing = record?.invoicing as Record<string, unknown> | null;
  const hasInvoicing = Boolean(
    invoicing && Object.values(invoicing).some((v) => v !== null && v !== "" && v !== undefined),
  );

  const activity = record?.activity;
  const summary = activity?.summary;
  const recentBookings = activity?.recent_bookings ?? [];
  const agencyCustomers = activity?.customers ?? [];
  const summaryCurrency = String(
    (summary as { currency?: string } | undefined)?.currency || record?.currency || "USD",
  ).toUpperCase();
  const hasMixedSummaryCurrencies = Boolean((summary as { has_mixed_currencies?: boolean } | undefined)?.has_mixed_currencies);
  const summaryMoney = (value: unknown) => hasMixedSummaryCurrencies ? "Multiple currencies" : moneyText(value as string | number | null | undefined, summaryCurrency);

  const storedBusinessYears = businessInfo?.years_in_business;
  const yearsInBusiness: DetailValue =
    typeof storedBusinessYears === "string" ||
    typeof storedBusinessYears === "number"
      ? storedBusinessYears
      : record?.years_in_operation;

  const viewDocument = async (documentId: number) => {
    try {
      await openPrivateDocument("agent", documentId);
    } catch {
      toast.error("Could not open agent document.");
    }
  };

  const approveDocument = (documentId: number) =>
    void run(
      () => reviewAgentDocument(id, documentId, { status: "approved" }),
      "Document approved.",
    );

  const rejectDocument = (payload: Record<string, string | number>) => {
    if (reviewDocumentId === null) return;
    void run(
      () =>
        reviewAgentDocument(id, reviewDocumentId, {
          status: "rejected",
          rejection_reason: String(payload.rejection_reason || ""),
        }),
      "Document rejected and re-upload requested.",
    );
  };

  const saveLocation = async (value: {
    country_id: number | null;
    city_id: number | null;
  }) => {
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
      { key: "overview" as const, label: "Overview & Business", icon: Briefcase },
      ...(canViewBookings
        ? [
            {
              key: "bookings" as const,
              label: "Bookings",
              icon: CalendarCheck,
              count: summary?.total_bookings ?? recentBookings.length,
            },
          ]
        : []),
      ...(canViewCustomers
        ? [
            {
              key: "customers" as const,
              label: "Customers",
              icon: Users,
              count: summary?.total_customers ?? agencyCustomers.length,
            },
          ]
        : []),
      {
        key: "contacts" as const,
        label: "Contacts & People",
        icon: Users,
        count: contacts.length > 0 ? contacts.length : registrationContact ? 1 : 0,
      },
      { key: "invoicing" as const, label: "Bank & Invoicing", icon: Receipt },
      {
        key: "documents" as const,
        label: "Compliance Documents",
        icon: FileText,
        count: documents.length,
      },
      {
        key: "history" as const,
        label: "Audit History",
        icon: History,
        count: record?.approval_history?.length ?? 0,
      },
    ],
    [
      canViewBookings,
      canViewCustomers,
      summary?.total_bookings,
      summary?.total_customers,
      recentBookings.length,
      agencyCustomers.length,
      contacts.length,
      registrationContact,
      documents.length,
      record?.approval_history?.length,
    ],
  );

  // Verification checks
  const checks = [
    {
      label: "Profile",
      done: Boolean(
        record?.agent_name &&
        record?.agent_type &&
        record?.country_name &&
        record?.city_name,
      ),
    },
    {
      label: "Business Registration",
      done: Boolean(
        businessInfo?.iata_registration_number ||
        businessInfo?.business_registration_number ||
        businessInfo?.gst_tax_number,
      ),
    },
    {
      label: "Invoicing & Bank",
      done: hasInvoicing,
    },
    {
      label: "Documents",
      done: documents.length > 0 && documents.some((d) => d.status === "approved"),
    },
  ];

  const approvedDocsCount = documents.filter((d) => d.status === "approved").length;

  return (
    <ModuleWrapper title="Agent Detail" requiredPermission="agents.view">
      {loading ? (
        <Loader label="Loading agent detail..." />
      ) : record ? (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/admin/agents"
              className="inline-flex items-center gap-2 text-sm font-bold text-dash-text hover:text-dash-brand"
            >
              <ArrowLeft size={16} /> Back to agents
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {hasPermission("agents.approve") && Boolean((record.invoicing as { bank_edit_request_pending?: boolean } | null)?.bank_edit_request_pending) && (
                <button
                  onClick={() => void run(() => api.post(`/agents/${id}/bank-details/unlock`), "Bank details enabled for one update.")}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-xs hover:bg-amber-100 transition"
                >
                  Enable bank edit
                </button>
              )}
              {canApprove && (
                <button
                  onClick={() =>
                    void run(
                      () => approveReviewRecord("agents", id),
                      "Agent approved.",
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 size={15} /> Approve
                </button>
              )}
              {canPartial && (
                <button
                  onClick={() => setModal("partial")}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-xs hover:bg-amber-100 transition"
                >
                  <ShieldHalf size={15} /> Request Changes
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => setModal("reject")}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                >
                  <XCircle size={15} /> Reject
                </button>
              )}
              {canBlock && (
                <button
                  onClick={() =>
                    isBlocked
                      ? void run(
                          () =>
                            updateReviewRecord("agents", id, {
                              status: "active",
                            }),
                          "Agent unblocked.",
                        )
                      : setModal("block")
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-muted hover:bg-dash-bg hover:text-dash-text transition"
                >
                  <Ban size={14} /> {isBlocked ? "Unblock Account" : "Block"}
                </button>
              )}
              {canCommercial && (
                <button
                  onClick={() => setModal("commercial")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text hover:bg-slate-50 transition"
                >
                  <Percent size={14} className="text-dash-brand" /> Set Discount
                </button>
              )}
              {canEditLocation && (
                <button
                  onClick={() => setLocationModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text hover:bg-slate-50 transition"
                >
                  <MapPin size={14} className="text-dash-subtle" /> Edit Location
                </button>
              )}
            </div>
          </div>

          {/* Profile Hero with Logo & Contact Details */}
          <ReviewProfileHero
            name={String(record.agent_name || record.name || "-")}
            code={record.agent_code || record.code}
            entityType={record.agent_type || record.type}
            countryName={record.country_name}
            cityName={record.city_name}
            yearsInOperation={typeof yearsInBusiness === "number" ? yearsInBusiness : record.years_in_operation}
            status={record.status}
            approvalStatus={record.approval_status}
            rejectionReason={record.rejection_reason}
            adminComments={record.admin_comments || record.pending_requirements}
            contactEmail={primaryContact?.email || registrationContact?.email}
            contactPhone={primaryContact?.phone || registrationContact?.phone}
            logoUrl={record.business_logo}
            tradingName={businessInfo?.trading_name as string}
            currency={displayCurrency}
            commissionAccepted={Boolean(record.commission_accepted_at)}
            registeredAt={record.created_at}
          />

          {/* Pending Commission Request Banner */}
          {record.commission_request_status === "pending" && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                  <Clock size={14} /> Agent Discount / Commission Request Pending Review
                </span>
                <p className="mt-1 text-lg font-black text-dash-text">
                  Requested {record.commission_request_type || "percentage"}:{" "}
                  <span className="text-amber-800">{record.commission_request_value ?? 0}%</span>
                </p>
                <p className="mt-0.5 text-xs text-dash-muted">
                  Submitted from the agency self-service portal for administrative evaluation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canCommercial && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void run(
                        () => rejectAgentCommissionRequest(id),
                        "Commission request rejected.",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition"
                  >
                    <X size={14} /> Reject
                  </button>
                )}
                {canCommercial && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void run(
                        () =>
                          updateCommercialValue("agents", id, {
                            discount_type: String(
                              record.commission_request_type || "percentage",
                            ),
                            discount_value: Number(
                              record.commission_request_value || 0,
                            ),
                          }),
                        "Commission request approved.",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    <Check size={14} /> Approve Rate
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Executive Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Commercial Discount */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                  Commercial Discount
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Percent size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-dash-text">
                {record.discount_value != null ? `${record.discount_value}%` : "0%"}
              </p>
              <p className="mt-1 text-xs text-dash-muted">
                {record.discount_type ? `${titleize(record.discount_type)} discount on public tours` : "Standard agent pricing"}
              </p>
            </div>

            {/* Total GMV / Bookings Volume */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                  Total Bookings
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <CalendarCheck size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-dash-text">
                {summary?.total_bookings ?? recentBookings.length}
              </p>
              <p className="mt-1 text-xs text-dash-muted">
                Eligible sales: <strong>{summaryMoney(summary?.sales_booking_value)}</strong>
              </p>
            </div>

            {/* Settled / Paid Revenue */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                  Paid Revenue
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-dash-text text-emerald-600">
                {summaryMoney(summary?.amount_paid)}
              </p>
              <p className="mt-1 text-xs text-dash-muted">
                Outstanding: {summaryMoney(summary?.amount_pending)}
              </p>
            </div>

            {/* Compliance Documents */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                  Compliance Docs
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <FileText size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-dash-text">
                {approvedDocsCount} / {documents.length}
              </p>
              <p className="mt-1 text-xs text-dash-muted">
                {documents.length > 0 && approvedDocsCount === documents.length
                  ? "All uploaded documents verified"
                  : `${documents.length - approvedDocsCount} document(s) pending review`}
              </p>
            </div>
          </div>

          {/* Verification Checklist Ribbon */}
          <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-dash-subtle">
                Agency Verification Checklist
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {checks.filter((c) => c.done).length} of {checks.length} Completed
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    check.done
                      ? "border-emerald-200 bg-emerald-50/70"
                      : "border-amber-200 bg-amber-50/70"
                  }`}
                >
                  {check.done ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  ) : (
                    <Clock size={18} className="shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        check.done ? "text-emerald-800" : "text-amber-800"
                      }`}
                    >
                      {check.label}
                    </p>
                    <p className="text-xs font-black text-dash-text">
                      {check.done ? "Verified" : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Tabbed Container */}
          <section className="rounded-2xl border border-dash-border-soft bg-white shadow-xs overflow-hidden">
            <div className="flex flex-wrap gap-1 border-b border-[#F0F3F8] bg-slate-50/50 p-2.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    activeTab === tab.key
                      ? "bg-white text-dash-brand shadow-xs ring-1 ring-slate-200/80"
                      : "text-dash-muted hover:bg-white/60 hover:text-dash-text"
                  }`}
                >
                  <tab.icon size={15} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        activeTab === tab.key
                          ? "bg-dash-brand text-white"
                          : "bg-slate-200/70 text-dash-muted"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* TAB 1: OVERVIEW & BUSINESS */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Company & Legal Identity */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="text-dash-brand" size={18} />
                      <h3 className="text-sm font-black text-dash-text">Agency & Legal Identity</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Legal Name</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {valueText(record.agent_name || record.name)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Trading / Brand Name</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {valueText(businessInfo?.trading_name as DetailValue)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Agency Type</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {readableValue(record.agent_type)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Country & City</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {[record.city_name, record.country_name].filter(Boolean).join(", ") || "-"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Years in Operation</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {yearsInBusiness ? `${yearsInBusiness} years` : "-"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Operating Currency</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {valueText(record.currency || "USD")}
                        </p>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3 rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Registered Agency Address</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {valueText(record.business_address)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Regulatory & IATA Compliance */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="text-dash-brand" size={18} />
                      <h3 className="text-sm font-black text-dash-text">IATA & Regulatory Compliance</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase text-dash-subtle">IATA Registration #</p>
                          {Boolean(businessInfo?.iata_registration_number) && (
                            <button
                              type="button"
                              onClick={() =>
                                copyValue(
                                  String(businessInfo?.iata_registration_number),
                                  "IATA Number",
                                )
                              }
                              className="text-dash-muted hover:text-dash-brand"
                              title="Copy"
                            >
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-sm font-bold text-dash-text">
                          {valueText(businessInfo?.iata_registration_number as DetailValue)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase text-dash-subtle">Business Registration #</p>
                          {Boolean(businessInfo?.business_registration_number) && (
                            <button
                              type="button"
                              onClick={() =>
                                copyValue(
                                  String(businessInfo?.business_registration_number),
                                  "Registration Number",
                                )
                              }
                              className="text-dash-muted hover:text-dash-brand"
                              title="Copy"
                            >
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-sm font-bold text-dash-text">
                          {valueText(businessInfo?.business_registration_number as DetailValue)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase text-dash-subtle">GST / VAT / Tax ID</p>
                          {Boolean(businessInfo?.gst_tax_number) && (
                            <button
                              type="button"
                              onClick={() =>
                                copyValue(String(businessInfo?.gst_tax_number), "Tax Number")
                              }
                              className="text-dash-muted hover:text-dash-brand"
                              title="Copy"
                            >
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-sm font-bold text-dash-text">
                          {valueText(businessInfo?.gst_tax_number as DetailValue)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Certificate of Incorporation</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {valueText(businessInfo?.certificate_of_incorporation as DetailValue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Market Scope & Reach */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="text-dash-brand" size={18} />
                      <h3 className="text-sm font-black text-dash-text">Market Reach & Capacity</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Target Market</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {valueText(businessInfo?.target_market as DetailValue)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Destinations Sold</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {valueText(businessInfo?.destinations_sold as DetailValue)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Monthly Customers</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {businessInfo?.monthly_customers_count
                            ? `${businessInfo.monthly_customers_count} travelers/mo`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Digital & Online Presence */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="text-dash-brand" size={18} />
                      <h3 className="text-sm font-black text-dash-text">Digital Presence & Website</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Business Email</p>
                        {businessInfo?.business_email ? (
                          <a
                            href={`mailto:${businessInfo.business_email}`}
                            className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-dash-brand hover:underline"
                          >
                            <Mail size={13} /> {String(businessInfo.business_email)}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-dash-muted">-</p>
                        )}
                      </div>

                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Official Website</p>
                        {businessInfo?.website_url ? (
                          <a
                            href={String(businessInfo.website_url).startsWith("http") ? String(businessInfo.website_url) : `https://${businessInfo.website_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-dash-brand hover:underline"
                          >
                            <ExternalLink size={13} /> {String(businessInfo.website_url)}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-dash-muted">-</p>
                        )}
                      </div>

                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Registered At</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {formatDocDate(record.created_at) || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BOOKINGS */}
              {activeTab === "bookings" && canViewBookings && (
                <div className="space-y-4">
                  {recentBookings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <CalendarCheck className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">No Bookings Attributed Yet</h4>
                      <p className="mt-1 text-xs text-dash-muted">
                        Bookings created by this agent or booked for their travelers will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-dash-subtle border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-bold">Booking Code</th>
                            <th className="px-4 py-3 font-bold">Customer</th>
                            <th className="px-4 py-3 font-bold">Tour</th>
                            <th className="px-4 py-3 font-bold">Booking Status</th>
                            <th className="px-4 py-3 font-bold">Payment Status</th>
                            <th className="px-4 py-3 font-bold text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {recentBookings.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-4 py-3 font-mono font-bold text-dash-brand">
                                <Link href={`/admin/bookings/${b.id}`} className="hover:underline">
                                  {b.booking_code}
                                </Link>
                              </td>
                              <td className="px-4 py-3 font-medium text-dash-text">
                                {b.customer_name}
                              </td>
                              <td className="px-4 py-3 font-medium text-dash-text">
                                {b.tour_name}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge value={b.booking_status} />
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge value={b.payment_status} />
                              </td>
                              <td className="px-4 py-3 font-bold text-dash-text text-right">
                                {moneyText(b.final_amount, b.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CUSTOMERS */}
              {activeTab === "customers" && canViewCustomers && (
                <div className="space-y-4">
                  {agencyCustomers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <Users className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">No Customers Attributed Yet</h4>
                      <p className="mt-1 text-xs text-dash-muted">
                        Clients registered through or served by this agent will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-dash-subtle border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-bold">Customer ID</th>
                            <th className="px-4 py-3 font-bold">Full Name</th>
                            <th className="px-4 py-3 font-bold">Email</th>
                            <th className="px-4 py-3 font-bold">Phone</th>
                            <th className="px-4 py-3 font-bold">Bookings</th>
                            <th className="px-4 py-3 font-bold text-right">Total Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {agencyCustomers.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-4 py-3 font-mono font-bold text-dash-brand">
                                <Link href={`/admin/customers/${c.id}`} className="hover:underline">
                                  {c.customer_code || `#${c.id}`}
                                </Link>
                              </td>
                              <td className="px-4 py-3 font-bold text-dash-text">
                                {c.full_name}
                              </td>
                              <td className="px-4 py-3 text-dash-muted">
                                {c.email}
                              </td>
                              <td className="px-4 py-3 text-dash-muted">
                                {c.phone}
                              </td>
                              <td className="px-4 py-3 font-bold text-dash-text">
                                {c.booking_count}
                              </td>
                              <td className="px-4 py-3 font-bold text-dash-text text-right">
                                {moneyText(c.booking_value, summaryCurrency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CONTACTS & REPRESENTATIVES */}
              {activeTab === "contacts" && (
                <div className="space-y-6">
                  {/* Account Owner Card */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="text-dash-brand" size={18} />
                        <h3 className="text-sm font-black text-dash-text">
                          Registered Account Owner / Signatory
                        </h3>
                      </div>
                      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
                        Primary Account Signatory
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Full Name</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {valueText(registrationContact?.full_name)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Login Email</p>
                        {registrationContact?.email ? (
                          <a
                            href={`mailto:${registrationContact.email}`}
                            className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-dash-brand hover:underline"
                          >
                            <Mail size={13} /> {registrationContact.email}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-dash-muted">-</p>
                        )}
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Mobile Number</p>
                        {registrationContact?.phone ? (
                          <a
                            href={`tel:${registrationContact.phone}`}
                            className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-dash-brand hover:underline"
                          >
                            <Phone size={13} /> {registrationContact.phone}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-dash-muted">-</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Key Contacts / Agency Staff */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="text-dash-brand" size={18} />
                        <h3 className="text-sm font-black text-dash-text">
                          Authorized Representatives & Staff Contacts ({contacts.length})
                        </h3>
                      </div>
                    </div>

                    {contacts.length === 0 ? (
                      <div className="rounded-xl bg-dash-bg p-6 text-center">
                        <p className="text-sm font-semibold text-dash-muted">
                          No additional secondary contacts listed by this agency.
                        </p>
                        <p className="mt-1 text-xs text-dash-subtle">
                          All operational notices route directly to the primary account owner above.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {contacts.map((contact, index) => {
                          const fullName =
                            contact.contact_name ||
                            [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
                            `Contact ${index + 1}`;
                          return (
                            <div
                              key={contact.id ?? index}
                              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-bold text-dash-text">{fullName}</h4>
                                  {contact.is_primary && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs font-semibold text-dash-subtle uppercase">
                                  {valueText(contact.designation)}
                                </p>

                                <div className="mt-3 space-y-1.5 text-xs text-dash-body">
                                  {contact.email && (
                                    <p className="flex items-center gap-2">
                                      <Mail size={13} className="text-dash-subtle shrink-0" />
                                      <a
                                        href={`mailto:${contact.email}`}
                                        className="truncate hover:text-dash-brand"
                                      >
                                        {String(contact.email)}
                                      </a>
                                    </p>
                                  )}
                                  {contact.phone && (
                                    <p className="flex items-center gap-2">
                                      <Phone size={13} className="text-dash-subtle shrink-0" />
                                      <a
                                        href={`tel:${contact.phone}`}
                                        className="hover:text-dash-brand"
                                      >
                                        {String(contact.phone)}
                                      </a>
                                    </p>
                                  )}
                                  {contact.alternate_phone && (
                                    <p className="flex items-center gap-2 text-dash-muted">
                                      <Phone size={13} className="text-dash-subtle shrink-0" />
                                      Alt: {String(contact.alternate_phone)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {contact.preferred_contact_method && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-dash-subtle">
                                  <span>Preferred Channel:</span>
                                  <span className="font-semibold text-dash-text capitalize">
                                    {String(contact.preferred_contact_method).replace(/_/g, " ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: BANK & INVOICING */}
              {activeTab === "invoicing" && (
                <div className="space-y-6">
                  {!hasInvoicing ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <CreditCard className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">
                        No Invoicing & Settlement Details Submitted Yet
                      </h4>
                      <p className="mt-1 text-xs text-dash-muted max-w-md mx-auto">
                        This agency has not submitted payout bank or billing details. Details will appear here once saved in the agency portal.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Payout Bank Account */}
                      <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="text-dash-brand" size={18} />
                            <h3 className="text-sm font-black text-dash-text">
                              Payout Bank & Settlement Account
                            </h3>
                          </div>
                          {Boolean(invoicing?.bank_details_locked) && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              <Lock size={12} /> Verified & Locked
                            </span>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">
                              Preferred Method
                            </p>
                            <p className="mt-1 text-sm font-bold text-dash-text capitalize">
                              {readableValue(invoicing?.preferred_payment_method as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">
                              Beneficiary Account Name
                            </p>
                            <p className="mt-1 text-sm font-bold text-dash-text">
                              {valueText(invoicing?.account_name as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold uppercase text-dash-subtle">
                                Account Number
                              </p>
                              {Boolean(invoicing?.account_number) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyValue(String(invoicing?.account_number), "Account Number")
                                  }
                                  className="text-dash-muted hover:text-dash-brand"
                                  title="Copy"
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 font-mono text-sm font-bold text-dash-text">
                              {valueText(invoicing?.account_number as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Bank Name</p>
                            <p className="mt-1 text-sm font-bold text-dash-text">
                              {valueText(invoicing?.bank_name as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Bank Branch</p>
                            <p className="mt-1 text-sm font-bold text-dash-text">
                              {valueText(invoicing?.bank_branch as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold uppercase text-dash-subtle">SWIFT / BIC Code</p>
                              {Boolean(invoicing?.swift_code) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyValue(String(invoicing?.swift_code), "SWIFT Code")
                                  }
                                  className="text-dash-muted hover:text-dash-brand"
                                  title="Copy"
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 font-mono text-sm font-bold text-dash-text">
                              {valueText(invoicing?.swift_code as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold uppercase text-dash-subtle">IBAN</p>
                              {Boolean(invoicing?.iban) && (
                                <button
                                  type="button"
                                  onClick={() => copyValue(String(invoicing?.iban), "IBAN")}
                                  className="text-dash-muted hover:text-dash-brand"
                                  title="Copy"
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 font-mono text-sm font-bold text-dash-text">
                              {valueText(invoicing?.iban as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Settlement Country</p>
                            <p className="mt-1 text-sm font-bold text-dash-text">
                              {getCountryName(invoicing?.country_id as DetailValue)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Billing Address Details */}
                      <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                        <div className="flex items-center gap-2 mb-4">
                          <Receipt className="text-dash-brand" size={18} />
                          <h3 className="text-sm font-black text-dash-text">
                            Billing Address & Accounts Contact
                          </h3>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Accounts Contact</p>
                            <p className="mt-1 text-sm font-bold text-dash-text">
                              {valueText(invoicing?.contact_name as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Billing Email</p>
                            {invoicing?.email ? (
                              <a
                                href={`mailto:${invoicing.email}`}
                                className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-dash-brand hover:underline"
                              >
                                <Mail size={13} /> {String(invoicing.email)}
                              </a>
                            ) : (
                              <p className="mt-1 text-sm text-dash-muted">-</p>
                            )}
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Billing Phone</p>
                            {invoicing?.phone ? (
                              <a
                                href={`tel:${invoicing.phone}`}
                                className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-dash-brand hover:underline"
                              >
                                <Phone size={13} /> {String(invoicing.phone)}
                              </a>
                            ) : (
                              <p className="mt-1 text-sm text-dash-muted">-</p>
                            )}
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Tax / VAT Number</p>
                            <p className="mt-1 font-mono text-sm font-bold text-dash-text">
                              {valueText(invoicing?.tax_number as DetailValue)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">City & State</p>
                            <p className="mt-1 text-sm font-bold text-dash-text">
                              {[invoicing?.billing_city, invoicing?.billing_state]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Postal Code & Country</p>
                            <p className="mt-1 text-sm font-bold text-dash-text">
                              {[
                                invoicing?.billing_postal_code,
                                getCountryName(invoicing?.country_id as DetailValue),
                              ]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </p>
                          </div>

                          <div className="sm:col-span-2 lg:col-span-3 rounded-xl bg-dash-bg p-3.5">
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Billing Street Address</p>
                            <p className="mt-1 text-sm font-semibold text-dash-text">
                              {valueText(invoicing?.billing_address as DetailValue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 6: COMPLIANCE DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  {documents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <FileText className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">No Documents Uploaded</h4>
                      <p className="mt-1 text-xs text-dash-muted">
                        This agency has not uploaded any verification or compliance documents yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {documents.map((doc, index) => {
                        const typeTitle = titleize(String(doc.document_type || "Document"));
                        const fileName = String(doc.document_name || "");
                        const fileFormat = getFileFormat(fileName, doc.mime_type);
                        const formattedDate = formatDocDate(doc.uploaded_at);
                        const fileSize = formatFileSize(doc.file_size);
                        const hasRejection = Boolean(
                          doc.rejection_reason &&
                          String(doc.rejection_reason).trim() &&
                          String(doc.rejection_reason).trim() !== "-",
                        );

                        return (
                          <div
                            key={doc.id ?? index}
                            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md"
                          >
                            <div>
                              {/* Header: Icon + Title + Status */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                                      fileFormat === "PDF"
                                        ? "bg-rose-50 text-rose-600 ring-rose-100"
                                        : "bg-sky-50 text-sky-600 ring-sky-100"
                                    }`}
                                  >
                                    <FileText size={18} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4
                                      className="truncate text-sm font-bold text-dash-text"
                                      title={typeTitle}
                                    >
                                      {typeTitle}
                                    </h4>
                                    <p
                                      className="mt-0.5 truncate text-xs font-medium text-dash-muted"
                                      title={fileName}
                                    >
                                      {fileName || "Untitled file"}
                                    </p>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  <StatusBadge value={String(doc.status || "pending")} />
                                </div>
                              </div>

                              {/* Metadata Line */}
                              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                                {fileFormat && (
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                                      fileFormat === "PDF"
                                        ? "border border-rose-200 bg-rose-50 text-rose-700"
                                        : "border border-slate-200 bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {fileFormat}
                                  </span>
                                )}
                                {fileSize && (
                                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {fileSize}
                                  </span>
                                )}
                                {formattedDate && (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-dash-muted">
                                    <CalendarDays size={13} className="text-dash-subtle" />
                                    {formattedDate}
                                  </span>
                                )}
                              </div>

                              {/* Rejection notice */}
                              {hasRejection && (
                                <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                                  <XCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                                  <div>
                                    <span className="font-bold">Rejection reason:</span>{" "}
                                    {String(doc.rejection_reason)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                              {(doc.file_url || doc.file_path) && doc.id !== undefined && (
                                <button
                                  type="button"
                                  onClick={() => void viewDocument(doc.id!)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-1.5 text-xs font-bold text-dash-brand shadow-xs hover:border-dash-brand hover:bg-[#E7F5FF] transition"
                                >
                                  <Eye size={13} /> View Document
                                </button>
                              )}
                              {canReviewDocuments && doc.status !== "approved" && (
                                <button
                                  type="button"
                                  onClick={() => doc.id !== undefined && approveDocument(doc.id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                >
                                  <Check size={13} /> Accept
                                </button>
                              )}
                              {canReviewDocuments && doc.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (doc.id !== undefined) {
                                      setReviewDocumentId(doc.id);
                                      setModal("reject-document");
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-50 transition"
                                >
                                  <X size={13} /> Reject
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: AUDIT HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  {(!record.approval_history || record.approval_history.length === 0) ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <History className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">No Approval History Logged</h4>
                      <p className="mt-1 text-xs text-dash-muted">
                        State transitions and approval changes will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 space-y-4">
                      {record.approval_history.map((entry, idx) => (
                        <div key={entry.id ?? idx} className="relative flex items-start gap-4">
                          <span className="absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-4 ring-slate-100">
                            <span className="h-2 w-2 rounded-full bg-dash-brand" />
                          </span>

                          <div className="flex-1 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {entry.from_status && (
                                  <>
                                    <StatusBadge value={entry.from_status} />
                                    <span className="text-xs text-dash-subtle">→</span>
                                  </>
                                )}
                                <StatusBadge value={entry.to_status} />
                              </div>
                              <time className="text-xs font-semibold text-dash-muted flex items-center gap-1">
                                <Clock size={12} className="text-dash-subtle" />
                                {formatDocDate(entry.created_at)}
                              </time>
                            </div>

                            {entry.notes && (
                              <p className="mt-2.5 text-xs text-dash-body rounded-lg bg-dash-bg p-2.5 border border-slate-100">
                                {entry.notes}
                              </p>
                            )}

                            {entry.changed_by && (
                              <p className="mt-2 text-[11px] text-dash-subtle">
                                Action taken by User ID: #{entry.changed_by}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Action Modals */}
          <ActionModal
            open={modal === "reject"}
            title="Reject agent"
            saving={saving}
            submitLabel="Reject"
            onClose={() => setModal(null)}
            onSubmit={(payload) =>
              void run(
                () =>
                  rejectReviewRecord("agents", id, {
                    rejection_reason: String(payload.rejection_reason || ""),
                    admin_comments: String(payload.admin_comments || ""),
                  }),
                "Agent rejected.",
              )
            }
            fields={[
              {
                name: "rejection_reason",
                label: "Rejection reason",
                required: true,
              },
              {
                name: "admin_comments",
                label: "Admin comments",
                type: "textarea",
              },
            ]}
          />

          <ActionModal
            open={modal === "partial"}
            title="Request agent changes"
            saving={saving}
            submitLabel="Send request"
            onClose={() => setModal(null)}
            onSubmit={(payload) =>
              void run(
                () =>
                  partialApproveReviewRecord("agents", id, {
                    admin_comments: String(payload.admin_comments || ""),
                    pending_requirements: String(
                      payload.pending_requirements || "",
                    ),
                  }),
                "Agent change request sent.",
              )
            }
            fields={[
              {
                name: "pending_requirements",
                label: "Required changes",
                type: "textarea",
              },
              {
                name: "admin_comments",
                label: "Admin comments",
                type: "textarea",
              },
            ]}
          />

          <ActionModal
            open={modal === "commercial"}
            title="Set agent discount rate"
            saving={saving}
            submitLabel="Save rate"
            onClose={() => setModal(null)}
            onSubmit={(payload) => {
              const discountValue = Number(payload.discount_value || 0);
              if (
                payload.discount_type === "percentage" &&
                agentCommissionMax !== null &&
                discountValue > agentCommissionMax
              ) {
                toast.error(
                  `Percentage discount cannot exceed platform maximum of ${agentCommissionMax}%.`,
                );
                return;
              }
              void run(
                () =>
                  updateCommercialValue("agents", id, {
                    discount_type: String(payload.discount_type || "percentage"),
                    discount_value: discountValue,
                  }),
                "Agent discount updated.",
              );
            }}
            initialValues={{
              discount_type: String(record.discount_type || "percentage"),
              discount_value: record.discount_value ?? 0,
            }}
            fields={[
              {
                name: "discount_type",
                label: "Discount model",
                type: "select",
                options: [
                  { label: "Percentage (%)", value: "percentage" },
                  { label: "Fixed amount (USD)", value: "fixed" },
                ],
              },
              {
                name: "discount_value",
                label: "Value",
                type: "number",
              },
            ]}
          />

          <ActionModal
            open={modal === "block"}
            title="Block agent account"
            saving={saving}
            submitLabel="Block"
            onClose={() => setModal(null)}
            onSubmit={(payload) =>
              void run(
                () =>
                  updateReviewRecord("agents", id, {
                    status: "blocked",
                    rejection_reason: String(payload.reason || ""),
                  }),
                "Agent blocked.",
              )
            }
            fields={[{ name: "reason", label: "Reason", type: "textarea" }]}
          />

          <ActionModal
            open={modal === "reject-document"}
            title="Reject agent document"
            saving={saving}
            submitLabel="Reject document"
            onClose={() => {
              setModal(null);
              setReviewDocumentId(null);
            }}
            onSubmit={rejectDocument}
            fields={[
              {
                name: "rejection_reason",
                label: "Rejection reason",
                required: true,
              },
            ]}
          />

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
        <section className="rounded-xl border border-dash-border bg-white p-10 text-center text-dash-muted">
          Agent not found.
        </section>
      )}
    </ModuleWrapper>
  );
}

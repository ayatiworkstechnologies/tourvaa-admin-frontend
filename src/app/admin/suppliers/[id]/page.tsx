"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuBan as Ban,
  LuBriefcase as Briefcase,
  LuBuilding2 as Building2,
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
  LuLock as Lock,
  LuMail as Mail,
  LuMapPin as MapPin,
  LuPercent as Percent,
  LuPhone as Phone,
  LuReceipt as Receipt,
  LuShieldAlert as ShieldAlert,
  LuShieldCheck as ShieldCheck,
  LuShieldHalf as ShieldHalf,
  LuTruck as Truck,
  LuUser as UserIcon,
  LuUsers as Users,
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
import { useGeoCountries } from "@/hooks/useGeo";
import { openPrivateDocument } from "@/lib/api/services/privateDocumentService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

type DetailValue = string | number | boolean | null | undefined;
type DetailObject = Record<string, DetailValue>;

type SupplierDocument = DetailObject & {
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

type SupplierVehicle = DetailObject & {
  id?: number;
  make?: string;
  model?: string;
  vehicle_type?: string;
  registration_number?: string;
  year?: number;
  capacity?: number;
  fitness_certificate?: string;
  insurance_document?: string;
  vehicle_photos?: string[] | string;
  approval_status?: string;
  rejection_reason?: string | null;
  reviewed_at?: string;
  reviewed_by?: number | null;
};

type SupplierContact = DetailObject & {
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

type DocRequirement = { key: string; label: string };

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
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readableValue(value: DetailValue) {
  if (value === null || value === undefined || value === "") return valueText(value);
  if (typeof value !== "string") return valueText(value);
  return titleize(value);
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

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const { countries } = useGeoCountries();

  const [record, setRecord] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<
    | "accept"
    | "reject"
    | "partial"
    | "deactivate"
    | "suspend"
    | "reject-item"
    | null
  >(null);
  const [activeTab, setActiveTab] = useState<
    "business" | "contacts" | "invoicing" | "documents" | "vehicles" | "history"
  >("business");
  const [reviewTarget, setReviewTarget] = useState<{
    type: "document" | "vehicle";
    id: number;
  } | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const approvalStatus = String(record?.approval_status || "").toLowerCase();
  const accountStatus = String(record?.status || "").toLowerCase();
  const isApproved = ["approved", "approved_live"].includes(approvalStatus);
  const isRejected = approvalStatus === "more_information_required";
  const isBlocked =
    ["inactive", "blocked", "suspended"].includes(accountStatus) ||
    ["blocked", "suspended"].includes(approvalStatus);

  const canApprove =
    hasPermission("suppliers.approve") && !isApproved && !isBlocked;
  const canReject =
    hasPermission("suppliers.reject") && !isRejected && !isBlocked;
  const canPartial =
    !isApproved &&
    !isBlocked &&
    (hasPermission("suppliers.partial_approve") || canApprove);
  const canBlock =
    hasPermission("suppliers.edit") || hasPermission("suppliers.approve");
  const canEditLocation = hasPermission("suppliers.edit");
  const canReviewItems =
    hasPermission("suppliers.approve") || hasPermission("suppliers.reject");
  const canCommission =
    hasPermission("suppliers.edit") || hasPermission("suppliers.approve");

  const requestIdRef = useRef(0);
  const [documentTypes, setDocumentTypes] = useState<DocRequirement[]>(
    FALLBACK_DOCUMENT_TYPES,
  );
  const [minCommissionRate, setMinCommissionRate] = useState<number | null>(
    null,
  );
  const [commissionInput, setCommissionInput] = useState("");
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionError, setCommissionError] = useState("");

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

  async function saveSupplierCommission(clear: boolean) {
    if (!clear) {
      const value = Number(commissionInput);
      if (commissionInput === "" || Number.isNaN(value)) {
        setCommissionError("Enter a valid commission percentage.");
        return;
      }
      if (minCommissionRate !== null && value < minCommissionRate) {
        setCommissionError(
          `Commission cannot be lower than the platform minimum of ${minCommissionRate}%.`,
        );
        return;
      }
    }
    setCommissionSaving(true);
    setCommissionError("");
    try {
      await updateReviewRecord("suppliers", id, {
        commission_percentage: clear ? null : Number(commissionInput),
      });
      toast.success(
        clear
          ? "Commission override cleared - now tracking platform rate."
          : "Commission updated successfully.",
      );
      setCommissionInput("");
      await fetchRecord();
    } catch (error) {
      setCommissionError(getApiErrorMessage(error));
    } finally {
      setCommissionSaving(false);
    }
  }

  useEffect(() => {
    api
      .get("/settings/public")
      .then((res) => {
        const raw = res.data?.data?.supplier_commission_percentage;
        if (raw !== undefined) setMinCommissionRate(Number(raw));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get("/suppliers/document-requirements")
      .then((res) => {
        const requirements = res.data?.data;
        if (Array.isArray(requirements) && requirements.length) {
          setDocumentTypes(
            requirements.map(
              (item: { document_type: string; label: string }) => ({
                key: item.document_type,
                label: item.label,
              }),
            ),
          );
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
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const documents = (record?.documents ?? []) as SupplierDocument[];
  const vehicles = (record?.vehicles ?? []) as SupplierVehicle[];
  const contacts = (record?.contacts ?? []) as SupplierContact[];
  const primaryContact =
    contacts.find((contact) => contact.is_primary) ?? contacts[0];
  const registrationContact = record?.registration_contact;
  const storedBusinessYears = record?.business_info?.years_in_business;
  const yearsInBusiness: DetailValue =
    typeof storedBusinessYears === "string" ||
    typeof storedBusinessYears === "number"
      ? storedBusinessYears
      : record?.years_in_operation;

  const missingRequiredDocs = documentTypes.filter(
    (docType) =>
      !documents.some(
        (doc) => doc.document_type === docType.key && doc.status === "approved",
      ),
  );

  const approveDocument = (documentId: number) =>
    void run(
      () => reviewSupplierDocument(id, documentId, { status: "approved" }),
      "Document approved.",
    );

  const approveVehicle = (vehicleId: number) =>
    void run(
      () =>
        reviewSupplierVehicle(id, vehicleId, { approval_status: "approved" }),
      "Vehicle approved.",
    );

  const viewDocument = async (documentId: number) => {
    try {
      await openPrivateDocument("supplier", documentId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const saveLocation = async (value: {
    country_id: number | null;
    city_id: number | null;
  }) => {
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
        () =>
          reviewSupplierDocument(id, reviewTarget.id, {
            status: "rejected",
            rejection_reason,
          }),
        "Document rejected.",
      );
    } else {
      void run(
        () =>
          reviewSupplierVehicle(id, reviewTarget.id, {
            approval_status: "rejected",
            rejection_reason,
          }),
        "Vehicle rejected.",
      );
    }
  };

  const tabs = useMemo(
    () => [
      { key: "business" as const, label: "Business Profile", icon: Briefcase },
      {
        key: "contacts" as const,
        label: "Contacts & People",
        icon: Users,
        count: contacts.length > 0 ? contacts.length : registrationContact ? 1 : 0,
      },
      {
        key: "invoicing" as const,
        label: "Bank & Invoicing",
        icon: Receipt,
      },
      {
        key: "documents" as const,
        label: "Compliance Documents",
        icon: FileText,
        count: documents.length,
      },
      {
        key: "vehicles" as const,
        label: "Fleet & Vehicles",
        icon: Truck,
        count: vehicles.length,
      },
      {
        key: "history" as const,
        label: "Audit History",
        icon: History,
        count: record?.approval_history?.length ?? 0,
      },
    ],
    [contacts.length, registrationContact, documents.length, vehicles.length, record?.approval_history?.length],
  );

  const businessInfo = record?.business_info as Record<string, unknown> | null;
  const invoicing = record?.invoicing as Record<string, unknown> | null;
  const hasInvoicing = Boolean(
    invoicing && Object.values(invoicing).some((v) => v !== null && v !== "" && v !== undefined),
  );

  // Completion calculation
  const checks = [
    {
      label: "Basic Profile",
      done: Boolean(
        record?.supplier_name &&
        record?.supplier_type &&
        record?.country_name &&
        record?.city_name,
      ),
    },
    {
      label: "Business Registration",
      done: Boolean(
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
      done: documents.length > 0 && missingRequiredDocs.length === 0,
    },
    {
      label: "Fleet / Vehicles",
      done: vehicles.length > 0,
    },
  ];

  const approvedDocsCount = documents.filter((d) => d.status === "approved").length;
  const approvedVehiclesCount = vehicles.filter(
    (v) => v.approval_status === "approved",
  ).length;

  return (
    <ModuleWrapper title="Supplier Detail" requiredPermission="suppliers.view">
      {loading ? (
        <Loader label="Loading supplier detail..." />
      ) : record ? (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/admin/suppliers"
              className="inline-flex items-center gap-2 text-sm font-bold text-dash-text hover:text-dash-brand"
            >
              <ArrowLeft size={16} /> Back to suppliers
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/tours?supplier_id=${id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text shadow-xs hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <MapPin size={14} className="text-dash-brand" /> View Tours
              </Link>
              <Link
                href={`/admin/bookings?supplier_id=${id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text shadow-xs hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <CalendarDays size={14} className="text-dash-brand" /> View Bookings
              </Link>
              {canEditLocation && (
                <button
                  onClick={() => setLocationModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-xs font-bold text-dash-text shadow-xs hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <MapPin size={14} className="text-dash-subtle" /> Edit Location
                </button>
              )}

              {canApprove && (
                <button
                  onClick={() => setModal("accept")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 size={15} /> Accept Supplier
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
              {canBlock && isBlocked && (
                <button
                  onClick={() =>
                    void run(
                      () => setSupplierAccountState(id, "reactivate"),
                      "Supplier account reactivated.",
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-900 transition"
                >
                  <CheckCircle2 size={15} /> Reactivate
                </button>
              )}
              {canBlock && !isBlocked && (
                <button
                  onClick={() => setModal("deactivate")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-bold text-dash-muted hover:bg-dash-bg hover:text-dash-text transition"
                >
                  <Ban size={14} /> Deactivate
                </button>
              )}
              {canBlock && !isBlocked && (
                <button
                  onClick={() => setModal("suspend")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition"
                >
                  <Ban size={14} /> Suspend
                </button>
              )}
            </div>
          </div>

          {/* Hero Banner with complete metadata & logo */}
          <ReviewProfileHero
            name={String(record.supplier_name || record.name || "-")}
            code={record.supplier_code || record.code}
            entityType={record.supplier_type || record.type}
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
            currency={record.currency}
            onboardingCompleted={Boolean(record.onboarding_completed_at)}
            commissionAccepted={Boolean(record.commission_accepted_at)}
            registeredAt={record.created_at}
          />

          {/* Quick Metrics / Summary Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Commission Rate Summary */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                  Settlement Commission
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Percent size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-dash-text">
                {record.commission_percentage != null
                  ? `${record.commission_percentage}%`
                  : minCommissionRate !== null
                    ? `${minCommissionRate}%`
                    : "Platform rate"}
              </p>
              <p className="mt-1 text-xs text-dash-muted">
                {record.commission_percentage != null
                  ? "Custom rate override active"
                  : "Tracking global platform standard rate"}
              </p>
            </div>

            {/* Operating Currency & Region */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                  Operating Currency
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Coins size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-dash-text">
                {record.currency || "USD"}
              </p>
              <p className="mt-1 text-xs text-dash-muted">
                {record.country_name ? `${record.country_name} region` : "International operations"}
              </p>
            </div>

            {/* Compliance Documents */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                  Required Documents
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    missingRequiredDocs.length === 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <FileText size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-dash-text">
                {approvedDocsCount} / {documentTypes.length}
              </p>
              <p className="mt-1 text-xs text-dash-muted">
                {missingRequiredDocs.length === 0
                  ? "All required compliance documents approved"
                  : `${missingRequiredDocs.length} required document(s) pending`}
              </p>
            </div>

            {/* Fleet & Vehicles */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                  Fleet Registered
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Truck size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-dash-text">
                {vehicles.length} {vehicles.length === 1 ? "Vehicle" : "Vehicles"}
              </p>
              <p className="mt-1 text-xs text-dash-muted">
                {vehicles.length > 0
                  ? `${approvedVehiclesCount} approved for operational service`
                  : "No vehicles registered yet"}
              </p>
            </div>
          </div>

          {/* Verification Checklist Ribbon */}
          <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-dash-subtle">
                Supplier Compliance & Onboarding Checklist
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {checks.filter((c) => c.done).length} of {checks.length} Completed
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
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

          {/* Tabbed Detail Section */}
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
              {/* TAB 1: BUSINESS PROFILE */}
              {activeTab === "business" && (
                <div className="space-y-6">
                  {/* Identity & Legal Information */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="text-dash-brand" size={18} />
                      <h3 className="text-sm font-black text-dash-text">Company & Legal Identity</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Legal Name</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {valueText(record.supplier_name || record.name)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Trading / Brand Name</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {valueText(businessInfo?.trading_name as DetailValue)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Business Type</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {readableValue(record.supplier_type)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Operating Currency</p>
                        <p className="mt-1 text-sm font-bold text-dash-text">
                          {valueText(record.currency)}
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
                      <div className="sm:col-span-2 lg:col-span-3 rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Registered Business Address</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {valueText(record.business_address)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Registration & Tax Compliance */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="text-dash-brand" size={18} />
                      <h3 className="text-sm font-black text-dash-text">Tax & Regulatory Identifiers</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

                  {/* Operational & Market Profile */}
                  <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="text-dash-brand" size={18} />
                      <h3 className="text-sm font-black text-dash-text">Operational Scope & Market Reach</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Target Market</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {valueText(businessInfo?.target_market as DetailValue)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Destinations Served</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {valueText(businessInfo?.destinations_sold as DetailValue)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-dash-bg p-3.5">
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Monthly Volume Capacity</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {businessInfo?.monthly_customers_count
                            ? `${businessInfo.monthly_customers_count} pax/month`
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
                        <p className="text-[11px] font-bold uppercase text-dash-subtle">Account Onboarding Date</p>
                        <p className="mt-1 text-sm font-semibold text-dash-text">
                          {formatDocDate(record.onboarding_completed_at) || "Not completed"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Commission Rate Configuration */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                          <Percent size={18} />
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase text-amber-800">
                            Commission Configuration
                          </p>
                          <p className="text-lg font-black text-dash-text">
                            {record.commission_percentage !== undefined &&
                            record.commission_percentage !== null
                              ? `${record.commission_percentage}% (Custom Override)`
                              : minCommissionRate !== null
                                ? `Tracking platform minimum (${minCommissionRate}%)`
                                : "Standard platform rate"}
                          </p>
                        </div>
                      </div>
                      {minCommissionRate !== null && (
                        <p className="text-xs text-dash-muted">
                          Platform minimum: <strong>{minCommissionRate}%</strong>.
                        </p>
                      )}
                    </div>

                    {canCommission && (
                      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-amber-200/80 pt-4">
                        <label>
                          <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">
                            Set custom override rate (%)
                          </span>
                          <input
                            type="number"
                            min={minCommissionRate ?? 0}
                            step="0.01"
                            value={commissionInput}
                            onChange={(e) => setCommissionInput(e.target.value)}
                            placeholder={
                              record.commission_percentage != null
                                ? String(record.commission_percentage)
                                : String(minCommissionRate ?? "")
                            }
                            className="w-48 rounded-xl border border-dash-border bg-white px-3.5 py-2 text-sm outline-none focus:border-dash-brand"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void saveSupplierCommission(false)}
                          disabled={commissionSaving}
                          className="rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60 transition"
                        >
                          {commissionSaving ? "Saving..." : "Save Override"}
                        </button>
                        {record.commission_percentage != null && (
                          <button
                            type="button"
                            onClick={() => void saveSupplierCommission(true)}
                            disabled={commissionSaving}
                            className="rounded-xl border border-dash-border bg-white px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg transition"
                          >
                            Reset to Platform Rate
                          </button>
                        )}
                        {commissionError && (
                          <p className="w-full text-xs font-semibold text-rose-600">
                            {commissionError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACTS & REPRESENTATIVES */}
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

                  {/* Key Contacts / Operations Reps */}
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
                          No additional secondary contacts listed by this supplier.
                        </p>
                        <p className="mt-1 text-xs text-dash-subtle">
                          All operational communications will route to the registered account owner above.
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

              {/* TAB 3: BANK & INVOICING */}
              {activeTab === "invoicing" && (
                <div className="space-y-6">
                  {!hasInvoicing ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <CreditCard className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">
                        No Invoicing & Settlement Details Submitted Yet
                      </h4>
                      <p className="mt-1 text-xs text-dash-muted max-w-md mx-auto">
                        The supplier has not completed their billing profile. Bank destination and tax invoice parameters will appear here once saved in the supplier portal.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Bank Details Card */}
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
                            <p className="text-[11px] font-bold uppercase text-dash-subtle">Bank Country</p>
                            <p className="mt-1 text-sm font-bold text-dash-text">
                              {getCountryName(invoicing?.bank_country_id as DetailValue)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Invoicing Contact & Billing Address */}
                      <div className="rounded-xl border border-slate-200/80 p-5 bg-white">
                        <div className="flex items-center gap-2 mb-4">
                          <Receipt className="text-dash-brand" size={18} />
                          <h3 className="text-sm font-black text-dash-text">
                            Invoicing Contact & Billing Address
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

              {/* TAB 4: COMPLIANCE DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  {/* Status Ribbon */}
                  <div
                    className={`rounded-xl p-4 text-xs font-semibold ring-1 ring-inset ${
                      missingRequiredDocs.length === 0
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                        : "bg-amber-50 text-amber-800 ring-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {missingRequiredDocs.length === 0 ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <Clock size={16} className="text-amber-600" />
                      )}
                      <span>
                        <strong>
                          {documentTypes.length - missingRequiredDocs.length} of {documentTypes.length}
                        </strong>{" "}
                        required regulatory documents approved.
                      </span>
                    </div>
                    {missingRequiredDocs.length > 0 && (
                      <p className="mt-1 text-xs text-amber-700 pl-6">
                        Missing or pending approval:{" "}
                        {missingRequiredDocs.map((d) => d.label).join(", ")}
                      </p>
                    )}
                  </div>

                  {documents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <FileText className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">No Documents Uploaded</h4>
                      <p className="mt-1 text-xs text-dash-muted">
                        The supplier has not submitted any verification documents yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {documents.map((doc, index) => {
                        const matchedType = documentTypes.find(
                          (t) => t.key === String(doc.document_type || ""),
                        );
                        const typeTitle =
                          matchedType?.label ||
                          titleize(String(doc.document_type || "Document"));
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
                              {canReviewItems && doc.status !== "approved" && (
                                <button
                                  type="button"
                                  onClick={() => doc.id !== undefined && approveDocument(doc.id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                >
                                  <Check size={13} /> Accept
                                </button>
                              )}
                              {canReviewItems && doc.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    doc.id !== undefined && openRejectItem("document", doc.id)
                                  }
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

              {/* TAB 5: FLEET & VEHICLES */}
              {activeTab === "vehicles" && (
                <div className="space-y-6">
                  {vehicles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <Truck className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">No Vehicles Added</h4>
                      <p className="mt-1 text-xs text-dash-muted">
                        This supplier has not added any fleet or transportation vehicles.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {vehicles.map((vehicle, index) => {
                        const vehicleTitle =
                          [titleize(String(vehicle.make || "")), titleize(String(vehicle.model || ""))]
                            .filter(Boolean)
                            .join(" ") || `Vehicle ${index + 1}`;
                        const vehicleType = String(vehicle.vehicle_type || "Transport").toUpperCase();

                        return (
                          <div
                            key={vehicle.id ?? index}
                            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md"
                          >
                            <div>
                              {/* Top: Title + Type + Status */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                    <Truck size={17} />
                                  </span>
                                  <div className="min-w-0">
                                    <h4 className="truncate text-sm font-bold text-dash-text" title={vehicleTitle}>
                                      {vehicleTitle}
                                    </h4>
                                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 tracking-wider">
                                      {vehicleType}
                                    </span>
                                  </div>
                                </div>
                                <StatusBadge value={String(vehicle.approval_status || "pending")} />
                              </div>

                              {/* Vehicle Specs Grid */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-lg bg-dash-bg p-2.5">
                                  <span className="text-[10px] font-bold uppercase text-dash-subtle">
                                    Registration Plate
                                  </span>
                                  <div className="mt-0.5 flex items-center justify-between">
                                    <span className="font-mono font-bold text-dash-text">
                                      {valueText(vehicle.registration_number)}
                                    </span>
                                    {vehicle.registration_number && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          copyValue(String(vehicle.registration_number), "Plate Number")
                                        }
                                        className="text-dash-muted hover:text-dash-brand"
                                        title="Copy"
                                      >
                                        <Copy size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-lg bg-dash-bg p-2.5">
                                  <span className="text-[10px] font-bold uppercase text-dash-subtle">
                                    Passenger Capacity
                                  </span>
                                  <p className="mt-0.5 font-bold text-dash-text">
                                    {vehicle.capacity ? `${vehicle.capacity} seats` : "-"}
                                  </p>
                                </div>

                                <div className="rounded-lg bg-dash-bg p-2.5">
                                  <span className="text-[10px] font-bold uppercase text-dash-subtle">
                                    Manufacturing Year
                                  </span>
                                  <p className="mt-0.5 font-bold text-dash-text">
                                    {valueText(vehicle.year)}
                                  </p>
                                </div>

                                <div className="rounded-lg bg-dash-bg p-2.5">
                                  <span className="text-[10px] font-bold uppercase text-dash-subtle">
                                    Inspection Date
                                  </span>
                                  <p className="mt-0.5 font-bold text-dash-text">
                                    {formatDocDate(vehicle.reviewed_at) || "-"}
                                  </p>
                                </div>
                              </div>

                              {/* Rejection Note */}
                              {vehicle.rejection_reason && (
                                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                                  <strong>Rejection reason:</strong> {String(vehicle.rejection_reason)}
                                </div>
                              )}

                              {/* Document Links */}
                              {(vehicle.fitness_certificate ||
                                vehicle.insurance_document ||
                                vehicle.vehicle_photos) && (
                                <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                                  {vehicle.fitness_certificate && (
                                    <a
                                      href={String(vehicle.fitness_certificate)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg border border-dash-border px-2.5 py-1 text-[11px] font-bold text-dash-brand hover:bg-[#E7F5FF]"
                                    >
                                      <Eye size={12} /> Fitness
                                    </a>
                                  )}
                                  {vehicle.insurance_document && (
                                    <a
                                      href={String(vehicle.insurance_document)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg border border-dash-border px-2.5 py-1 text-[11px] font-bold text-dash-brand hover:bg-[#E7F5FF]"
                                    >
                                      <Eye size={12} /> Insurance
                                    </a>
                                  )}
                                  {vehicle.vehicle_photos && (
                                    <a
                                      href={Array.isArray(vehicle.vehicle_photos) ? String(vehicle.vehicle_photos[0]) : String(vehicle.vehicle_photos)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg border border-dash-border px-2.5 py-1 text-[11px] font-bold text-dash-brand hover:bg-[#E7F5FF]"
                                    >
                                      <Eye size={12} /> Photos
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {canReviewItems && (
                              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                                {vehicle.approval_status !== "approved" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      vehicle.id !== undefined && approveVehicle(vehicle.id)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                  >
                                    <Check size={13} /> Accept Vehicle
                                  </button>
                                )}
                                {vehicle.approval_status !== "rejected" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      vehicle.id !== undefined &&
                                      openRejectItem("vehicle", vehicle.id)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-50 transition"
                                  >
                                    <X size={13} /> Reject
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: AUDIT HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  {(!record.approval_history || record.approval_history.length === 0) ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                      <History className="mx-auto text-dash-subtle mb-3" size={32} />
                      <h4 className="text-sm font-bold text-dash-text">No Approval History Logged</h4>
                      <p className="mt-1 text-xs text-dash-muted">
                        State transitions and administrative events will appear here.
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
            open={modal === "accept"}
            title="Accept supplier"
            saving={saving}
            submitLabel="Accept and unlock operations"
            onClose={() => setModal(null)}
            onSubmit={() =>
              void run(
                () => acceptSupplier(id),
                "Supplier approved and operational modules unlocked.",
              )
            }
          >
            <p className="text-sm leading-6 text-dash-muted">
              Accepting this supplier immediately unlocks tour creation,
              departures, bookings, calendar, payments, payouts and operational
              reports.
            </p>
            {missingRequiredDocs.length > 0 && (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
                ⚠ {missingRequiredDocs.length} of {documentTypes.length}{" "}
                required documents are missing or not yet approved:{" "}
                {missingRequiredDocs.map((docType) => docType.label).join(", ")}
                .
              </p>
            )}
          </ActionModal>

          <ActionModal
            open={modal === "reject"}
            title="Reject supplier"
            saving={saving}
            submitLabel="Reject"
            onClose={() => setModal(null)}
            onSubmit={(payload) =>
              void run(
                () =>
                  rejectReviewRecord("suppliers", id, {
                    rejection_reason: String(payload.rejection_reason || ""),
                    admin_comments: String(payload.admin_comments || ""),
                  }),
                "Supplier rejected.",
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
            title="Request supplier changes"
            saving={saving}
            submitLabel="Send request"
            onClose={() => setModal(null)}
            onSubmit={(payload) =>
              void run(
                () =>
                  partialApproveReviewRecord("suppliers", id, {
                    admin_comments: String(payload.admin_comments || ""),
                    pending_requirements: String(
                      payload.pending_requirements || "",
                    ),
                  }),
                "Supplier change request sent.",
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
            open={modal === "deactivate"}
            title="Deactivate supplier account"
            saving={saving}
            submitLabel="Deactivate"
            onClose={() => setModal(null)}
            onSubmit={(payload) =>
              void run(
                () =>
                  setSupplierAccountState(
                    id,
                    "deactivate",
                    String(payload.reason || ""),
                  ),
                "Supplier account deactivated.",
              )
            }
            fields={[{ name: "reason", label: "Reason", type: "textarea" }]}
          />

          <ActionModal
            open={modal === "suspend"}
            title="Suspend supplier account"
            saving={saving}
            submitLabel="Suspend"
            onClose={() => setModal(null)}
            onSubmit={(payload) =>
              void run(
                () =>
                  setSupplierAccountState(
                    id,
                    "suspend",
                    String(payload.reason || ""),
                  ),
                "Supplier account suspended.",
              )
            }
            fields={[{ name: "reason", label: "Reason", type: "textarea" }]}
          />

          <ActionModal
            open={modal === "reject-item"}
            title={
              reviewTarget?.type === "vehicle"
                ? "Reject vehicle"
                : "Reject document"
            }
            saving={saving}
            submitLabel="Reject"
            onClose={() => {
              setModal(null);
              setReviewTarget(null);
            }}
            onSubmit={submitRejectItem}
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
            title="Edit supplier location"
            countryId={record.country_id ?? null}
            cityId={record.city_id ?? null}
            saving={saving}
            onClose={() => setLocationModalOpen(false)}
            onSave={(value) => void saveLocation(value)}
          />
        </div>
      ) : (
        <section className="rounded-xl border border-dash-border bg-white p-10 text-center text-dash-muted">
          Supplier not found.
        </section>
      )}
    </ModuleWrapper>
  );
}

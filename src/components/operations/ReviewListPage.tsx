"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuEye as Eye, LuFileText as FileText, LuPlus as Plus, LuRefreshCw as RefreshCw, LuTruck as Truck, LuCircleX as XCircle } from "react-icons/lu";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import StatusBadge from "@/components/operations/StatusBadge";
import ActionModal from "@/components/operations/ActionModal";
import { createReviewRecord, listReviewRecords, ReviewModule, ReviewRecord } from "@/lib/api/services/operationsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type Props = {
  module: ReviewModule;
  title: string;
  requiredPermission: string;
};


function supplierProgress(row: ReviewRecord) {
  const docs = row.documents?.length ?? 0;
  const vehicles = row.vehicles?.length ?? 0;
  const hasBusiness = Boolean(row.business_info && Object.values(row.business_info).some(Boolean));
  const hasLocation = Boolean(row.country_name && row.city_name);
  const completeCount = [hasLocation, hasBusiness, docs > 0, vehicles > 0].filter(Boolean).length;

  return { docs, vehicles, hasBusiness, hasLocation, completeCount };
}


function agentProgress(row: ReviewRecord) {
  const docs = row.documents?.length ?? 0;
  const hasBusiness = Boolean(row.business_info && Object.values(row.business_info).some(Boolean));
  const hasLocation = Boolean(row.country_name && row.city_name);
  const hasInvoicing = Boolean(row.invoicing && Object.values(row.invoicing).some(Boolean));
  const completeCount = [hasLocation, hasBusiness, docs > 0, hasInvoicing].filter(Boolean).length;

  return { docs, hasBusiness, hasLocation, hasInvoicing, completeCount };
}

function MiniCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
      {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </span>
  );
}

const moduleNameFields = {
  suppliers: { name: "supplier_name", type: "supplier_type" },
  agents: { name: "agent_name", type: "agent_type" },
  affiliates: { name: "name", type: "business_type" },
} as const;

export default function ReviewListPage({ module, title, requiredPermission }: Props) {
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [rows, setRows] = useState<ReviewRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplierView, setSupplierView] = useState<"all" | "pending" | "approved" | "inactive">("all");

  const canCreate = hasPermission(`${module}.create`) || (module === "affiliates" && hasPermission("affiliates.approve"));
  const fields = moduleNameFields[module];

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const supplierFilters: Record<string, string | number> = {};
      if (module === "suppliers") {
        if (supplierView === "pending") supplierFilters.approval_status = "PENDING";
        if (supplierView === "approved") supplierFilters.approval_status = "APPROVED";
        if (supplierView === "inactive") supplierFilters.status = "inactive";
      }
      const response = await listReviewRecords(module, { page, limit: 10, search, ...supplierFilters });
      setRows(response.items || response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch {
      toast.error(`Could not load ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [module, page, search, supplierView, title, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchRows(), 200);
    return () => window.clearTimeout(timer);
  }, [fetchRows]);

  const create = async (payload: Record<string, string | number>) => {
    setSaving(true);
    try {
      await createReviewRecord(module, payload);
      toast.success(`${title.slice(0, -1)} created.`);
      setOpen(false);
      await fetchRows();
    } catch {
      toast.error("Could not create record.");
    } finally {
      setSaving(false);
    }
  };

  const defaultColumns: DataTableColumn<ReviewRecord>[] = [
    { key: "code", header: "ID", render: (row) => row.code || row.supplier_code || row.agent_code || row.affiliate_code || row.id },
    { key: "name", header: "Name", render: (row) => row.name || row.supplier_name || row.agent_name },
    { key: "type", header: "Type", render: (row) => row.type || row.supplier_type || row.agent_type || row.business_type || "-" },
    { key: "country", header: "Country", render: (row) => row.country_name || "-" },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "approval_status", header: "Approval", render: (row) => <StatusBadge value={row.approval_status} /> },
    { key: "activity", header: module === "suppliers" ? "Tours" : "Bookings", render: (row) => module === "suppliers" ? row.number_of_tours ?? 0 : row.total_bookings ?? 0 },
  ];

  const supplierColumns: DataTableColumn<ReviewRecord>[] = [
    { key: "code", header: "ID", className: "w-24", render: (row) => row.supplier_code || row.code || row.id },
    {
      key: "name",
      header: "Supplier",
      render: (row) => (
        <div>
          <p className="font-bold text-dash-text">{row.supplier_name || row.name || "-"}</p>
          <p className="mt-0.5 text-xs text-dash-muted">{row.supplier_type || row.type || "Type not provided"}</p>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (row) => (
        <div className="text-sm">
          <p className="font-semibold text-dash-text">{row.country_name || "Country missing"}</p>
          <p className="text-xs text-dash-muted">{row.city_name || "City missing"}</p>
        </div>
      ),
    },
    {
      key: "registration",
      header: "Registration",
      render: (row) => {
        const progress = supplierProgress(row);
        return (
          <div className="flex flex-wrap gap-1.5">
            <MiniCheck ok={progress.hasLocation} label="Profile" />
            <MiniCheck ok={progress.hasBusiness} label="Business" />
            <MiniCheck ok={progress.docs > 0} label={`${progress.docs} docs`} />
            <MiniCheck ok={progress.vehicles > 0} label={`${progress.vehicles} vehicles`} />
          </div>
        );
      },
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "approval_status", header: "Approval", render: (row) => <StatusBadge value={row.approval_status} /> },
    {
      key: "activity",
      header: "Activity",
      render: (row) => (
        <div className="flex gap-2 text-xs font-bold text-dash-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-dash-bg px-2 py-1"><FileText size={12} /> {row.documents?.length ?? 0}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-dash-bg px-2 py-1"><Truck size={12} /> {row.vehicles?.length ?? 0}</span>
        </div>
      ),
    },
  ];

  const agentColumns: DataTableColumn<ReviewRecord>[] = [
    { key: "code", header: "ID", className: "w-24", render: (row) => row.agent_code || row.code || row.id },
    {
      key: "name",
      header: "Agent",
      render: (row) => (
        <div>
          <p className="font-bold text-dash-text">{row.agent_name || row.name || "-"}</p>
          <p className="mt-0.5 text-xs text-dash-muted">{row.agent_type || row.type || "Type not provided"}</p>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (row) => (
        <div className="text-sm">
          <p className="font-semibold text-dash-text">{row.country_name || "Country missing"}</p>
          <p className="text-xs text-dash-muted">{row.city_name || "City missing"}</p>
        </div>
      ),
    },
    {
      key: "registration",
      header: "Registration",
      render: (row) => {
        const progress = agentProgress(row);
        return (
          <div className="flex flex-wrap gap-1.5">
            <MiniCheck ok={progress.hasLocation} label="Profile" />
            <MiniCheck ok={progress.hasBusiness} label="Business" />
            <MiniCheck ok={progress.docs > 0} label={`${progress.docs} docs`} />
            <MiniCheck ok={progress.hasInvoicing} label="Invoicing" />
          </div>
        );
      },
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "approval_status", header: "Approval", render: (row) => <StatusBadge value={row.approval_status} /> },
    {
      key: "activity",
      header: "Bookings",
      render: (row) => row.total_bookings ?? 0,
    },
  ];

  const columns = module === "suppliers" ? supplierColumns : module === "agents" ? agentColumns : defaultColumns;

  return (
    <ModuleWrapper title={title} requiredPermission={requiredPermission}>
      <div className="space-y-5">
        <section className="flex flex-col gap-4 rounded-xl border border-dash-border bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dash-text">{title}</h2>
            <p className="mt-1 text-sm text-dash-muted">{module === "suppliers" ? "Review supplier registration, business data, documents, vehicles, approval status, and markup setup." : module === "agents" ? "Review agent registration, business data, documents, invoicing, approval status, and discount setup." : "Review operational accounts, approval status, and commercial controls."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void fetchRows()} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-text hover:bg-dash-bg">
              <RefreshCw size={16} /> Refresh
            </button>
            {canCreate && (
              <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover">
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </section>
        {module === "suppliers" && (
          <nav className="flex flex-wrap gap-2 rounded-xl border border-dash-border bg-white p-2" aria-label="Supplier status filters">
            {(["all", "pending", "approved", "inactive"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => {
                  setSupplierView(view);
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${supplierView === view ? "bg-dash-brand text-white" : "text-dash-muted hover:bg-dash-bg"}`}
              >
                {view}
              </button>
            ))}
          </nav>
        )}
        <DataTable
          ariaLabel={title}
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          pageSize={10}
          total={total}
          totalPages={totalPages}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onPageChange={setPage}
          actions={(row) => (
            <Link href={`/admin/${module}/${row.id}`} className="inline-flex items-center gap-2 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-brand-hover hover:bg-[#E7F5FF]">
              <Eye size={14} /> View
            </Link>
          )}
        />
      </div>
      <ActionModal
        open={open}
        title={`Add ${title.slice(0, -1)}`}
        saving={saving}
        submitLabel="Create"
        onClose={() => setOpen(false)}
        onSubmit={create}
        fields={[
          { name: fields.name, label: "Name" },
          { name: fields.type, label: "Type" },
          ...(module === "affiliates" ? [{ name: "email", label: "Email" }, { name: "phone", label: "Phone" }] : []),
        ]}
      />
    </ModuleWrapper>
  );
}


"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, Plus, RefreshCw } from "lucide-react";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import StatusBadge from "@/components/operations/StatusBadge";
import ActionModal from "@/components/operations/ActionModal";
import { createReviewRecord, listReviewRecords, ReviewModule, ReviewRecord } from "@/lib/services/operationsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type Props = {
  module: ReviewModule;
  title: string;
  requiredPermission: string;
};

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

  const canCreate = hasPermission(`${module}.create`) || (module === "affiliates" && hasPermission("affiliates.approve"));
  const fields = moduleNameFields[module];

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listReviewRecords(module, { page, limit: 10, search });
      setRows(response.items || response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch {
      toast.error(`Could not load ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [module, page, search, title, toast]);

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

  const columns: DataTableColumn<ReviewRecord>[] = [
    { key: "code", header: "ID", render: (row) => row.code || row.supplier_code || row.agent_code || row.affiliate_code || row.id },
    { key: "name", header: "Name", render: (row) => row.name || row.supplier_name || row.agent_name },
    { key: "type", header: "Type", render: (row) => row.type || row.business_type || "-" },
    { key: "country", header: "Country", render: (row) => row.country_name || "-" },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "approval_status", header: "Approval", render: (row) => <StatusBadge value={row.approval_status} /> },
    { key: "activity", header: module === "suppliers" ? "Tours" : "Bookings", render: (row) => module === "suppliers" ? row.number_of_tours ?? 0 : row.total_bookings ?? 0 },
  ];

  return (
    <ModuleWrapper title={title} requiredPermission={requiredPermission}>
      <div className="space-y-5">
        <section className="flex flex-col gap-4 rounded-xl border border-[#E7EAF0] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#121826]">{title}</h2>
            <p className="mt-1 text-sm text-[#667085]">Review operational accounts, approval status, and commercial controls.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void fetchRows()} className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#121826] hover:bg-[#F7F9FC]">
              <RefreshCw size={16} /> Refresh
            </button>
            {canCreate && (
              <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9]">
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </section>
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
            <Link href={`/admin/${module}/${row.id}`} className="inline-flex items-center gap-2 rounded-lg border border-[#E7EAF0] px-3 py-2 text-xs font-bold text-[#2F9FE9] hover:bg-[#E7F5FF]">
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


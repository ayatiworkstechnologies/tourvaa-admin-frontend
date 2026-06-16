"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit, Plus } from "lucide-react";

import ActionModal from "@/components/operations/ActionModal";
import StatusBadge from "@/components/operations/StatusBadge";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { CmsRecord, createCms, listCms, updateCms, updateCmsStatus } from "@/lib/services/cmsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

export type CmsField = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: { label: string; value: string }[];
};

type Props = {
  title: string;
  endpoint: string;
  requiredPermission: string;
  createPermission: string;
  editPermission: string;
  fields: CmsField[];
  columns: DataTableColumn<CmsRecord>[];
};

export default function CmsCrudPage({ title, endpoint, requiredPermission, createPermission, editPermission, fields, columns }: Props) {
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [rows, setRows] = useState<CmsRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CmsRecord | null>(null);
  const [open, setOpen] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listCms(endpoint, { page, limit: 10, search });
      setRows(response.items || response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch {
      toast.error(`Could not load ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, search, title, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchRows(), 200);
    return () => window.clearTimeout(timer);
  }, [fetchRows]);

  const submit = async (payload: Record<string, string | number>) => {
    setSaving(true);
    try {
      if (editing) {
        await updateCms(endpoint, editing.id, payload);
      } else {
        await createCms(endpoint, payload);
      }
      toast.success("Saved.");
      setOpen(false);
      setEditing(null);
      await fetchRows();
    } catch {
      toast.error("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModuleWrapper title={title} requiredPermission={requiredPermission}>
      <div className="space-y-5">
        <section className="flex flex-col gap-4 rounded-xl border border-[#E7EAF0] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#121826]">{title}</h2>
            <p className="mt-1 text-sm text-[#667085]">Create, edit, and disable foundational CMS data.</p>
          </div>
          {hasPermission(createPermission) && (
            <button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9]">
              <Plus size={16} /> Add
            </button>
          )}
        </section>
        <DataTable
          ariaLabel={title}
          columns={[...columns, { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status || "")} /> }]}
          rows={rows}
          loading={loading}
          page={page}
          pageSize={10}
          total={total}
          totalPages={totalPages}
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          onPageChange={setPage}
          actions={(row) => (
            <div className="flex justify-end gap-2">
              {hasPermission(editPermission) && <button type="button" onClick={() => { setEditing(row); setOpen(true); }} className="inline-flex items-center gap-1 rounded-lg border border-[#E7EAF0] px-3 py-2 text-xs font-bold text-[#238DD7] hover:bg-[#E7F5FF]"><Edit size={14} /> Edit</button>}
              {hasPermission(editPermission) && <button type="button" onClick={() => void updateCmsStatus(endpoint, row.id, row.status === "active" || row.status === "published" ? "inactive" : "active").then(fetchRows)} className="rounded-lg border border-[#E7EAF0] px-3 py-2 text-xs font-bold text-[#667085] hover:bg-[#F7F9FC]">Toggle</button>}
            </div>
          )}
        />
      </div>
      <ActionModal open={open} title={editing ? `Edit ${title}` : `Add ${title}`} fields={fields} saving={saving} onClose={() => { setOpen(false); setEditing(null); }} onSubmit={submit} />
    </ModuleWrapper>
  );
}

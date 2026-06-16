"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Edit, Plus } from "lucide-react";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import StatusBadge from "@/components/operations/StatusBadge";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { CmsRecord, listCms, updateCmsStatus } from "@/lib/services/cmsService";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

export default function ToursPage() {
  const toast = useToast();
  const { hasPermission } = useAuthContext();
  const [rows, setRows] = useState<CmsRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listCms("/tours", { page, limit: 10, search });
      setRows(response.items || response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch {
      toast.error("Could not load tours.");
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchRows(), 200);
    return () => window.clearTimeout(timer);
  }, [fetchRows]);

  const columns: DataTableColumn<CmsRecord>[] = [
    { key: "tour_code", header: "Tour ID" },
    { key: "title", header: "Title" },
    { key: "country_name", header: "Country" },
    { key: "city_name", header: "City" },
    { key: "category_name", header: "Category" },
    { key: "supplier_name", header: "Supplier" },
    { key: "price_start_per_person", header: "Price from", render: (row) => `${row.currency || ""} ${Number(row.price_start_per_person || 0).toLocaleString()}` },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={String(row.status || "")} /> },
  ];

  return (
    <ModuleWrapper title="Tours" requiredPermission="tours.view">
      <div className="space-y-5">
        <section className="flex flex-col gap-4 rounded-xl border border-[#E7EAF0] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#121826]">Basic Tour CMS</h2>
            <p className="mt-1 text-sm text-[#667085]">Create draft tours, assign locations/categories/suppliers, and manage publishing status.</p>
          </div>
          {hasPermission("tours.create") && <Link href="/tours/create" className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9]"><Plus size={16} /> Add Tour</Link>}
        </section>
        <DataTable
          ariaLabel="Tours"
          columns={columns}
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
              {hasPermission("tours.edit") && <Link href={`/tours/${row.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-[#E7EAF0] px-3 py-2 text-xs font-bold text-[#238DD7] hover:bg-[#E7F5FF]"><Edit size={14} /> Edit</Link>}
              {hasPermission("tours.disable") && <button type="button" onClick={() => void updateCmsStatus("/tours", row.id, row.status === "published" ? "disabled" : "published").then(fetchRows)} className="rounded-lg border border-[#E7EAF0] px-3 py-2 text-xs font-bold text-[#667085] hover:bg-[#F7F9FC]">Toggle</button>}
            </div>
          )}
        />
      </div>
    </ModuleWrapper>
  );
}

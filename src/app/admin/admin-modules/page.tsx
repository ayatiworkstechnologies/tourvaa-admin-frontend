"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

type AdminModule = {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  is_system: boolean;
};

export default function AdminModulesPage() {
  const toast = useToast();
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(modules.length / pageSize));
  const paginatedModules = modules.slice((page - 1) * pageSize, page * pageSize);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/modules/all");
      setModules(res.data?.data ?? []);
    } catch {
      setModules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function toggle(module: AdminModule) {
    setTogglingId(module.id);
    try {
      await api.patch(`/modules/${module.id}`, { is_active: !module.is_active });
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setTogglingId(null);
    }
  }

  const columns: DataTableColumn<AdminModule>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * pageSize + index + 1,
    },
    { key: "name", header: "Module", className: "font-bold text-dash-text" },
    { key: "slug", header: "Slug", className: "font-mono text-xs text-dash-subtle" },
    { key: "description", header: "Description", className: "text-dash-muted" },
    {
      key: "status",
      header: "Status",
      render: (module) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${module.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {module.is_active ? "Enabled" : "Disabled"}
        </span>
      ),
    },
  ];

  return (
    <ModuleWrapper title="Admin Modules" requiredPermission="view-permissions">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Admin Modules</h1>
          <p className="text-sm text-dash-muted">Enable or disable platform modules. Module definitions are code-managed; only availability can be toggled here.</p>
        </div>

        <div className="rounded-xl border border-dash-border bg-white shadow-sm">
          <DataTable
            ariaLabel="Admin modules table"
            columns={columns}
            rows={paginatedModules}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={modules.length}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No modules found"
            actions={(module) => (
              <button
                type="button"
                disabled={togglingId === module.id}
                onClick={() => void toggle(module)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                  module.is_active
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {togglingId === module.id ? "Saving..." : module.is_active ? "Disable" : "Enable"}
              </button>
            )}
          />
        </div>
      </div>
    </ModuleWrapper>
  );
}

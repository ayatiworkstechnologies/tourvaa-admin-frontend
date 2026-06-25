"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit, Globe, MapPin, Plus } from "lucide-react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import StatusBadge from "@/components/operations/StatusBadge";
import ActionModal from "@/components/operations/ActionModal";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { useGeoCountries, useGeoStates } from "@/hooks/useGeo";
import api from "@/lib/api";

type Row = Record<string, unknown>;

// ── Generic CRUD tab ─────────────────────────────────────────────────────────

type Field = {
  name: string;
  label: string;
  type?: "text" | "select";
  options?: { label: string; value: string | number }[];
};

type TabProps = {
  title: string;
  endpoint: string;
  fields: Field[];
  columns: DataTableColumn<Row>[];
  extraParams?: Record<string, string>;
  canCreate: boolean;
  canEdit: boolean;
};

function CrudTab({ title, endpoint, fields, columns, extraParams = {}, canCreate, canEdit }: TabProps) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint, { params: { page, limit: 20, search, ...extraParams } });
      setRows(res.data?.items ?? res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
      setTotalPages(res.data?.total_pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, search, JSON.stringify(extraParams)]);

  useEffect(() => { void load(); }, [load]);

  function openAdd() {
    const blank: Record<string, string | number> = {};
    fields.forEach((f) => { blank[f.name] = f.type === "select" ? (f.options?.[0]?.value ?? "") : ""; });
    setForm(blank);
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row: Row) {
    const vals: Record<string, string | number> = {};
    fields.forEach((f) => { vals[f.name] = (row[f.name] as string | number) ?? ""; });
    setForm(vals);
    setEditing(row);
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`${endpoint}/${editing.id}`, form);
        toast.success(`${title.slice(0, -1)} updated`);
      } else {
        await api.post(endpoint, form);
        toast.success(`${title.slice(0, -1)} added`);
      }
      setOpen(false);
      await load();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: Row) {
    const next = row.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`${endpoint}/${row.id}/status`, { status: next });
      toast.success("Status updated");
      await load();
    } catch {
      toast.error("Status update failed");
    }
  }

  const allColumns: DataTableColumn<Row>[] = [
    ...columns,
    {
      key: "status" as keyof Row,
      header: "Status",
      render: (r) => (
        <button type="button" title={`Toggle status (currently ${r.status})`} onClick={() => toggleStatus(r)} className="cursor-pointer">
          <StatusBadge value={r.status as string} />
        </button>
      ),
    },
    ...(canEdit ? [{
      key: "_actions" as keyof Row,
      header: "",
      render: (r: Row) => (
        <button type="button" title="Edit" onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-[#43A9F6] hover:bg-[#F3F8FC]">
          <Edit size={15} />
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={`Search ${title.toLowerCase()}…`}
          className="w-72 rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm outline-none focus:border-[#43A9F6]"
        />
        {canCreate && (
          <button type="button" onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2 text-sm font-bold text-white hover:bg-[#238DD7]">
            <Plus size={15} /> Add {title.slice(0, -1)}
          </button>
        )}
      </div>

      <DataTable
        ariaLabel={title}
        columns={allColumns}
        rows={rows}
        loading={loading}
        emptyTitle={`No ${title.toLowerCase()} found.`}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      <ActionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleSave}
        title={editing ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}
        confirmLabel={saving ? "Saving…" : "Save"}
        isLoading={saving}
      >
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#344054]">{f.label}</label>
              {f.type === "select" ? (
                <select
                  title={f.label}
                  value={String(form[f.name] ?? "")}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                  className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  title={f.label}
                  placeholder={f.label}
                  value={String(form[f.name] ?? "")}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                  className="rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                />
              )}
            </div>
          ))}
        </div>
      </ActionModal>
    </div>
  );
}

// ── Countries tab ─────────────────────────────────────────────────────────────

function CountriesTab({ canCreate, canEdit }: { canCreate: boolean; canEdit: boolean }) {
  return (
    <CrudTab
      title="Countries"
      endpoint="/countries"
      canCreate={canCreate}
      canEdit={canEdit}
      fields={[
        { name: "country_name", label: "Country name" },
        { name: "country_code", label: "ISO2 code" },
        { name: "phone_code", label: "Phone code" },
        { name: "currency_code", label: "Currency code" },
      ]}
      columns={[
        { key: "country_name", header: "Country" },
        { key: "country_code", header: "ISO2" },
        { key: "phone_code", header: "Phone" },
        { key: "currency_code", header: "Currency" },
      ]}
    />
  );
}

// ── States tab ────────────────────────────────────────────────────────────────

function StatesTab({ canCreate, canEdit }: { canCreate: boolean; canEdit: boolean }) {
  const { countries } = useGeoCountries();
  const [countryFilter, setCountryFilter] = useState("");

  const countryOptions = countries.map((c) => ({ label: c.name, value: c.id }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          title="Filter by country"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm outline-none focus:border-[#43A9F6]"
        >
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <CrudTab
        title="States"
        endpoint="/states"
        canCreate={canCreate}
        canEdit={canEdit}
        extraParams={countryFilter ? { country_id: countryFilter } : {}}
        fields={[
          { name: "country_id", label: "Country", type: "select", options: countryOptions },
          { name: "state_name", label: "State / Province name" },
          { name: "state_code", label: "State code" },
        ]}
        columns={[
          { key: "country_name", header: "Country" },
          { key: "state_name", header: "State / Province" },
          { key: "state_code", header: "Code" },
        ]}
      />
    </div>
  );
}

// ── Cities tab ────────────────────────────────────────────────────────────────

function CitiesTab({ canCreate, canEdit }: { canCreate: boolean; canEdit: boolean }) {
  const { countries } = useGeoCountries();
  const [countryFilter, setCountryFilter] = useState<number | null>(null);
  const [stateFilter, setStateFilter] = useState<number | null>(null);
  const { states } = useGeoStates(countryFilter);

  const countryOptions = countries.map((c) => ({ label: c.name, value: c.id }));
  const stateOptions = states.map((s) => ({ label: s.name, value: s.id }));

  const extraParams: Record<string, string> = {};
  if (countryFilter) extraParams.country_id = String(countryFilter);
  if (stateFilter) extraParams.state_id = String(stateFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          title="Filter by country"
          value={countryFilter ?? ""}
          onChange={(e) => { setCountryFilter(e.target.value ? Number(e.target.value) : null); setStateFilter(null); }}
          className="rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm outline-none focus:border-[#43A9F6]"
        >
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {countryFilter && (
          <select
            title="Filter by state"
            value={stateFilter ?? ""}
            onChange={(e) => setStateFilter(e.target.value ? Number(e.target.value) : null)}
            className="rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm outline-none focus:border-[#43A9F6]"
          >
            <option value="">All States</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>
      <CrudTab
        title="Cities"
        endpoint="/cities"
        canCreate={canCreate}
        canEdit={canEdit}
        extraParams={extraParams}
        fields={[
          { name: "country_id", label: "Country", type: "select", options: countryOptions },
          { name: "state_id", label: "State / Province", type: "select", options: [{ label: "— None —", value: "" }, ...stateOptions] },
          { name: "city_name", label: "City name" },
        ]}
        columns={[
          { key: "country_name", header: "Country" },
          { key: "state_name", header: "State" },
          { key: "city_name", header: "City" },
        ]}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "countries" | "states" | "cities";

const TABS: { key: Tab; label: string; icon: typeof Globe }[] = [
  { key: "countries", label: "Countries", icon: Globe },
  { key: "states", label: "States", icon: MapPin },
  { key: "cities", label: "Cities", icon: MapPin },
];

export default function CountriesPage() {
  const { hasPermission } = useAuthContext();
  const [activeTab, setActiveTab] = useState<Tab>("countries");

  const canCreate = hasPermission("countries.create");
  const canEdit = hasPermission("countries.edit");

  return (
    <ModuleWrapper title="Countries, States & Cities" requiredPermission="countries.view">
      <div className="space-y-6">
        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl border border-[#E7EAF0] bg-[#F5F7FA] p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition ${
                activeTab === key
                  ? "bg-white text-[#121826] shadow-sm"
                  : "text-[#667085] hover:text-[#344054]"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "countries" && <CountriesTab canCreate={canCreate} canEdit={canEdit} />}
        {activeTab === "states" && <StatesTab canCreate={canCreate} canEdit={canEdit} />}
        {activeTab === "cities" && <CitiesTab canCreate={canCreate} canEdit={canEdit} />}
      </div>
    </ModuleWrapper>
  );
}

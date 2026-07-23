"use client";

import { useCallback, useEffect, useState } from "react";
import { LuSquarePen as Edit, LuPlus as Plus, LuTrash2 as Trash2, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select";
  valueType?: "string" | "number" | "boolean";
  options?: {
    label: string;
    value: string | number | boolean;
  }[];
};

type DynamicModulePageProps = {
  title: string;
  description: string;
  endpoint: string;
  fields: Field[];
};

type DynamicItem = {
  id: number;
  [key: string]: string | number | boolean | null | undefined;
};

type FormValue = string | number | boolean;

function formValueToString(value: FormValue | undefined) {
  if (value === undefined) return "";
  return String(value);
}

export function normalizeDynamicForm(fields: Field[], form: Record<string, FormValue>) {
  return fields.reduce<Record<string, string | number | boolean>>((payload, field) => {
    const rawValue = form[field.name];

    if (rawValue === undefined || rawValue === "") return payload;

    if (field.valueType === "boolean") {
      payload[field.name] = rawValue === true || rawValue === "true";
      return payload;
    }

    if (field.valueType === "number") {
      const numberValue = Number(rawValue);
      if (!Number.isNaN(numberValue)) payload[field.name] = numberValue;
      return payload;
    }

    payload[field.name] = typeof rawValue === "string" ? rawValue.trim() : rawValue;
    return payload;
  }, {});
}

export default function DynamicModulePage({
  title,
  description,
  endpoint,
  fields,
}: DynamicModulePageProps) {
  const [items, setItems] = useState<DynamicItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DynamicItem | null>(null);
  const [form, setForm] = useState<Record<string, FormValue>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get(endpoint, { params: { limit: 1000 } });
      setItems(response.data.data || []);
      setPage(1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
     
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({});
    setOpen(true);
  };

  const openEdit = (item: DynamicItem) => {
    setEditingItem(item);
    setForm(
      Object.fromEntries(
        Object.entries(item).filter(
          ([, value]) =>
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        )
      ) as Record<string, FormValue>
    );
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
    setForm({});
  };

  const updateForm = (key: string, value: FormValue) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingItem) {
        await api.put(`${endpoint}${editingItem.id}`, normalizeDynamicForm(fields, form));
      } else {
        await api.post(endpoint, normalizeDynamicForm(fields, form));
      }

      await fetchItems();
      closeModal();
    } catch {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    const ok = confirm("Are you sure you want to delete this record?");
    if (!ok) return;

    try {
      await api.delete(`${endpoint}${id}`);
      await fetchItems();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="rounded-2xl border border-dash-border bg-white p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-dash-text">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-dash-muted">{description}</p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-dash-brand-hover"
        >
          <Plus size={16} />
          Add New
        </button>
      </div>

      <div className="p-0">
        <DataTable
          ariaLabel={title}
          columns={[
            {
              key: "no",
              header: "No",
              className: "w-20 font-bold text-dash-muted",
              render: (_, index) => (page - 1) * pageSize + index + 1,
            },
            ...fields.slice(0, 4).map((field) => ({
              key: field.name,
              header: field.label,
              className: "text-dash-body",
              render: (item: DynamicItem) => {
                if (field.name === "is_active") {
                  return (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item[field.name]
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {item[field.name] ? "Active" : "Inactive"}
                    </span>
                  );
                }
                return String(item[field.name] ?? "-");
              },
            })),
          ]}
          rows={paginatedItems}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={items.length}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No records found."
          actions={(item) => (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => openEdit(item)}
                aria-label={`Edit ${title} record`}
                title={`Edit ${title} record`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border text-dash-muted hover:bg-[#E7F5FF] hover:text-dash-brand-hover"
              >
                <Edit size={15} />
              </button>

              <button
                onClick={() => deleteItem(item.id)}
                aria-label={`Delete ${title} record`}
                title={`Delete ${title} record`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border text-dash-muted hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-dash-text">
                {editingItem ? `Edit ${title}` : `Add ${title}`}
              </h3>

              <button
                onClick={closeModal}
                aria-label="Close dialog"
                title="Close dialog"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-dash-muted hover:bg-dash-bg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              {fields.map((field) => (
                <label key={field.name} className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">
                    {field.label}
                  </span>

                  {field.type === "textarea" ? (
                    <textarea
                      value={formValueToString(form[field.name])}
                      onChange={(e) => updateForm(field.name, e.target.value)}
                    className="min-h-24 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={formValueToString(form[field.name])}
                      onChange={(e) => updateForm(field.name, e.target.value)}
                      className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand"
                    >
                      <option value="">Select</option>
                      {field.options?.map((option) => (
                        <option key={String(option.value)} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={formValueToString(form[field.name])}
                      onChange={(e) => updateForm(field.name, e.target.value)}
                      className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand"
                    />
                  )}
                </label>
              ))}

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-muted hover:bg-dash-bg sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  className="w-full rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover sm:w-auto"
                >
                  {saving ? "Saving..." : editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

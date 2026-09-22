"use client";

import { ErrorSummary, FormField, fieldClass, focusField } from "@/components/tours/FormKit";
import { validateExtension, type FieldErrors } from "@/lib/tours/tourValidation";
import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { TourExtension, getExtensions, createExtension, updateExtension, deleteExtension } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import Loader from "@/components/ui/Loader";
import TourPicker from "@/components/tours/TourPicker";
import { ADDON_CATEGORIES, addonCategoryLabel } from "@/lib/constants/addonCategories";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const empty = (): TourExtension => ({
  extension_tour_id: 0, extension_title: "", extension_note: "",
  extra_price: 0, price_type: "per_booking", category: "other", display_order: 0, status: "active",
  commissionable: true,
});

const PRICE_TYPE_LABELS: Record<TourExtension["price_type"], string> = {
  per_booking: "per booking",
  per_person: "per person",
  per_room: "per room",
  per_person_per_night: "per person / night",
  per_room_per_night: "per room / night",
};

const inputClass =
  "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10";

export default function TourExtensionsTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<TourExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourExtension | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const clearError = (field: string) => setErrors((prev) => { if (!prev[field]) return prev; const next = { ...prev }; delete next[field]; return next; });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getExtensions(tourId));
    } catch {
      toast.error("Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const found = validateExtension(editing);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusField(Object.keys(found)[0]);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editing, extra_price: sanitizeNumber(editing.extra_price), display_order: sanitizeNumber(editing.display_order) };
      if (editing.id) {
        const updated = await updateExtension(tourId, editing.id, payload);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createExtension(tourId, payload);
        setItems((prev) => [...prev, created]);
      }
      setEditing(null);
      setErrors({});
      toast.success("Saved.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!(await confirm({ title: "Delete extension", message: "Delete this extension?", confirmLabel: "Delete", danger: true }))) return;
    try {
      await deleteExtension(tourId, id);
      setItems((previousItems) => previousItems.filter((item) => item.id !== id));
    }
    catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading) return <Loader label="Loading extensions..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Tour Extensions</h2>
          <p className="text-xs text-dash-subtle">Bolt-on trips guests can add to this tour for an extra price.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...empty(), display_order: items.length })}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} /> Add Extension
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-2xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No extensions yet.</div>
      )}

      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2"><p className="font-semibold text-dash-text">{item.extension_title || item.extension_tour_title || `Tour #${item.extension_tour_id}`}</p><span className="rounded-full bg-[var(--portal-soft)] px-2 py-0.5 text-[10px] font-bold text-dash-brand">{addonCategoryLabel(item.category)}</span></div>
              {item.extension_note && <p className="text-sm text-dash-subtle">{item.extension_note}</p>}
              <p className="mt-1 text-sm font-semibold text-dash-brand">Extra: {item.extra_price} <span className="font-normal text-dash-subtle">({PRICE_TYPE_LABELS[item.price_type] ?? item.price_type})</span></p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-dash-border p-2 hover:bg-[#F2F4F7]"><Pencil size={14} /></button>
              <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] p-2 text-red-500 hover:bg-[#FFF0F0]"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}

      {editing && (
        <form onSubmit={save} noValidate className="rounded-2xl border-2 border-dash-brand bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <ErrorSummary errors={errors} />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Edit Extension" : "New Extension"}</h3>
            <button type="button" aria-label="Close" onClick={() => { setEditing(null); setErrors({}); }}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField name="extension_tour_id" label="Extension tour" required error={errors.extension_tour_id} hint="The tour travellers can add on to this one, e.g. a post-trip beach stay." className="md:col-span-2">
              <TourPicker
                value={editing.extension_tour_id || null}
                onChange={(id, title) => {
                  setEditing((p) => (p ? { ...p, extension_tour_id: id ?? 0, extension_title: p.extension_title || title } : p));
                  clearError("extension_tour_id");
                }}
                excludeIds={[Number(tourId)]}
              />
            </FormField>
            <FormField name="extension_title" label="Custom title" error={errors.extension_title} hint="Optional - the tour's own name is used if you leave this blank." counter={{ value: (editing.extension_title ?? "").length, max: 255 }}>
              <input id="extension_title" name="extension_title" value={editing.extension_title ?? ""}
                onChange={(e) => { setEditing((p) => (p ? { ...p, extension_title: e.target.value } : p)); clearError("extension_title"); }}
                className={fieldClass(errors.extension_title)} />
            </FormField>
            <FormField name="extra_price" label="Extra price" error={errors.extra_price} hint="Added to the booking when a traveller picks this extension. 0 if free.">
              <input id="extra_price" name="extra_price" type="number" min={0} step="0.01" value={numberInputValue(editing.extra_price)}
                onChange={(e) => { setEditing((p) => (p ? { ...p, extra_price: parseNumberInput(e.target.value) } : p)); clearError("extra_price"); }}
                className={fieldClass(errors.extra_price)} />
            </FormField>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Price type</span>
              <select
                value={editing.price_type}
                onChange={(e) => setEditing((p) => (p ? { ...p, price_type: e.target.value as TourExtension["price_type"] } : p))}
                className={inputClass}
              >
                <option value="per_booking">Per booking</option>
                <option value="per_person">Per person</option>
                <option value="per_room">Per room</option>
                <option value="per_person_per_night">Per person / night</option>
                <option value="per_room_per_night">Per room / night</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Order</span>
              <input
                type="number"
                value={numberInputValue(editing.display_order)}
                onChange={(e) => setEditing((p) => (p ? { ...p, display_order: parseNumberInput(e.target.value) } : p))}
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Category</span>
              <select value={editing.category} onChange={(e) => setEditing((p) => (p ? { ...p, category: e.target.value } : p))} className={inputClass}>
                {ADDON_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => (p ? { ...p, status: e.target.value } : p))} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={editing.commissionable ?? true}
                onChange={(e) => setEditing((p) => (p ? { ...p, commissionable: e.target.checked } : p))}
              />
              <span className="text-sm font-semibold text-dash-body">Commissionable</span>
            </label>
            <p className="-mt-3 text-xs text-dash-subtle md:col-span-2">
              When off, the supplier is paid this item&apos;s full price with no Tourvaa commission deducted. Default: on.
            </p>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Extension note</span>
              <textarea
                value={editing.extension_note}
                rows={2}
                onChange={(e) => setEditing((p) => (p ? { ...p, extension_note: e.target.value } : p))}
                className={inputClass}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
      {dialog}
    </div>
  );
}

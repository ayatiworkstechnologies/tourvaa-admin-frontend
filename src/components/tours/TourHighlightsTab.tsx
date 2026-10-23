"use client";

import { ErrorSummary, FormField, fieldClass, focusField } from "@/components/tours/FormKit";
import { validateHighlight, type FieldErrors } from "@/lib/tours/tourValidation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuPlus as Plus, LuSave as Save, LuX as X } from "react-icons/lu";
import { TourHighlight, getHighlights, createHighlight, updateHighlight, deleteHighlight } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const empty = (): TourHighlight => ({ image: "", title: "", short_description: "", display_order: 0, status: "active" });

export default function TourHighlightsTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<TourHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourHighlight | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const editorRef = useRef<HTMLFormElement>(null);

  const openEditor = (item: TourHighlight) => {
    setErrors({});
    setEditing(item);
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      editorRef.current?.querySelector<HTMLInputElement>("#title")?.focus();
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const highlights = await getHighlights(tourId);
      setItems(highlights ?? []);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) {
        toast.error("Failed to load highlights.");
      } else {
        setItems([]);
      }
    }
    finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const found = validateHighlight(editing);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusField(Object.keys(found)[0]);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editing, display_order: sanitizeNumber(editing.display_order) };
      if (editing.id) {
        const updated = await updateHighlight(tourId, editing.id, payload);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createHighlight(tourId, payload);
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
    if (!(await confirm({ title: "Delete highlight", message: "Delete this highlight?", confirmLabel: "Delete", danger: true }))) return;
    try {
      await deleteHighlight(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading) return <Loader label="Loading highlights..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-dash-text">Tour Highlights</h2>
        <button
          type="button"
          onClick={() => openEditor({ ...empty(), display_order: items.length })}
          className="inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-dash-brand-hover transition"
        >
          <Plus size={16} /> Add Highlight
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No highlights yet.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-dash-border bg-white overflow-hidden shadow-2xs hover:shadow-sm transition">
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.title} className="h-36 w-full object-cover" />
            )}
            <div className="p-4">
              <p className="font-semibold text-dash-text">{item.title}</p>
              <p className="mt-1 text-sm text-dash-subtle">{item.short_description}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => openEditor({ ...item })} className="min-h-11 rounded-lg border border-dash-border px-3 py-1.5 text-xs font-semibold text-dash-text hover:bg-slate-50 transition">Edit</button>
                <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form ref={editorRef} onSubmit={save} noValidate className="scroll-mt-6 rounded-2xl border-2 border-dash-brand bg-white p-5 shadow-sm sm:p-6">
          <ErrorSummary errors={errors} />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dash-text">{editing.id ? "Edit Highlight" : "New Highlight"}</h3>
            <button type="button" aria-label="Close" onClick={() => { setEditing(null); setErrors({}); }} className="text-dash-muted hover:text-dash-text transition"><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <AdminAssetUpload
                assetScope="tour"
                label="Image"
                value={editing.image}
                onChange={(value) => setEditing((p) => (p ? { ...p, image: value } : p))}
              />
            </div>
            <FormField name="title" label="Title" required error={errors.title} hint="A short headline travellers will see, e.g. Sunset dhow cruise." counter={{ value: (editing.title ?? "").length, max: 255 }}>
              <input id="title" name="title" type="text" value={editing.title ?? ""}
                onChange={(e) => { setEditing((p) => p ? { ...p, title: e.target.value } : p); setErrors((previous) => { const next = { ...previous }; delete next.title; return next; }); }}
                className={fieldClass(errors.title)} />
            </FormField>
            <FormField name="display_order" label="Order" error={errors.display_order} hint="Lower numbers show first. Leave 0 to keep the order you added them.">
              <input id="display_order" name="display_order" type="number" min={0} value={numberInputValue(editing.display_order as number)}
                onChange={(e) => { setEditing((p) => p ? { ...p, display_order: parseNumberInput(e.target.value) } : p); setErrors((previous) => { const next = { ...previous }; delete next.display_order; return next; }); }}
                className={fieldClass(errors.display_order)} />
            </FormField>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Short description</span>
              <textarea value={editing.short_description ?? ""} rows={3}
                onChange={(e) => setEditing((p) => p ? { ...p, short_description: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover transition disabled:opacity-60 shadow-xs">
              <Save size={14} /> {saving ? "Saving..." : "Save Highlight"}
            </button>
          </div>
        </form>
      )}
      {dialog}
    </div>
  );
}

"use client";

import { ErrorSummary, FormField, fieldClass, focusField } from "@/components/tours/FormKit";
import { validateInclusion, type FieldErrors } from "@/lib/tours/tourValidation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuPlus as Plus,
  LuPencil as Pencil,
  LuTrash2 as Trash2,
  LuSave as Save,
  LuX as X,
  LuSparkles as Sparkles,
  LuCheck as Check,
  LuLightbulb as Lightbulb,
} from "react-icons/lu";
import {
  TourItem,
  getInclusions, createInclusion, updateInclusion, deleteInclusion,
  getExclusions, createExclusion, updateExclusion, deleteExclusion,
} from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import Loader from "@/components/ui/Loader";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const APIs = {
  inclusions: { list: getInclusions, create: createInclusion, update: updateInclusion, delete: deleteInclusion },
  exclusions: { list: getExclusions, create: createExclusion, update: updateExclusion, delete: deleteExclusion },
};

const POPULAR_SUGGESTIONS: Record<"inclusions" | "exclusions", { title: string; description: string }[]> = {
  inclusions: [
    { title: "Air-conditioned vehicle & driver", description: "Private air-conditioned transportation for all transfers and itinerary sightseeing." },
    { title: "Licensed English-speaking guide", description: "Certified local tour guide for scheduled monument visits and city tours." },
    { title: "Hotel pick-up & drop-off", description: "Direct pick-up and return from your hotel lobby." },
    { title: "Daily breakfast at hotel", description: "Fresh morning breakfast included at designated tour accommodations." },
    { title: "Monument & attraction entry tickets", description: "All entry passes and permits included as per the itinerary." },
    { title: "Bottled drinking water", description: "Complimentary drinking water provided in the vehicle during travel." },
    { title: "Airport arrival & departure transfers", description: "Airport meet-and-greet transfers on Day 1 and final day." },
    { title: "All road tolls, fuel & parking fees", description: "All transport taxes, highway tolls, and parking charges covered." },
  ],
  exclusions: [
    { title: "International & domestic flights", description: "Airfare to and from the tour starting destination." },
    { title: "Travel & medical insurance", description: "Personal travel and emergency insurance is strongly recommended." },
    { title: "Entry visa fees", description: "Travellers are responsible for obtaining applicable country entry visas." },
    { title: "Personal expenses & souvenirs", description: "Laundry, phone calls, drinks, and personal shopping." },
    { title: "Lunch & dinner (unless specified)", description: "Meals not explicitly listed in the daily itinerary." },
    { title: "Driver & guide gratuities / tipping", description: "Tips are voluntary but warmly appreciated for good service." },
    { title: "Camera & video fees at monuments", description: "Special photography charges at select heritage sites." },
  ],
};

const empty = (): TourItem => ({ icon: "", title: "", description: "", display_order: 0, status: "active" });

function isIconUrl(icon: string) {
  return /^https?:\/\//i.test(icon);
}

export default function TourItemsTab({ tourId, segment, label }: { tourId: string; segment: "inclusions" | "exclusions"; label: string }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const api = APIs[segment];
  const [items, setItems] = useState<TourItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const editorRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const segmentItems = await api.list(tourId);
      setItems(segmentItems);
    } catch {
      toast.error(`Failed to load ${segment}.`);
    }
    finally {
      setLoading(false);
    }
  }, [tourId, api, segment, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (item: TourItem) => {
    setErrors({});
    setEditing(item);
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      editorRef.current?.querySelector<HTMLInputElement>("#title")?.focus();
    });
  };

  const addQuickSuggestion = async (suggestion: { title: string; description: string }) => {
    const isExisting = items.some((i) => i.title.trim().toLowerCase() === suggestion.title.trim().toLowerCase());
    if (isExisting) {
      toast.info(`"${suggestion.title}" is already added.`);
      return;
    }
    setSaving(true);
    try {
      const payload: TourItem = {
        icon: "",
        title: suggestion.title,
        description: suggestion.description,
        display_order: items.length,
        status: "active",
      };
      const created = await api.create(tourId, payload);
      setItems((prev) => [...prev, created]);
      toast.success(`Added "${suggestion.title}"`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const found = validateInclusion(editing, label);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusField(Object.keys(found)[0]);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editing, display_order: sanitizeNumber(editing.display_order) };
      if (editing.id) {
        const updated = await api.update(tourId, editing.id, payload);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await api.create(tourId, payload);
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
    if (!(await confirm({ title: `Delete ${label.toLowerCase()}`, message: `Delete this ${label.toLowerCase()}?`, confirmLabel: "Delete", danger: true }))) return;
    try {
      await api.delete(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading) return <Loader label={`Loading ${segment}...`} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">{label}</h2>
          <p className="mt-1 text-sm text-dash-muted">Add the details travellers should know before booking.</p>
        </div>
        <button
          type="button"
          onClick={() => openEditor({ ...empty(), display_order: items.length })}
          aria-expanded={Boolean(editing)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-dash-brand-hover active:translate-y-px"
        >
          <Plus size={16} /> Add {label}
        </button>
      </div>

      {/* ── 1-Click Popular Smart Suggestions ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 p-4 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
          <Sparkles size={13} className="text-blue-600" />
          <span>Quick Add Popular {label}</span>
          <span className="text-[11px] font-medium text-slate-400 capitalize">(Click to add in 1-click)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SUGGESTIONS[segment].map((sugg) => {
            const alreadyAdded = items.some((i) => i.title.trim().toLowerCase() === sugg.title.trim().toLowerCase());
            return (
              <button
                key={sugg.title}
                type="button"
                disabled={alreadyAdded || saving}
                onClick={() => void addQuickSuggestion(sugg)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  alreadyAdded
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 opacity-80 cursor-default"
                    : "border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                }`}
              >
                {alreadyAdded ? (
                  <Check size={12} strokeWidth={3} className="text-emerald-600" />
                ) : (
                  <Plus size={12} className="text-blue-600" />
                )}
                <span>{sugg.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-2xl border border-dashed border-dash-border bg-dash-bg/40 p-8 text-center">
          <Lightbulb size={24} className="mx-auto text-amber-500 mb-2" />
          <p className="font-semibold text-dash-body">No {segment} yet</p>
          <p className="mt-1 text-sm text-dash-muted">
            Click any quick suggestion above or use “Add {label}” to create your own.
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] hover:shadow-xs transition">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {item.icon &&
                  (isIconUrl(item.icon) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.icon} alt={item.title || "Item icon"} className="h-8 w-8 flex-none rounded-lg object-cover" />
                  ) : (
                    <span className="text-lg">{item.icon}</span>
                  ))}
                <div className="min-w-0">
                  <p className="font-semibold text-dash-text">{item.title}</p>
                  {item.description && <p className="mt-1 text-sm leading-6 text-dash-muted">{item.description}</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEditor({ ...item })}
                  aria-label={`Edit ${item.title}`}
                  title="Edit"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border text-dash-body transition hover:bg-dash-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dash-brand"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id!)}
                  aria-label={`Delete ${item.title}`}
                  title="Delete"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#FFCDD2] text-red-600 transition hover:bg-[#FFF0F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form ref={editorRef} onSubmit={save} noValidate className="scroll-mt-6 rounded-2xl border-2 border-dash-brand bg-white p-5 shadow-[0_10px_30px_-24px_rgba(24,76,140,.55)] sm:p-6">
          <ErrorSummary errors={errors} />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dash-text">{editing.id ? `Edit ${label}` : `New ${label}`}</h3>
            <button
              type="button"
              aria-label="Close editor"
              onClick={() => { setEditing(null); setErrors({}); }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-dash-muted transition hover:bg-dash-bg hover:text-dash-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dash-brand"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField name="title" label="Title" required error={errors.title} hint={`One short line, e.g. ${segment === "inclusions" ? "Airport transfers" : "International flights"}.`} counter={{ value: (editing.title ?? "").length, max: 255 }}>
              <input
                id="title"
                name="title"
                type="text"
                value={editing.title ?? ""}
                onChange={(e) => {
                  setEditing((prev) => prev ? { ...prev, title: e.target.value } : prev);
                  setErrors((previous) => { const next = { ...previous }; delete next.title; return next; });
                }}
                className={fieldClass(errors.title)}
              />
            </FormField>
            <FormField name="display_order" label="Order" error={errors.display_order} hint="Lower numbers show first.">
              <input
                id="display_order"
                name="display_order"
                type="number"
                min={0}
                value={numberInputValue(editing.display_order as number)}
                onChange={(e) => {
                  setEditing((prev) => prev ? { ...prev, display_order: parseNumberInput(e.target.value) } : prev);
                  setErrors((previous) => { const next = { ...previous }; delete next.display_order; return next; });
                }}
                className={fieldClass(errors.display_order)}
              />
            </FormField>
            <FormField name="status" label="Status" hint="Only active items appear in the published tour.">
              <select
                value={editing.status}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                id="status"
                name="status"
                className={fieldClass()}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
            <FormField name="description" label="Description" hint="Use a short, plain-language explanation." className="md:col-span-2">
              <textarea
                id="description"
                name="description"
                value={editing.description}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                rows={3}
                className={fieldClass()}
              />
            </FormField>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => { setEditing(null); setErrors({}); }}
              className="min-h-11 rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold text-dash-body transition hover:bg-dash-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-dash-brand-hover disabled:opacity-60"
            >
              <Save size={14} /> {saving ? "Saving..." : `Save ${label}`}
            </button>
          </div>
        </form>
      )}
      {dialog}
    </div>
  );
}

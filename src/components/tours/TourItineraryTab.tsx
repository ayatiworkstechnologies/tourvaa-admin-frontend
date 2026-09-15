"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuArrowDown as ArrowDown,
  LuArrowUp as ArrowUp,
  LuCircleAlert as AlertCircle,
  LuPlus as Plus,
  LuPencil as Pencil,
  LuTrash2 as Trash2,
  LuSave as Save,
  LuX as X,
  LuEye as Eye,
  LuInfo as Info,
  LuSparkles as Sparkles,
  LuMapPin as MapPin,
} from "react-icons/lu";
import {
  getItineraries, createItinerary, updateItinerary, deleteItinerary, reorderItineraries, ItineraryDay,
} from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const empty = (): ItineraryDay => ({
  day_number: 1, day_title: "", location_name: "",
  short_description: "", long_description: "", activities: "", optional_activities: "", accommodation: "",
  start_time: "", end_time: "", travel_distance: "", travel_duration: "",
  transport_type: "", meals_included: "", important_notes: "",
  image: "", image_alt_text: "", images: [], display_order: 0, status: "active",
});

function parseStopTitles(text: string): string[] {
  if (!text) return [];
  const matches = [...text.matchAll(/(?:^|\n|(?<=[.!?"]\s+))([A-Z0-9][A-Za-z0-9\s&'/–—\-]+:)\s*/g)];
  return matches.map((m) => m[1].replace(/:$/, "").trim());
}

function ItineraryLongDescriptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const { confirm, dialog } = useConfirm();

  const points = useMemo(() => parseStopTitles(value), [value]);
  const wordCount = useMemo(() => (value ? value.trim().split(/\s+/).filter(Boolean).length : 0), [value]);

  const handleAddPoint = () => {
    const nextNum = points.length + 1;
    const addition = `\n\nPoint ${nextNum} – Landmark / Highlight: Describe the scenic views, guided exploration, and key moments for travellers here...`;
    onChange((value ? value.trimEnd() : "") + addition);
  };

  const handleInsertSection = (title: string, desc: string) => {
    const addition = `\n\n${title}: ${desc}`;
    onChange((value ? value.trimEnd() : "") + addition);
  };

  const handleInsertTemplate = async () => {
    const sample = `Auckland Harbour Bridge – A City Icon: Begin your journey with a smooth drive over the Auckland Harbour Bridge, enjoying panoramic harbour views and distant volcanic peaks.\n\nDevonport – Heritage Charm & Stunning Views: Cross to Devonport, a charming waterfront gem with Victorian-style streets, art galleries, and historic Mount Victoria lookouts.\n\nSky Tower – Auckland's Iconic Skyline: End your luxurious city adventure with a visit to the Sky Tower for breathtaking 360-degree vistas of the city and beyond.`;
    if (!value || (await confirm({ title: "Insert template", message: "Insert structured multi-point itinerary template? This will replace the current text.", confirmLabel: "Insert" }))) {
      onChange(sample);
    }
  };

  const handleFormatSpacing = () => {
    if (!value) return;
    const formatted = value
      .replace(/(?:^|\n|(?<=[.!?"]\s+))([A-Z0-9][A-Za-z0-9\s&'/–—\-]+:)/g, "\n\n$1")
      .trim();
    onChange(formatted);
  };

  return (
    <div className="md:col-span-2 space-y-3 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-slate-50/30 p-4 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 shadow-xs">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Sparkles size={14} className="text-blue-600" />
            Detailed Day Narrative & Key Points
          </span>
          {points.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {points.length} Key Point{points.length === 1 ? "" : "s"} Formatted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              Structured Narrative Mode
            </span>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              showPreview
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs"
            }`}
            title="Toggle between editor and public card preview"
          >
            <Eye size={13} /> {showPreview ? "Back to Editor" : "Card Preview"}
          </button>
        </div>
      </div>

      {/* Detected Point Chips */}
      {points.length > 0 && !showPreview && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 uppercase tracking-wide">
            Points:
          </span>
          {points.map((title, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 shrink-0 rounded-md border border-blue-100 bg-blue-50/80 px-2 py-0.5 text-[11px] font-semibold text-blue-800"
              title={`Point ${i + 1}: ${title}`}
            >
              <MapPin size={11} className="text-blue-500" />
              <span className="max-w-[140px] truncate">{i + 1}. {title}</span>
            </span>
          ))}
        </div>
      )}

      {/* Editor or Preview Mode */}
      {showPreview ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 min-h-[220px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Public Tour Page Preview ({points.length} Points)
            </p>
            <span className="text-[11px] text-slate-400">
              How travellers see each point on the live tour page
            </span>
          </div>
          {points.length > 0 ? (
            <div className="space-y-2.5">
              {points.map((title, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-black text-white shadow-xs">
                    {i + 1}
                  </span>
                  <div>
                    <h6 className="text-sm font-bold text-slate-900">{title}</h6>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Key point card automatically highlighted on the public tour page.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-500 italic">
                No landmark points formatted yet. Click &quot;Back to Editor&quot; and use the pattern:
              </p>
              <code className="mt-2 inline-block rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-blue-600">
                Landmark Name – Highlight: Description text...
              </code>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Main Textarea */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            placeholder={`Enter the day's detailed itinerary narrative. Format each point as:

Landmark / Highlight Title: Detailed description of what travellers will see and experience...

Each formatted point automatically generates an individual numbered milestone card on the traveller tour page!`}
            className="w-full min-h-[190px] resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-normal shadow-2xs"
          />

          {/* In-Editor Toolbar Docked Inside Text Area Detailer */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-2xs">
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleAddPoint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow active:scale-95"
                title="Append a new structured point"
              >
                <Plus size={13} /> Add Point / Landmark
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Morning Exploration", "Depart early for a scenic journey through...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert morning point"
              >
                + Morning
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Afternoon Discovery", "Arrive at the destination and enjoy guided access to...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert afternoon point"
              >
                + Afternoon
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Included Lunch / Tasting", "Savor an authentic local meal featuring regional specialties...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert meal point"
              >
                + Meal / Activity
              </button>

              <button
                type="button"
                onClick={handleInsertTemplate}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                title="Load standard multi-point template"
              >
                <Sparkles size={11} className="text-amber-500" /> Template
              </button>

              <button
                type="button"
                onClick={handleFormatSpacing}
                disabled={!value}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                title="Clean paragraph spacing between points"
              >
                Clean Spacing
              </button>
            </div>

            {/* Stats Counter */}
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span>{points.length} point{points.length === 1 ? "" : "s"}</span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{value.length} chars</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Pro Tip */}
      <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
        <Info size={13} className="text-blue-500 shrink-0" />
        <span>
          Format points as <strong className="text-slate-700">Landmark – Highlight: Description</strong> to automatically render numbered point cards on the traveller tour page.
        </span>
      </div>
      {dialog}
    </div>
  );
}

export default function TourItineraryTab({ tourId, numberOfDays }: { tourId: string; numberOfDays?: number | null }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ItineraryDay | null>(null);
  const [saving, setSaving] = useState(false);

  const duration = numberOfDays && numberOfDays > 0 ? numberOfDays : null;
  const atLimit = duration != null && items.length >= duration;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const itineraryItems = await getItineraries(tourId);
      setItems(itineraryItems);
    } catch {
      toast.error("Failed to load itinerary.");
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
    if (!editing.id && atLimit) {
      toast.error(`This tour is set to ${duration} day(s) in Basic Details -- remove a day there before adding another.`);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editing, day_number: sanitizeNumber(editing.day_number, 1), display_order: sanitizeNumber(editing.display_order) };
      if (editing.id) {
        const updated = await updateItinerary(tourId, editing.id, payload);
        const resolved = (updated && updated.id) ? updated : { ...payload, id: editing.id };
        setItems((prev) => prev.map((i) => (i.id === editing.id ? resolved : i)));
        toast.success("Day updated successfully.");
      } else {
        const created = await createItinerary(tourId, payload);
        setItems((prev) => [...prev, created ?? payload]);
        toast.success("Day created successfully.");
      }
      setEditing(null);
      void load();
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!(await confirm({ title: "Delete itinerary day", message: "Delete this itinerary day?", confirmLabel: "Delete", danger: true }))) return;
    try {
      await deleteItinerary(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setItems(reordered);
    try {
      await reorderItineraries(tourId, reordered.map((item) => item.id!));
    } catch {
      toast.error("Failed to reorder.");
      void load();
    }
  };

  if (loading) return <Loader label="Loading itinerary..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Day-wise Itinerary</h2>
          {duration != null && (
            <p className="mt-0.5 text-xs font-semibold text-dash-subtle">
              {items.length} of {duration} day{duration === 1 ? "" : "s"} added
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...empty(), day_number: items.length + 1, display_order: items.length })}
          disabled={atLimit}
          title={atLimit ? `This tour is set to ${duration} day(s) in Basic Details -- update that before adding another day.` : undefined}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={16} /> Add Day
        </button>
      </div>

      {duration != null && items.length !== duration && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {items.length < duration
            ? `This tour is set to ${duration} day(s) in Basic Details, but only ${items.length} itinerary day${items.length === 1 ? "" : "s"} added. Add ${duration - items.length} more before submitting.`
            : `This tour has ${items.length} itinerary days, more than the ${duration} day(s) set in Basic Details. Remove extra days or update the duration.`}
        </div>
      )}

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">
          No itinerary days yet. Click &quot;Add Day&quot; to begin.
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-dash-brand">Day {item.day_number}</span>
              <h3 className="mt-0.5 font-semibold text-dash-text">{item.day_title || "-"}</h3>
              {item.location_name && <p className="text-sm text-dash-subtle">{item.location_name}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => void move(index, -1)} disabled={index === 0} aria-label="Move day up" title="Move up" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border hover:bg-[#F2F4F7] disabled:opacity-30"><ArrowUp size={14} /></button>
              <button type="button" onClick={() => void move(index, 1)} disabled={index === items.length - 1} aria-label="Move day down" title="Move down" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border hover:bg-[#F2F4F7] disabled:opacity-30"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => setEditing({ ...item })} aria-label={`Edit day ${item.day_number}`} title="Edit" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border hover:bg-[#F2F4F7]"><Pencil size={14} /></button>
              <button type="button" onClick={() => remove(item.id!)} aria-label={`Delete day ${item.day_number}`} title="Delete" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#FFCDD2] text-red-500 hover:bg-[#FFF0F0]"><Trash2 size={14} /></button>
            </div>
          </div>
          {item.short_description && <p className="mt-2 text-sm font-medium text-dash-text">{item.short_description}</p>}
          {item.long_description && (
            <p className="mt-1 text-xs text-dash-body line-clamp-3 leading-relaxed">
              {item.long_description}
            </p>
          )}
        </div>
      ))}

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-dash-text">
                {editing.id ? `Edit Day ${editing.day_number}: ${editing.day_title || "Itinerary Details"}` : "New Itinerary Day"}
              </h3>
              <p className="text-xs text-dash-subtle">
                {editing.id ? "Update the day's schedule, detailed descriptions, activities, and media." : "Add a new day to this tour's itinerary."}
              </p>
            </div>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close" title="Close" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100"><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["day_number", "Day number", "number"],
              ["day_title", "Day title", "text"],
              ["location_name", "Location", "text"],
              ["accommodation", "Accommodation", "text"],
              ["start_time", "Start time", "time"],
              ["end_time", "End time", "time"],
              ["travel_distance", "Travel distance", "text"],
              ["travel_duration", "Travel duration", "text"],
              ["transport_type", "Transport type", "text"],
              ["meals_included", "Meals included", "text"],
              ["display_order", "Display order", "number"],
            ].map(([key, label, type]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
                <input
                  type={type}
                  min={key === "day_number" ? 1 : undefined}
                  max={key === "day_number" && duration != null ? duration : undefined}
                  value={type === "number" ? numberInputValue((editing as Record<string, unknown>)[key] as number) : ((editing as Record<string, unknown>)[key] as string ?? "")}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, [key]: type === "number" ? parseNumberInput(e.target.value) : e.target.value } : prev)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                />
              </label>
            ))}
            {/* Short description */}
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Short description</span>
              <textarea
                value={editing.short_description ?? ""}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, short_description: e.target.value } : prev)}
                rows={2}
                placeholder="Brief summary or hook for this day's itinerary..."
                className="w-full min-h-[68px] resize-y rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
              />
            </label>

            {/* Long description with integrated formatting toolbar and preview */}
            <ItineraryLongDescriptionEditor
              value={editing.long_description ?? ""}
              onChange={(val) => setEditing((prev) => prev ? { ...prev, long_description: val } : prev)}
            />

            {/* Activities */}
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Activities</span>
              <textarea
                value={editing.activities ?? ""}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, activities: e.target.value } : prev)}
                rows={3}
                placeholder="Included activities, entrance tickets, and guided tours..."
                className="w-full min-h-[76px] resize-y rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
              />
            </label>

            {/* Optional activities */}
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Optional activities</span>
              <textarea
                value={editing.optional_activities ?? ""}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, optional_activities: e.target.value } : prev)}
                rows={2}
                placeholder="Optional add-ons available for purchase or during free time..."
                className="w-full min-h-[68px] resize-y rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
              />
            </label>

            {/* Important notes */}
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Important notes</span>
              <textarea
                value={editing.important_notes ?? ""}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, important_notes: e.target.value } : prev)}
                rows={2}
                placeholder="Dress codes, walking advice, altitude or packing tips for this day..."
                className="w-full min-h-[68px] resize-y rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
              />
            </label>
            <div className="md:col-span-2">
              <AdminAssetUpload
                label="Day image (cover)"
                value={editing.image ?? ""}
                onChange={(value) => setEditing((prev) => (prev ? { ...prev, image: value } : prev))}
              />
            </div>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Day image alt text</span>
              <input
                type="text"
                value={editing.image_alt_text ?? ""}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, image_alt_text: e.target.value } : prev))}
                placeholder="Describe the day image for accessibility and SEO..."
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
              />
            </label>
            <div className="md:col-span-2 space-y-3">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Day image carousel (additional images)</span>
              {(editing.images ?? []).map((src, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <AdminAssetUpload
                      label={`Image ${index + 1}`}
                      value={src}
                      onChange={(value) => setEditing((prev) => {
                        if (!prev) return prev;
                        const images = [...(prev.images ?? [])];
                        images[index] = value;
                        return { ...prev, images };
                      })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing((prev) => prev ? { ...prev, images: (prev.images ?? []).filter((_, i) => i !== index) } : prev)}
                    aria-label={`Remove image ${index + 1}`}
                    title="Remove image"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#FFCDD2] text-red-500 hover:bg-[#FFF0F0]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditing((prev) => prev ? { ...prev, images: [...(prev.images ?? []), ""] } : prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold hover:bg-[#F2F4F7]"
              >
                <Plus size={14} /> Add carousel image
              </button>
            </div>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select
                value={editing.status}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-xl border border-dash-border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            >
              <Save size={15} /> {saving ? "Saving..." : editing.id ? "Update Day" : "Save Day"}
            </button>
          </div>
        </form>
      )}
      {dialog}
    </div>
  );
}



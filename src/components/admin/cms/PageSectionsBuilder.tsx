"use client";

import { useState } from "react";
import { LuPlus as Plus, LuTrash2 as Trash2, LuChevronUp as ChevronUp, LuChevronDown as ChevronDown } from "react-icons/lu";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import type { CmsPageBlock } from "@/components/public/CmsPageSections";

type CardItem = { image?: string; title?: string; description?: string; link?: string };

const BLOCK_LABELS: Record<CmsPageBlock["type"], string> = {
  hero: "Hero Banner",
  text: "Text",
  image_text: "Image + Text",
  cards: "Card Grid",
  cta: "Call to Action",
};

const DEFAULTS: Record<CmsPageBlock["type"], CmsPageBlock> = {
  hero: { type: "hero", heading: "", subtitle: "", image: "" },
  text: { type: "text", heading: "", body: "" },
  image_text: { type: "image_text", heading: "", body: "", image: "", image_position: "left" },
  cards: { type: "cards", heading: "", subtitle: "", items: [] },
  cta: { type: "cta", heading: "", subtitle: "", button_text: "", button_link: "" },
};

const inputClass = "w-full rounded-xl border border-dash-border bg-white px-3 py-2 text-sm outline-none focus:border-[#0284C7]";
const labelClass = "mb-1 block text-[11px] font-bold uppercase text-dash-muted";

// The admin-side builder for a CMS Page's `sections` (see CmsPageSections.tsx
// for the matching public renderer). Unlike ContentBlockPanel's "records"
// field (a repeatable list of ONE fixed shape), this list holds blocks of
// FIVE different shapes in any order the admin chooses - so each block
// renders its own field set based on its `type`, which can't be changed
// after it's added (remove and re-add instead).
export default function PageSectionsBuilder({ value, onChange }: { value: CmsPageBlock[]; onChange: (next: CmsPageBlock[]) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const updateBlock = (index: number, patch: Partial<CmsPageBlock>) => {
    onChange(value.map((b, i) => (i === index ? ({ ...b, ...patch } as CmsPageBlock) : b)));
  };
  const removeBlock = (index: number) => onChange(value.filter((_, i) => i !== index));
  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const addBlock = (type: CmsPageBlock["type"]) => {
    onChange([...value, { ...DEFAULTS[type] }]);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-dash-border bg-dash-bg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-dash-text">Page Sections</h4>
          <p className="text-xs text-dash-muted">Build this page from a hero banner, text, image + text, card grids, and a call-to-action - in any order.</p>
        </div>
      </div>

      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-dash-border bg-white px-3 py-4 text-center text-xs text-dash-muted">
          No sections yet - leave empty to fall back to plain Content below, or add a section to build a designed page.
        </p>
      )}

      {value.map((block, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-dash-border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#EDF5FF] px-2.5 py-1 text-xs font-bold text-[#0284C7]">
              {index + 1}. {BLOCK_LABELS[block.type]}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" title="Move up" disabled={index === 0} onClick={() => moveBlock(index, -1)} className="rounded-lg p-1.5 text-dash-muted hover:bg-dash-bg disabled:opacity-30">
                <ChevronUp size={15} />
              </button>
              <button type="button" title="Move down" disabled={index === value.length - 1} onClick={() => moveBlock(index, 1)} className="rounded-lg p-1.5 text-dash-muted hover:bg-dash-bg disabled:opacity-30">
                <ChevronDown size={15} />
              </button>
              <button type="button" title="Remove section" onClick={() => removeBlock(index)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {block.type === "hero" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Heading</label>
                <input className={inputClass} value={block.heading ?? ""} onChange={(e) => updateBlock(index, { heading: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input className={inputClass} value={block.subtitle ?? ""} onChange={(e) => updateBlock(index, { subtitle: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <AdminAssetUpload label="Background Image" kind="asset" value={block.image ?? ""} onChange={(v) => updateBlock(index, { image: v })} />
              </div>
            </div>
          )}

          {block.type === "text" && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Heading (optional)</label>
                <input className={inputClass} value={block.heading ?? ""} onChange={(e) => updateBlock(index, { heading: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Body (one paragraph per line)</label>
                <textarea rows={4} className={`${inputClass} resize-none`} value={block.body ?? ""} onChange={(e) => updateBlock(index, { body: e.target.value })} />
              </div>
            </div>
          )}

          {block.type === "image_text" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Heading (optional)</label>
                  <input className={inputClass} value={block.heading ?? ""} onChange={(e) => updateBlock(index, { heading: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Image Position</label>
                  <select className={inputClass} value={block.image_position ?? "left"} onChange={(e) => updateBlock(index, { image_position: e.target.value as "left" | "right" })}>
                    <option value="left">Image on the left</option>
                    <option value="right">Image on the right</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Body (one paragraph per line)</label>
                <textarea rows={4} className={`${inputClass} resize-none`} value={block.body ?? ""} onChange={(e) => updateBlock(index, { body: e.target.value })} />
              </div>
              <AdminAssetUpload label="Image" kind="asset" value={block.image ?? ""} onChange={(v) => updateBlock(index, { image: v })} />
            </div>
          )}

          {block.type === "cards" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Heading (optional)</label>
                  <input className={inputClass} value={block.heading ?? ""} onChange={(e) => updateBlock(index, { heading: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Subtitle (optional)</label>
                  <input className={inputClass} value={block.subtitle ?? ""} onChange={(e) => updateBlock(index, { subtitle: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                {(block.items ?? []).map((item, ii) => {
                  const setItems = (items: CardItem[]) => updateBlock(index, { items });
                  const items = block.items ?? [];
                  return (
                    <div key={ii} className="space-y-2 rounded-lg border border-dash-border bg-dash-bg/60 p-3">
                      <AdminAssetUpload label="Image" kind="asset" value={item.image ?? ""} onChange={(v) => setItems(items.map((it, i) => (i === ii ? { ...it, image: v } : it)))} />
                      <input placeholder="Title" className={inputClass} value={item.title ?? ""} onChange={(e) => setItems(items.map((it, i) => (i === ii ? { ...it, title: e.target.value } : it)))} />
                      <textarea placeholder="Description" rows={2} className={`${inputClass} resize-none`} value={item.description ?? ""} onChange={(e) => setItems(items.map((it, i) => (i === ii ? { ...it, description: e.target.value } : it)))} />
                      <input placeholder="Link (optional)" className={inputClass} value={item.link ?? ""} onChange={(e) => setItems(items.map((it, i) => (i === ii ? { ...it, link: e.target.value } : it)))} />
                      <button type="button" onClick={() => setItems(items.filter((_, i) => i !== ii))} className="rounded-lg border border-dash-border px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50">
                        Remove Card
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => updateBlock(index, { items: [...(block.items ?? []), {}] })}
                  className="rounded-xl border border-dashed border-[#9CCFF0] px-3 py-2 text-xs font-bold text-[#0284C7] hover:bg-[#F7FBFF]"
                >
                  + Add Card
                </button>
              </div>
            </div>
          )}

          {block.type === "cta" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Heading</label>
                <input className={inputClass} value={block.heading ?? ""} onChange={(e) => updateBlock(index, { heading: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input className={inputClass} value={block.subtitle ?? ""} onChange={(e) => updateBlock(index, { subtitle: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Button Text</label>
                <input className={inputClass} value={block.button_text ?? ""} onChange={(e) => updateBlock(index, { button_text: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Button Link</label>
                <input className={inputClass} value={block.button_link ?? ""} onChange={(e) => updateBlock(index, { button_link: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      ))}

      {pickerOpen ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dash-border bg-white p-3">
          {(Object.keys(BLOCK_LABELS) as CmsPageBlock["type"][]).map((type) => (
            <button key={type} type="button" onClick={() => addBlock(type)} className="rounded-lg border border-dash-border px-3 py-1.5 text-xs font-bold text-dash-text hover:border-[#0284C7] hover:text-[#0284C7]">
              {BLOCK_LABELS[type]}
            </button>
          ))}
          <button type="button" onClick={() => setPickerOpen(false)} className="text-xs font-bold text-dash-muted hover:text-dash-text">
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#9CCFF0] px-3 py-2 text-xs font-bold text-[#0284C7] hover:bg-[#F7FBFF]"
        >
          <Plus size={13} /> Add Section
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LuArrowDown as ArrowDown,
  LuArrowUp as ArrowUp,
  LuCheck as Check,
  LuImage as ImageIcon,
  LuLayoutGrid as LayoutGrid,
  LuMap as MapIcon,
  LuNewspaper as Newspaper,
  LuPlus as Plus,
  LuSearch as Search,
  LuTag as Tag,
  LuTrash2 as Trash2,
  LuType as TypeIcon,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import api from "@/lib/api/client";
import { fetchPublicBlogs, fetchPublicCategories, fetchPublicSubcategories } from "@/lib/api/publicClient";
import { useConfirm } from "@/hooks/useConfirm";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import {
  EXTRA_SECTION_ANCHORS,
  EXTRA_SECTION_TYPES,
  type ExtraSectionCard,
  type ExtraSectionType,
  type HomeExtraSection,
} from "@/components/public/home/extraSectionsTypes";

type Option = { slug: string; name: string; group?: string };
type TourOption = { id: number; label: string };

export type ExtraSectionLookups = {
  categories: Option[];
  subcategories: Option[];
  tours: TourOption[];
  // Slugs that currently have published tours (null until loaded), so we can
  // warn when a section points at an empty category and would be hidden.
  liveSlugs: { category: Set<string>; subcategory: Set<string> } | null;
  // Published blog posts (null until loaded) - a blog section hides while there are none.
  blogCount: number | null;
};

// Themes the client asked for (Adventures, Cultural Experience, Cruise
// Journeys, Spiritual Sites Tours). A new section whose name mentions one
// starts with the matching category pre-selected.
const THEME_KEYWORDS: string[][] = [
  ["adventure"],
  ["cultur", "heritage"],
  ["cruise"],
  ["spiritual", "pilgrim", "religio", "temple"],
];

export function suggestedCategory(title: string, categories: Option[]): string {
  const name = title.toLowerCase();
  const keywords = THEME_KEYWORDS.find((ks) => ks.some((k) => name.includes(k)));
  if (!keywords) return "";
  return categories.find((c) => keywords.some((k) => c.name.toLowerCase().includes(k)))?.slug ?? "";
}

// Why a section won't appear on the homepage even though it's switched on
// (null = it will show).
export function extraSectionProblem(s: HomeExtraSection, lookups: ExtraSectionLookups): string | null {
  switch (s.type) {
    case "cards":
      return s.cards.some((c) => c.title || c.image || c.description) ? null : "No cards added yet";
    case "text":
      return s.body.trim() ? null : "No text added yet";
    case "image_text":
      return s.body.trim() || s.image ? null : "No image or text added yet";
    case "blogs":
      return lookups.blogCount === 0 ? "No published blog posts yet" : null;
    case "offer":
      return null;
  }
  if (s.source === "tours") return s.tour_ids.length ? null : "No tours added yet";
  const slug = s[s.source];
  if (!slug) return `No ${s.source} picked`;
  if (lookups.liveSlugs && !lookups.liveSlugs[s.source].has(slug)) return `This ${s.source} has no published tours yet`;
  return null;
}

// Lookups for the pickers. The admin category endpoints need the
// categories.view permission, so fall back to the public lists (which only
// include categories that currently have published tours).
export function useExtraSectionLookups(): ExtraSectionLookups {
  const [categories, setCategories] = useState<Option[]>([]);
  const [subcategories, setSubcategories] = useState<Option[]>([]);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [liveSlugs, setLiveSlugs] = useState<ExtraSectionLookups["liveSlugs"]>(null);
  const [blogCount, setBlogCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    type Row = Record<string, unknown>;
    const rows = (res: { data?: { items?: Row[] } }) => res.data?.items ?? [];
    api.get("/tour-categories", { params: { limit: 500 } })
      .then((res) => rows(res).filter((c) => c.status !== "inactive"))
      .catch(() => fetchPublicCategories() as Promise<unknown> as Promise<Row[]>)
      .then((items) => {
        if (active) setCategories(items.map((c) => ({ slug: String(c.slug ?? ""), name: String(c.category_name ?? "") })).filter((c) => c.slug));
      })
      .catch(() => {});
    api.get("/tour-subcategories", { params: { limit: 1000 } })
      .then((res) => rows(res).filter((c) => c.status !== "inactive"))
      .catch(() => fetchPublicSubcategories() as Promise<unknown> as Promise<Row[]>)
      .then((items) => {
        if (active) setSubcategories(items.map((c) => ({ slug: String(c.slug ?? ""), name: String(c.subcategory_name ?? ""), group: String(c.category_name ?? "") })).filter((c) => c.slug));
      })
      .catch(() => {});
    Promise.all([fetchPublicCategories(), fetchPublicSubcategories()])
      .then(([cats, subs]) => {
        if (active) setLiveSlugs({ category: new Set(cats.map((c) => c.slug)), subcategory: new Set(subs.map((c) => c.slug)) });
      })
      .catch(() => {});
    fetchPublicBlogs()
      .then((blogs) => {
        if (active) setBlogCount(blogs.length);
      })
      .catch(() => {});
    api.get("/tours", { params: { page: 1, limit: 1000, status: "published" } })
      .then((res) => {
        const data = res.data?.data ?? res.data?.items ?? res.data ?? [];
        const list: Row[] = Array.isArray(data) ? data : data.items ?? [];
        if (active) {
          setTours(list.map((t) => ({
            id: Number(t.id),
            label: `${t.tour_code ? `${t.tour_code} - ` : ""}${typeof t.title === "string" ? t.title : `Tour #${t.id}`}`,
          })).filter((t) => t.id > 0));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return { categories, subcategories, tours, liveSlugs, blogCount };
}

const INPUT = "w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10";
const LABEL = "mb-1 block text-xs font-bold uppercase text-dash-muted";

function TourMultiPicker({ tours, value, onChange }: { tours: TourOption[]; value: number[]; onChange: (ids: number[]) => void }) {
  const [search, setSearch] = useState("");
  const byId = useMemo(() => new Map(tours.map((t) => [t.id, t.label])), [tours]);
  const term = search.trim().toLowerCase();
  const matches = tours.filter((t) => !value.includes(t.id) && (!term || t.label.toLowerCase().includes(term))).slice(0, 50);
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...value];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ol className="space-y-1">
          {value.map((id, idx) => (
            <li key={id} className="flex items-center gap-2 rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs">
              <span className="w-5 text-dash-subtle">{idx + 1}.</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-dash-text">{byId.get(id) ?? `Tour #${id} (not published)`}</span>
              <button type="button" aria-label="Move up" onClick={() => move(idx, -1)} className="rounded p-1 text-dash-muted hover:bg-slate-100"><ArrowUp size={12} /></button>
              <button type="button" aria-label="Move down" onClick={() => move(idx, 1)} className="rounded p-1 text-dash-muted hover:bg-slate-100"><ArrowDown size={12} /></button>
              <button type="button" aria-label="Remove tour" onClick={() => onChange(value.filter((v) => v !== id))} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 size={12} /></button>
            </li>
          ))}
        </ol>
      )}
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dash-subtle" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search published tours to add..." className={`${INPUT} pl-8`} />
      </div>
      {term && (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-dash-border bg-white">
          {matches.length ? (
            matches.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange([...value, t.id])}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#F7FBFF]"
              >
                <Plus size={12} className="shrink-0 text-[#0284C7]" /> <span className="truncate">{t.label}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-dash-subtle">No matching tours.</p>
          )}
        </div>
      )}
    </div>
  );
}

const TYPE_ICONS: Record<ExtraSectionType, IconType> = {
  tours: MapIcon,
  cards: LayoutGrid,
  offer: Tag,
  blogs: Newspaper,
  text: TypeIcon,
  image_text: ImageIcon,
};

// Visual chooser for what a section shows (used by "Add new section" and the
// section editor).
export function SectionTypePicker({ value, onChange, compact = false }: { value: ExtraSectionType; onChange: (type: ExtraSectionType) => void; compact?: boolean }) {
  return (
    <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3">
      {EXTRA_SECTION_TYPES.map(({ type, label, description }) => {
        const Icon = TYPE_ICONS[type];
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            aria-pressed={selected}
            title={description}
            className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition ${
              selected ? "border-[#0284C7] bg-[#EDF5FF] shadow-[0_0_0_3px_rgba(2,132,199,0.12)]" : "border-dash-border bg-white hover:border-[#9CCFF0] hover:bg-[#F7FBFF]"
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${selected ? "bg-[#0284C7] text-white" : "bg-slate-100 text-dash-muted"}`}>
              <Icon size={16} />
            </span>
            <span className={`text-xs font-bold ${selected ? "text-[#0284C7]" : "text-dash-text"}`}>{label}</span>
            {!compact && <span className="text-[11px] leading-snug text-dash-subtle">{description}</span>}
          </button>
        );
      })}
    </div>
  );
}

function CardsEditor({ value, onChange }: { value: ExtraSectionCard[]; onChange: (cards: ExtraSectionCard[]) => void }) {
  const setCard = (idx: number, patch: Partial<ExtraSectionCard>) => onChange(value.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-dash-border px-3 py-4 text-center text-xs text-dash-subtle">No cards yet - add your first card.</p>
      )}
      {value.map((card, idx) => (
        <div key={idx} className="rounded-xl border border-dash-border bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-[#EDF5FF] px-2.5 py-0.5 text-[11px] font-bold text-[#0284C7]">Card {idx + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Move card up" disabled={idx === 0} onClick={() => move(idx, -1)} className="rounded p-1.5 text-dash-muted hover:bg-white disabled:opacity-30"><ArrowUp size={13} /></button>
              <button type="button" aria-label="Move card down" disabled={idx === value.length - 1} onClick={() => move(idx, 1)} className="rounded p-1.5 text-dash-muted hover:bg-white disabled:opacity-30"><ArrowDown size={13} /></button>
              <button type="button" aria-label="Remove card" onClick={() => onChange(value.filter((_, i) => i !== idx))} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="Title" value={card.title} onChange={(e) => setCard(idx, { title: e.target.value })} className={INPUT} />
            <input placeholder="Link (optional), e.g. /tours?country=Egypt" value={card.link} onChange={(e) => setCard(idx, { link: e.target.value })} className={INPUT} />
            <textarea placeholder="Short description" rows={2} value={card.description} onChange={(e) => setCard(idx, { description: e.target.value })} className={`${INPUT} resize-none sm:col-span-2`} />
            <div className="sm:col-span-2">
              <AdminAssetUpload label="Card image" kind="asset" value={card.image} onChange={(image) => setCard(idx, { image })} />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { image: "", title: "", description: "", link: "" }])}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#9CCFF0] px-3 py-2 text-xs font-bold text-[#0284C7] hover:bg-[#F7FBFF]"
      >
        <Plus size={13} /> Add card
      </button>
    </div>
  );
}

// Editor for one admin-added homepage section (CMS > Home Page >
// "+ Add new section"). The show/hide switch lives in the section list
// (HomePageEditor); this edits the section's type, content and position.
export default function ExtraSectionEditor({
  section,
  lookups,
  onSave,
  onDelete,
}: {
  section: HomeExtraSection;
  lookups: ExtraSectionLookups;
  onSave: (next: HomeExtraSection) => Promise<boolean>;
  onDelete: () => Promise<void>;
}) {
  const { confirm, dialog } = useConfirm();
  const [draft, setDraft] = useState(section);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const { categories, subcategories, tours } = lookups;

  // The parent remounts this editor per section (key = section id); only the
  // switch can change `enabled` from outside, so keep that in sync.
  useEffect(() => {
    setDraft((d) => ({ ...d, enabled: section.enabled }));
  }, [section.enabled]);

  const set = (patch: Partial<HomeExtraSection>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(section);
  const problem = extraSectionProblem(draft, lookups);

  const save = async () => {
    if (!draft.title.trim()) {
      setTitleError(true);
      return;
    }
    setSaving(true);
    await onSave({
      ...draft,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      view_all_text: draft.view_all_text.trim(),
      view_all_url: draft.view_all_url.trim(),
    });
    setSaving(false);
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Delete section?",
      message: `"${section.title || "Untitled section"}" will be removed from the homepage. To hide it for now, use its switch in the section list instead.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) await onDelete();
  };

  const afterLabel = EXTRA_SECTION_ANCHORS.find((a) => a.key === draft.after)?.label ?? "Countries Worth Exploring";
  const typeInfo = EXTRA_SECTION_TYPES.find((t) => t.type === draft.type) ?? EXTRA_SECTION_TYPES[0];
  const status = !draft.enabled
    ? { tone: "bg-slate-100 text-slate-600", text: "Hidden - switched off in the section list" }
    : problem
      ? { tone: "bg-amber-50 text-amber-800", text: `Hidden on the homepage - ${problem}` }
      : { tone: "bg-emerald-50 text-emerald-700", text: `Live on the homepage, after ${afterLabel}` };

  return (
    <div className="space-y-5">
      {dialog}
      <section className="rounded-xl border border-dash-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">Custom section · {typeInfo.label}</p>
            <h3 className="mt-0.5 truncate text-lg font-bold text-dash-text">{section.title || "Untitled section"}</h3>
          </div>
          <button type="button" onClick={() => void remove()} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
            <Trash2 size={13} /> Delete section
          </button>
        </div>
        <p className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${status.tone}`}>{status.text}</p>
      </section>

      <section className="rounded-xl border border-dash-border bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>{draft.type === "offer" ? "Offer heading *" : "Section heading *"}</label>
            <input
              value={draft.title}
              onChange={(e) => {
                setTitleError(false);
                set({ title: e.target.value });
              }}
              placeholder={draft.type === "offer" ? "e.g. Save 20% on Summer Escapes" : "e.g. Adventures"}
              className={`${INPUT} ${titleError ? "border-red-400" : ""}`}
            />
            {titleError && <p className="mt-1 text-xs text-red-600">A heading is required.</p>}
          </div>
          <div>
            <label className={LABEL}>Position - show after</label>
            <select value={draft.after} onChange={(e) => set({ after: e.target.value })} className={INPUT}>
              {EXTRA_SECTION_ANCHORS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Section type</label>
            <SectionTypePicker value={draft.type} onChange={(type) => set({ type })} compact />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>{draft.type === "offer" ? "Offer text (optional)" : "Subtitle (optional)"}</label>
            <textarea rows={2} value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })} className={`${INPUT} resize-none`} />
          </div>

          {draft.type === "cards" && (
            <div className="sm:col-span-2">
              <label className={LABEL}>Cards (shown 4 per row)</label>
              <CardsEditor value={draft.cards} onChange={(cards) => set({ cards })} />
            </div>
          )}

          {draft.type === "offer" && (
            <>
              <div>
                <label className={LABEL}>Badge (optional)</label>
                <input value={draft.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="e.g. Limited time" className={INPUT} />
              </div>
              <div />
              <div>
                <label className={LABEL}>Button text</label>
                <input value={draft.button_text} onChange={(e) => set({ button_text: e.target.value })} placeholder="e.g. View offer" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Button link</label>
                <input value={draft.button_link} onChange={(e) => set({ button_link: e.target.value })} placeholder="e.g. /deals" className={INPUT} />
              </div>
              <div className="sm:col-span-2">
                <AdminAssetUpload label="Background image" kind="asset" value={draft.image} onChange={(image) => set({ image })} />
              </div>
            </>
          )}

          {(draft.type === "text" || draft.type === "image_text") && (
            <div className="sm:col-span-2">
              <label className={LABEL}>Text (one paragraph per line)</label>
              <textarea rows={5} value={draft.body} onChange={(e) => set({ body: e.target.value })} className={`${INPUT} resize-y`} />
            </div>
          )}

          {draft.type === "image_text" && (
            <>
              <div>
                <label className={LABEL}>Image position</label>
                <select value={draft.image_position} onChange={(e) => set({ image_position: e.target.value as "left" | "right" })} className={INPUT}>
                  <option value="left">Image on the left</option>
                  <option value="right">Image on the right</option>
                </select>
              </div>
              <div />
              <div>
                <label className={LABEL}>Button text (optional)</label>
                <input value={draft.button_text} onChange={(e) => set({ button_text: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Button link</label>
                <input value={draft.button_link} onChange={(e) => set({ button_link: e.target.value })} className={INPUT} />
              </div>
              <div className="sm:col-span-2">
                <AdminAssetUpload label="Image" kind="asset" value={draft.image} onChange={(image) => set({ image })} />
              </div>
            </>
          )}

          {draft.type === "blogs" && (
            <>
              <div>
                <label className={LABEL}>Posts shown (latest first)</label>
                <input type="number" min={1} max={8} value={Math.min(draft.limit, 8)} onChange={(e) => set({ limit: Math.max(1, Math.min(8, Number(e.target.value) || 1)) })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>&quot;View all&quot; link text</label>
                <input value={draft.view_all_text} onChange={(e) => set({ view_all_text: e.target.value })} placeholder="View all posts" className={INPUT} />
              </div>
              <p className="sm:col-span-2 rounded-lg bg-[#F7FBFF] px-3 py-2 text-xs text-dash-muted">
                Posts come from CMS &gt; Blog automatically. The section is hidden while there are no published posts.
              </p>
            </>
          )}

          {draft.type === "tours" && (
          <div className="sm:col-span-2">
            <label className={LABEL}>Tours come from</label>
            <select value={draft.source} onChange={(e) => set({ source: e.target.value as HomeExtraSection["source"] })} className={INPUT}>
              <option value="category">A tour category</option>
              <option value="subcategory">A tour subcategory</option>
              <option value="tours">Hand-picked tours</option>
            </select>
          </div>
          )}

          {draft.type === "tours" && draft.source === "category" && (
            <div className="sm:col-span-2">
              <label className={LABEL}>Category</label>
              <select value={draft.category} onChange={(e) => set({ category: e.target.value })} className={INPUT}>
                <option value="">Select a category...</option>
                {draft.category && !categories.some((c) => c.slug === draft.category) && <option value={draft.category}>{draft.category}</option>}
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}{lookups.liveSlugs && !lookups.liveSlugs.category.has(c.slug) ? " (no published tours)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {draft.type === "tours" && draft.source === "subcategory" && (
            <div className="sm:col-span-2">
              <label className={LABEL}>Subcategory</label>
              <select value={draft.subcategory} onChange={(e) => set({ subcategory: e.target.value })} className={INPUT}>
                <option value="">Select a subcategory...</option>
                {draft.subcategory && !subcategories.some((c) => c.slug === draft.subcategory) && <option value={draft.subcategory}>{draft.subcategory}</option>}
                {subcategories.map((c) => <option key={c.slug} value={c.slug}>{c.group ? `${c.group} > ` : ""}{c.name}</option>)}
              </select>
            </div>
          )}
          {draft.type === "tours" && draft.source === "tours" && (
            <div className="sm:col-span-2">
              <label className={LABEL}>Tours (shown in this order)</label>
              <TourMultiPicker tours={tours} value={draft.tour_ids} onChange={(ids) => set({ tour_ids: ids })} />
            </div>
          )}

          {draft.type === "tours" && (
            <>
              <div>
                <label className={LABEL}>Max tours shown</label>
                <input type="number" min={1} max={20} value={draft.limit} onChange={(e) => set({ limit: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>&quot;View all&quot; link text</label>
                <input value={draft.view_all_text} onChange={(e) => set({ view_all_text: e.target.value })} placeholder="View all" className={INPUT} />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>&quot;View all&quot; link URL</label>
                <input value={draft.view_all_url} onChange={(e) => set({ view_all_url: e.target.value })} placeholder="Leave blank to link to the matching tours listing" className={INPUT} />
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-dash-border pt-4">
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
          >
            <Check size={14} /> {saving ? "Saving..." : "Save"}
          </button>
          {dirty && !saving && <span className="text-xs font-semibold text-amber-700">Unsaved changes</span>}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuExternalLink as ExternalLink, LuRefreshCw as RefreshCw, LuRotateCcw as RotateCcw, LuSave as Save, LuSearch as Search } from "react-icons/lu";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import { AFFILIATE_ENABLED } from "@/lib/features";
import { PAGE_METADATA, SITE_NAME, SITE_URL, brandTitle } from "@/lib/seo/pageMetadata";
import {
  EDITABLE_SEO_PAGES,
  PAGE_SEO_BLOCK_KEY,
  SEO_DESCRIPTION_LIMIT,
  SEO_KEYWORDS_LIMIT,
  SEO_TITLE_LIMIT,
  cleanMetaText,
  type PageSeoMap,
} from "@/lib/seo/seoPages";

const PAGES = EDITABLE_SEO_PAGES.filter((page) => AFFILIATE_ENABLED || !page.path.includes("affiliate"));

function Counter({ value, limit }: { value: number; limit: number }) {
  return (
    <span className={`text-xs font-semibold ${value > limit ? "text-red-600" : value > limit * 0.9 ? "text-amber-600" : "text-dash-muted"}`}>
      {value}/{limit}
    </span>
  );
}

/** Admin > Website CMS > SEO & Meta Tags: the title, description and keywords of
 * each public page. Blank fields keep the built-in copy (shown as the
 * placeholder). Tours, blogs, country pages and custom CMS pages have their
 * own SEO fields on their own edit forms. */
export default function PageSeoEditor() {
  const toast = useToast();
  const [saved, setSaved] = useState<PageSeoMap>({});
  const [draft, setDraft] = useState<PageSeoMap>({});
  const [selected, setSelected] = useState(PAGES[0].path);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cms/content-blocks/${PAGE_SEO_BLOCK_KEY}`);
      const data = (res.data?.data?.data ?? {}) as PageSeoMap;
      setSaved(data);
      setDraft(data);
    } catch {
      toast.error("Could not load SEO settings.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const page = PAGES.find((p) => p.path === selected) ?? PAGES[0];
  const defaults = PAGE_METADATA[page.path];
  const current = draft[page.path] ?? {};
  const title = current.title ?? "";
  const description = current.description ?? "";
  const keywords = current.keywords ?? "";
  const effectiveTitle = brandTitle(cleanMetaText(title) || defaults.title);
  const effectiveDescription = cleanMetaText(description) || defaults.description;

  const dirtyPaths = useMemo(
    () => PAGES.filter((p) => JSON.stringify(draft[p.path] ?? {}) !== JSON.stringify(saved[p.path] ?? {})).map((p) => p.path),
    [draft, saved],
  );
  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const visible = PAGES.filter((p) => !q || p.label.toLowerCase().includes(q) || p.path.includes(q));
    return [...new Set(visible.map((p) => p.group))].map((group) => ({ group, pages: visible.filter((p) => p.group === group) }));
  }, [filter]);

  const update = (field: "title" | "description" | "keywords", value: string) =>
    setDraft((d) => ({ ...d, [page.path]: { ...d[page.path], [field]: value } }));

  const save = async () => {
    const tooLong = PAGES.find((p) => {
      const entry = draft[p.path] ?? {};
      return cleanMetaText(entry.title).length > SEO_TITLE_LIMIT
        || cleanMetaText(entry.description).length > SEO_DESCRIPTION_LIMIT
        || cleanMetaText(entry.keywords).length > SEO_KEYWORDS_LIMIT;
    });
    if (tooLong) {
      setSelected(tooLong.path);
      toast.error(`${tooLong.label}: keep the title within ${SEO_TITLE_LIMIT}, description within ${SEO_DESCRIPTION_LIMIT}, and keywords within ${SEO_KEYWORDS_LIMIT} characters.`);
      return;
    }
    // Only non-empty values are stored; blank = use the built-in copy.
    const data: PageSeoMap = {};
    for (const [path, entry] of Object.entries(draft)) {
      const t = cleanMetaText(entry?.title);
      const d = cleanMetaText(entry?.description);
      const k = cleanMetaText(entry?.keywords);
      if (t || d || k) data[path] = {
        ...(t ? { title: t } : {}),
        ...(d ? { description: d } : {}),
        ...(k ? { keywords: k } : {}),
      };
    }
    setSaving(true);
    try {
      await api.put(`/cms/content-blocks/${PAGE_SEO_BLOCK_KEY}`, { data });
      setSaved(data);
      setDraft(data);
      toast.success("SEO settings saved. Changes are live on the next page load.");
    } catch {
      toast.error("Could not save SEO settings.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10";

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-xl border border-dash-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-dash-text">SEO &amp; Meta Tags</h3>
          <p className="mt-1 text-sm text-dash-muted">
            The title, description and keywords search engines and social shares use for each public page. Leave a field blank to use the default.
            Tours, blogs, country pages and custom pages have their own SEO fields on their edit forms.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => void load()} disabled={loading || saving} className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg disabled:opacity-60">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button type="button" onClick={() => void save()} disabled={loading || saving || dirtyPaths.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1] disabled:opacity-60">
            <Save size={15} /> {saving ? "Saving..." : dirtyPaths.length ? `Save (${dirtyPaths.length})` : "Saved"}
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-dash-border bg-white p-3">
          <label className="relative mb-3 block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a page" className={`${inputClass} pl-8`} />
          </label>
          <div className="max-h-[560px] space-y-3 overflow-y-auto">
            {groups.map(({ group, pages }) => (
              <div key={group}>
                <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-dash-muted">{group}</p>
                {pages.map((p) => {
                  const custom = Boolean(cleanMetaText(saved[p.path]?.title) || cleanMetaText(saved[p.path]?.description) || cleanMetaText(saved[p.path]?.keywords));
                  const dirty = dirtyPaths.includes(p.path);
                  return (
                    <button
                      key={p.path}
                      type="button"
                      onClick={() => setSelected(p.path)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${p.path === page.path ? "bg-sky-50 font-bold text-[#0369A1]" : "text-dash-body hover:bg-dash-bg"}`}
                    >
                      <span className="min-w-0 truncate">{p.label}</span>
                      {dirty ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Unsaved</span>
                      ) : custom ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Custom</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        <section className="space-y-5 rounded-xl border border-dash-border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-dash-text">{page.label}</h4>
              <p className="text-xs text-dash-muted">{page.path}</p>
            </div>
            <div className="flex gap-2">
              <a href={page.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border px-3 py-1.5 text-xs font-bold text-dash-body hover:bg-dash-bg">
                <ExternalLink size={13} /> View page
              </a>
              <button
                type="button"
                onClick={() => setDraft((d) => { const next = { ...d }; delete next[page.path]; return next; })}
                disabled={!title && !description && !keywords}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border px-3 py-1.5 text-xs font-bold text-dash-body hover:bg-dash-bg disabled:opacity-50"
              >
                <RotateCcw size={13} /> Use defaults
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="seo-title" className="text-xs font-bold uppercase text-dash-muted">Meta title</label>
              <Counter value={cleanMetaText(title).length} limit={SEO_TITLE_LIMIT} />
            </div>
            <input id="seo-title" value={title} onChange={(e) => update("title", e.target.value)} placeholder={defaults.title} className={inputClass} disabled={loading} />
            <p className="mt-1 text-xs text-dash-muted">&ldquo;| {SITE_NAME}&rdquo; is added automatically.</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="seo-description" className="text-xs font-bold uppercase text-dash-muted">Meta description</label>
              <Counter value={cleanMetaText(description).length} limit={SEO_DESCRIPTION_LIMIT} />
            </div>
            <textarea id="seo-description" rows={4} value={description} onChange={(e) => update("description", e.target.value)} placeholder={defaults.description} className={`${inputClass} resize-none`} disabled={loading} />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="seo-keywords" className="text-xs font-bold uppercase text-dash-muted">Meta keywords</label>
              <Counter value={cleanMetaText(keywords).length} limit={SEO_KEYWORDS_LIMIT} />
            </div>
            <input
              id="seo-keywords"
              value={keywords}
              onChange={(e) => update("keywords", e.target.value)}
              placeholder={defaults.keywords?.join(", ") || "tour, travel, holiday packages"}
              className={inputClass}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-dash-muted">Separate keywords with commas.</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase text-dash-muted">Search result preview</p>
            <div className="rounded-xl border border-dash-border bg-dash-bg/40 p-4">
              <p className="truncate text-xs text-emerald-700">{SITE_URL}{page.path === "/" ? "" : page.path}</p>
              <p className="mt-0.5 line-clamp-1 text-lg text-[#1a0dab]">{effectiveTitle}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-dash-body">{effectiveDescription}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

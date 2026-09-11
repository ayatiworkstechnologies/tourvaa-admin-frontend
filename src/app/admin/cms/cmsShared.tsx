"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuPlus as Plus, LuTrash2 as Trash2, LuPencil as Pencil, LuCheck as Check, LuRefreshCw as RefreshCw, LuChevronDown as ChevronDown } from "react-icons/lu";
import api from "@/lib/api/client";
import ActionModal from "@/components/operations/ActionModal";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";

// ---- generic item type ---------------------------------------------------
type CmsItem = Record<string, unknown> & { id: number };

function getStringValue(item: CmsItem, key: string) {
  const value = item[key];
  return typeof value === "string" ? value : "";
}

function renderImagePreview(item: CmsItem, key: string, label: string) {
  const src = getStringValue(item, key);
  if (!src) {
    return <span className="text-xs font-semibold text-dash-subtle">No image</span>;
  }

  return (
    <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-dash-border bg-dash-bg">
      <Image src={src} alt={label} fill unoptimized className="object-cover" sizes="96px" />
    </div>
  );
}
// ---- tab definitions -----------------------------------------------------
type FieldOption = string | { value: string; label: string };

export type TabConfig = {
  key: string;
  label: string;
  endpoint: string;
  columns: { key: string; header: string; render?: (item: CmsItem) => React.ReactNode; className?: string }[];
  formFields: { key: string; label: string; type: "text" | "textarea" | "select" | "url" | "number" | "asset" | "video"; options?: FieldOption[]; required?: boolean }[];
  createMethod?: "post" | "put";
  updateMethod?: "put" | "patch";
  updatePath?: "item" | "collection";
  canEdit?: boolean;
  canDelete?: boolean;
};

// A "block" tab edits a single key/JSON record (GET/PUT /cms/content-blocks/{blockKey})
// instead of a list of rows - used for one-off homepage sections that don't
// need their own table (hero extras, About Tourvaa, blog teaser, transfers banner).
type BlockFieldType = "text" | "textarea" | "url" | "number" | "asset";
export type ContentBlockTabConfig = {
  key: string;
  label: string;
  blockKey: string;
  fields: { key: string; label: string; type: BlockFieldType; hint?: string }[];
};


export const TAB_DESCRIPTIONS: Record<string, string> = {
  banners: "The homepage hero: background banners/video, the trust-rating badge, and the promotional offer strip.",
  "tours-on-deals": "Tours shown in the homepage Top Deals section, with deal labels and sort order.",
  "popular-tours": "Tours shown in the homepage Trending Tour Packages section. Only tours with an active discount can be picked.",
  "handpicked-tours": "Tours shown in the homepage Handpicked Tours for You section - a separate curated list from Trending Tour Packages.",
  "popular-destinations": "Country images shown in Countries Worth Exploring (the country list itself is calculated automatically from real tour counts).",
  "favourite-countries": "The editorial country list and snippet copy shown in the homepage Favourite Countries section.",
  "country-pages": "Override the hero banner, showcase panel, and SEO title/description for each country's dynamic /tours/{country} landing page. Countries without a row here use auto-generated content.",
  "customer-reviews": "Customer testimonials shown in the homepage Testimonials section.",
  "help-centre": "Questions and answers shown in the homepage FAQ section.",
  "hero-extras": "The trust-rating badge and the promotional offer strip shown over the homepage hero banner.",
  "about-section": "The About Tourvaa banner shown on the homepage.",
  "blog-teaser": "The blog teaser banner shown on the homepage, linking through to the Blog.",
  "airport-transfer": "The Book Your Airport Transfers banner shown on the homepage.",
  "travel-support": "The 24/7 Travel Support banner shown on the homepage.",
  "newsletter-banner": "The newsletter signup banner shown at the bottom of the homepage.",
  footer: "The public site footer's link sections (Support, Our Company, Login) - sections and links, each independently enable/disable-able and orderable.",
  "cms-pages": "Create standalone pages with their own URL, content, and SEO details. Published pages become live at /{slug} and automatically appear as a footer link if assigned to a section - draft pages are never shown publicly.",
};
export const TABS: TabConfig[] = [
  {
    key: "banners",
    label: "Hero",
    endpoint: "/cms/homepage-banners",
    columns: [
      { key: "image", header: "Preview", render: (item) => renderImagePreview(item, "image", "Banner image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "subtitle", header: "Subtitle" },
      { key: "video", header: "Video", render: (item) => (getStringValue(item, "video") ? "Yes" : "-") },
      { key: "is_active", header: "Active" },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "image", label: "Image (add this or a video below - at least one is required)", type: "asset" },
      { key: "video", label: "Video (add this or an image above - plays instead of the image when set)", type: "video" },
      { key: "cta_url", label: "CTA URL", type: "url" },
      { key: "cta_text", label: "CTA Text", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "popular-tours",
    label: "Trending Tour Packages",
    endpoint: "/cms/popular-tours",
    canEdit: false,
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour (discounted only)", type: "select", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "handpicked-tours",
    label: "Handpicked",
    endpoint: "/cms/handpicked-tours",
    canEdit: false,
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour (discounted only)", type: "select", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "tours-on-deals",
    label: "Top Deals",
    endpoint: "/cms/tours-on-deals",
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "deal_label", header: "Deal Label" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour", type: "select", required: true },
      { key: "deal_label", label: "Deal Label", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "popular-destinations",
    label: "Countries",
    endpoint: "/cms/popular-destinations",
    columns: [
      { key: "image", header: "Preview", render: (item) => renderImagePreview(item, "image", "Destination image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "country_id", header: "Country ID" },
      { key: "city_id", header: "City ID" },
    ],
    formFields: [
      { key: "title", label: "Title (must match country name)", type: "text", required: true },
      { key: "country_id", label: "Country", type: "number" },
      { key: "image", label: "Image", type: "asset" },
      { key: "city_id", label: "City", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "country-pages",
    label: "Country Pages",
    endpoint: "/cms/country-pages",
    columns: [
      { key: "hero_image", header: "Preview", render: (item) => renderImagePreview(item, "hero_image", "Hero image"), className: "w-32" },
      { key: "country_name", header: "Country" },
      { key: "hero_title", header: "Hero Title" },
      { key: "showcase_title", header: "Showcase Title" },
      { key: "is_active", header: "Active" },
    ],
    formFields: [
      { key: "country_id", label: "Country", type: "select", required: true },
      { key: "hero_title", label: "Hero Title (e.g. India Tours)", type: "text" },
      { key: "hero_description", label: "Hero Description", type: "textarea" },
      { key: "hero_image", label: "Hero Image", type: "asset" },
      { key: "showcase_title", label: "Showcase Title (e.g. India Group Tours)", type: "text" },
      { key: "showcase_description", label: "Showcase Description", type: "textarea" },
      { key: "showcase_image", label: "Showcase Image", type: "asset" },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "text" },
    ],
  },
  {
    key: "favourite-countries",
    label: "Favourite Countries",
    endpoint: "/cms/favourite-countries",
    columns: [
      { key: "image", header: "Preview", render: (item) => renderImagePreview(item, "image", "Country image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "snippet", header: "Snippet" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "title", label: "Title (e.g. a country name)", type: "text", required: true },
      { key: "snippet", label: "Snippet", type: "textarea" },
      { key: "image", label: "Image", type: "asset" },
      { key: "href", label: "Link (e.g. /tours?country=Morocco)", type: "url" },
      { key: "country_id", label: "Country ID (optional)", type: "number" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "customer-reviews",
    label: "Testimonials",
    endpoint: "/cms/customer-reviews",
    columns: [
      { key: "reviewer_image", header: "Photo", render: (item) => renderImagePreview(item, "reviewer_image", "Reviewer image"), className: "w-32" },
      { key: "reviewer_name", header: "Reviewer" },
      { key: "rating", header: "Rating" },
      { key: "review_text", header: "Review" },
    ],
    formFields: [
      { key: "reviewer_name", label: "Reviewer Name", type: "text", required: true },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      { key: "review_text", label: "Review Text", type: "textarea" },
      { key: "reviewer_image", label: "Reviewer Image", type: "asset" },
      { key: "tour_name", label: "Tour Name", type: "text" },
    ],
  },
  {
    key: "help-centre",
    label: "FAQ",
    endpoint: "/cms/help-centre",
    columns: [
      { key: "question", header: "Question" },
      { key: "category", header: "Category" },
    ],
    formFields: [
      { key: "question", label: "Question", type: "text", required: true },
      { key: "answer", label: "Answer", type: "textarea", required: true },
      { key: "category", label: "Category", type: "text", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "cms-pages",
    label: "Pages",
    endpoint: "/cms/pages",
    columns: [
      { key: "title", header: "Title" },
      { key: "slug", header: "URL", render: (item) => `/${getStringValue(item, "slug")}` },
      { key: "status", header: "Status", render: (item) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStringValue(item, "status") === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {getStringValue(item, "status") === "published" ? "Published" : "Draft"}
        </span>
      ) },
      { key: "footer_section_id", header: "Footer Section" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "URL slug (auto-generated from title if left blank)", type: "text" },
      { key: "content", label: "Content (HTML)", type: "textarea" },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "text" },
      { key: "footer_section_id", label: "Footer Section", type: "select" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }], required: true },
    ],
  },
];

// Rendered together with the Banners list under the single "Hero" tab -
// the banner carousel, the trust-rating badge, and the offer strip are all
// part of the same homepage hero section, so admins manage them in one place
// instead of hunting across separate tabs.
export const HERO_EXTRAS_BLOCK: ContentBlockTabConfig = {
  key: "hero-extras",
  label: "Rating Badge & Offer Strip",
  blockKey: "hero_extras",
  fields: [
    { key: "rating", label: "Rating (e.g. 4.5)", type: "number" },
    { key: "review_count", label: "Review Count", type: "number" },
    { key: "review_source", label: "Review Source (e.g. Ayatiworks)", type: "text" },
    { key: "offer_text", label: "Offer Banner Text", type: "text", hint: "Leave blank to hide the offer strip." },
    { key: "offer_cta_text", label: "Offer CTA Text", type: "text" },
    { key: "offer_cta_url", label: "Offer CTA URL", type: "url" },
  ],
};

export const CONTENT_BLOCK_TABS: ContentBlockTabConfig[] = [
  {
    key: "about-section",
    label: "About Tourvaa",
    blockKey: "about_section",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "image", label: "Background Image", type: "asset" },
    ],
  },
  {
    key: "blog-teaser",
    label: "Blog Teaser",
    blockKey: "blog_teaser",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. BLOG)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "cta_text", label: "CTA Text", type: "text" },
      { key: "cta_url", label: "CTA URL", type: "url" },
      { key: "image", label: "Image", type: "asset" },
    ],
  },
  {
    key: "airport-transfer",
    label: "Airport Transfers",
    blockKey: "airport_transfer",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. PREMIUM TRANSFER PARTNER)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "features", label: "Feature pills (comma-separated)", type: "text" },
      { key: "cta_text", label: "CTA Text", type: "text" },
      { key: "cta_url", label: "CTA URL", type: "url", hint: "Leave blank to use the Brightlane link set in Settings." },
      { key: "image", label: "Image", type: "asset" },
    ],
  },
  {
    key: "travel-support",
    label: "Travel Support",
    blockKey: "travel_support",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. Offer Ends Soon)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "cta_text", label: "CTA Text", type: "text" },
      { key: "cta_url", label: "CTA URL", type: "url" },
      { key: "image", label: "Image", type: "asset" },
    ],
  },
  {
    key: "newsletter-banner",
    label: "Newsletter",
    blockKey: "newsletter_banner",
    fields: [
      { key: "badge", label: "Badge (e.g. Special Offers)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "image", label: "Image", type: "asset" },
    ],
  },
];

// ---- ContentBlockPanel ----------------------------------------------------
// Editor for a single key/JSON homepage content block (About Tourvaa, the
// blog teaser banner, etc) - unlike CmsTabPanel this isn't a list of rows,
// just one form that GETs/PUTs /cms/content-blocks/{blockKey}.
export function ContentBlockPanel({ tab }: { tab: ContentBlockTabConfig }) {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBlock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cms/content-blocks/${tab.blockKey}`);
      const data = (res.data?.data?.data ?? {}) as Record<string, unknown>;
      setValues(Object.fromEntries(tab.fields.map((f) => [f.key, data[f.key] != null ? String(data[f.key]) : ""])));
    } catch {
      toast.error(`Could not load ${tab.label}.`);
    } finally {
      setLoading(false);
    }
  }, [tab, toast]);

  useEffect(() => { void fetchBlock(); }, [fetchBlock]);

  const save = async () => {
    setSaving(true);
    try {
      // Every field is sent, blank or not - the PUT replaces the whole
      // block, and a field left blank on purpose (e.g. clearing the hero
      // offer strip so it stops showing) needs to persist as "" rather than
      // being silently dropped and falling back to the homepage default.
      const data: Record<string, unknown> = {};
      for (const f of tab.fields) {
        const raw = values[f.key] ?? "";
        data[f.key] = f.key === "features" ? raw.split(",").map((v) => v.trim()).filter(Boolean) : f.type === "number" ? (raw === "" ? "" : Number(raw)) : raw;
      }
      await api.put(`/cms/content-blocks/${tab.blockKey}`, { data });
      toast.success(`${tab.label} updated.`);
    } catch {
      toast.error(`Could not save ${tab.label}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-dash-border bg-white p-5">
        <h3 className="text-lg font-bold text-dash-text">{tab.label}</h3>
        <p className="mt-1 text-sm text-dash-muted">{TAB_DESCRIPTIONS[tab.key]}</p>
      </section>

      <section className="rounded-xl border border-dash-border bg-white p-5">
        {loading ? (
          <p className="text-sm text-dash-muted">Loading...</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {tab.fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" || f.type === "asset" ? "sm:col-span-2" : ""}>
                  {f.type !== "asset" && (
                    <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">{f.label}</label>
                  )}
                  {f.hint && <p className="mb-1 text-xs text-dash-subtle">{f.hint}</p>}
                  {f.type === "asset" ? (
                    <AdminAssetUpload
                      label={f.label}
                      kind="asset"
                      value={values[f.key] ?? ""}
                      onChange={(value) => setValues((v) => ({ ...v, [f.key]: value }))}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="w-full resize-none rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                    />
                  ) : (
                    <input
                      type={f.type === "url" ? "url" : f.type === "number" ? "number" : "text"}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-dash-border pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
              >
                <Check size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ---- FooterPanel -----------------------------------------------------------
// Manages the public site footer's link sections (Support / Our Company /
// Login by default). Two-level shape (sections -> links) doesn't fit the
// flat CmsTabPanel/TabConfig above, so this is a bespoke panel - it reuses
// the same DataTable/ActionModal/status-toggle-pill conventions for
// consistency. Public rendering lives in PublicFooter.tsx via GET /cms/footer.
type FooterSectionRow = CmsItem & { title: string; sort_order: number; is_active: boolean };
type FooterLinkRow = CmsItem & { section_id: number; label: string; url: string; open_in_new_tab: boolean; sort_order: number; is_active: boolean };

function StatusTogglePill({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`group inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
        active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      <span className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${active ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? "translate-x-3" : "translate-x-0"}`} />
      </span>
      <span>{active ? "Active" : "Inactive"}</span>
    </button>
  );
}

function FooterLinksTable({ sectionId }: { sectionId: number }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [links, setLinks] = useState<FooterLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FooterLinkRow | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/cms/footer-links", { params: { section_id: sectionId, limit: 100 } });
      setLinks(res.data?.items ?? []);
    } catch {
      toast.error("Could not load links.");
    } finally {
      setLoading(false);
    }
  }, [sectionId, toast]);

  useEffect(() => { void fetchLinks(); }, [fetchLinks]);

  const toggleActive = async (link: FooterLinkRow) => {
    const nextState = !link.is_active;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: nextState } : l)));
    try {
      await api.put(`/cms/footer-links/${link.id}`, { ...link, is_active: nextState });
    } catch {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: link.is_active } : l)));
      toast.error("Could not update status.");
    }
  };

  const deleteLink = async (id: number) => {
    if (!(await confirm({ title: "Delete link", message: "Delete this link?", confirmLabel: "Delete", danger: true }))) return;
    try {
      await api.delete(`/cms/footer-links/${id}`);
      toast.success("Link deleted.");
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      toast.error("Could not delete link.");
    }
  };

  const save = async (payload: Record<string, string | number>) => {
    setSaving(true);
    try {
      const body = {
        section_id: sectionId,
        label: String(payload.label ?? ""),
        url: String(payload.url ?? ""),
        open_in_new_tab: String(payload.open_in_new_tab) === "yes",
        sort_order: Number(payload.sort_order || 0),
      };
      if (editing) {
        await api.put(`/cms/footer-links/${editing.id}`, body);
        toast.success("Link updated.");
      } else {
        await api.post("/cms/footer-links", body);
        toast.success("Link added.");
      }
      setShowForm(false);
      setEditing(null);
      void fetchLinks();
    } catch {
      toast.error("Could not save link.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-dash-border bg-dash-bg p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-dash-text">Links</h4>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0369A1]"
        >
          <Plus size={13} /> Add Link
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-dash-muted">Loading...</p>
      ) : links.length === 0 ? (
        <p className="text-xs text-dash-muted">No links in this section yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dash-border bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-dash-bg-muted text-dash-muted">
              <tr>
                <th className="px-3 py-2 font-bold">Label</th>
                <th className="px-3 py-2 font-bold">URL</th>
                <th className="px-3 py-2 font-bold">New Tab</th>
                <th className="px-3 py-2 font-bold">Sort</th>
                <th className="px-3 py-2 font-bold">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-t border-dash-bg-muted">
                  <td className="px-3 py-2 text-dash-body">{link.label}</td>
                  <td className="px-3 py-2 text-dash-body">{link.url}</td>
                  <td className="px-3 py-2 text-dash-body">{link.open_in_new_tab ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-dash-body">{link.sort_order}</td>
                  <td className="px-3 py-2"><StatusTogglePill active={link.is_active} onToggle={() => void toggleActive(link)} /></td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" title="Edit" onClick={() => { setEditing(link); setShowForm(true); }} className="rounded-lg p-1.5 text-dash-brand hover:bg-[#F3F8FC]">
                      <Pencil size={13} />
                    </button>
                    <button type="button" title="Delete" onClick={() => void deleteLink(link.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ActionModal
        open={showForm}
        title={editing ? "Edit Link" : "Add Link"}
        saving={saving}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSubmit={save}
        initialValues={editing ? { label: editing.label, url: editing.url, open_in_new_tab: editing.open_in_new_tab ? "yes" : "no", sort_order: editing.sort_order } : { open_in_new_tab: "no", sort_order: 0 }}
        fields={[
          { name: "label", label: "Label", required: true },
          { name: "url", label: "URL", required: true },
          { name: "open_in_new_tab", label: "Open in new tab?", type: "select", options: [{ label: "No", value: "no" }, { label: "Yes", value: "yes" }] },
          { name: "sort_order", label: "Sort Order", type: "number" },
        ]}
      />
      {dialog}
    </div>
  );
}

export function FooterPanel() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [sections, setSections] = useState<FooterSectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FooterSectionRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/cms/footer-sections", { params: { limit: 100 } });
      setSections(res.data?.items ?? []);
    } catch {
      toast.error("Could not load footer sections.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchSections(); }, [fetchSections]);

  const toggleActive = async (section: FooterSectionRow) => {
    const nextState = !section.is_active;
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, is_active: nextState } : s)));
    try {
      await api.put(`/cms/footer-sections/${section.id}`, { ...section, is_active: nextState });
    } catch {
      setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, is_active: section.is_active } : s)));
      toast.error("Could not update status.");
    }
  };

  const deleteSection = async (id: number) => {
    if (!(await confirm({ title: "Delete footer section", message: "Delete this section? All of its links will be deleted too.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await api.delete(`/cms/footer-sections/${id}`);
      toast.success("Footer section deleted.");
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Could not delete section.");
    }
  };

  const save = async (payload: Record<string, string | number>) => {
    setSaving(true);
    try {
      const body = { title: String(payload.title ?? ""), sort_order: Number(payload.sort_order || 0) };
      if (editing) {
        await api.put(`/cms/footer-sections/${editing.id}`, { ...body, is_active: editing.is_active });
        toast.success("Section updated.");
      } else {
        await api.post("/cms/footer-sections", body);
        toast.success("Section added.");
      }
      setShowForm(false);
      setEditing(null);
      void fetchSections();
    } catch {
      toast.error("Could not save section.");
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<FooterSectionRow>[] = [
    { key: "title", header: "Section Title" },
    { key: "sort_order", header: "Sort Order" },
    { key: "is_active", header: "Status", render: (s) => <StatusTogglePill active={s.is_active} onToggle={() => void toggleActive(s)} /> },
    {
      key: "_actions",
      header: "",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" title="Manage links" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0284C7] hover:bg-[#EDF5FF]">
            {expandedId === s.id ? "Hide links" : "Manage links"}
          </button>
          <button type="button" title="Edit" onClick={() => { setEditing(s); setShowForm(true); }} className="rounded-lg p-1.5 text-dash-brand hover:bg-[#F3F8FC]">
            <Pencil size={15} />
          </button>
          <button type="button" title="Delete" onClick={() => void deleteSection(s.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-dash-border bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-dash-text">Footer</h3>
            <p className="mt-1 text-sm text-dash-muted">Manage the public site footer&apos;s link sections (e.g. Support, Our Company, Login) - add sections, edit titles, add/edit links, enable or disable either, and control display order. Changes reflect on the live site immediately.</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1]"
          >
            <Plus size={15} /> Add Section
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-dash-border bg-white p-3">
        <DataTable
          ariaLabel="Footer Sections"
          columns={columns}
          rows={sections}
          loading={loading}
          emptyTitle="No footer sections yet."
          renderExpandedRow={(section) =>
            expandedId === section.id ? (
              <tr>
                <td colSpan={columns.length} className="bg-dash-bg-muted px-5 py-4">
                  <FooterLinksTable sectionId={section.id} />
                </td>
              </tr>
            ) : null
          }
        />
      </section>

      <ActionModal
        open={showForm}
        title={editing ? "Edit Section" : "Add Section"}
        saving={saving}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSubmit={save}
        initialValues={editing ? { title: editing.title, sort_order: editing.sort_order } : { sort_order: 0 }}
        fields={[
          { name: "title", label: "Section Title", required: true },
          { name: "sort_order", label: "Sort Order", type: "number" },
        ]}
      />
      {dialog}
    </div>
  );
}

// ---- TourPickerSelect ------------------------------------------------------
// A native <select> can't render an image per <option>, so the "Tour" field
// on tour-picker tabs (Trending/Handpicked/Top Deals) uses this custom
// dropdown instead, showing each tour's banner thumbnail next to its title.
function TourPickerSelect({
  options,
  images,
  value,
  onChange,
}: {
  options: FieldOption[];
  images: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find((opt) => (typeof opt === "string" ? opt : opt.value) === value);
  const selectedLabel = selected ? (typeof selected === "string" ? selected : selected.label) : "Select...";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-dash-border px-3 py-2.5 text-left text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
      >
        <span className={value ? "text-dash-text" : "text-dash-subtle"}>{selectedLabel}</span>
        <ChevronDown size={16} className={`shrink-0 text-dash-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-dash-border bg-white p-1.5 shadow-lg">
          {options.length === 0 && <p className="px-3 py-2 text-xs text-dash-muted">No tours available.</p>}
          {options.map((opt) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            const src = images[optValue];
            return (
              <button
                key={optValue}
                type="button"
                onClick={() => {
                  onChange(optValue);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                  optValue === value ? "bg-[#EDF5FF] font-bold text-[#0369A1]" : "text-dash-body hover:bg-dash-bg"
                }`}
              >
                {src ? (
                  <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md border border-dash-border bg-dash-bg">
                    <Image src={src} alt="" fill unoptimized className="object-cover" sizes="56px" />
                  </span>
                ) : (
                  <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border border-dash-border bg-dash-bg text-[9px] font-semibold text-dash-subtle">
                    No img
                  </span>
                )}
                <span className="line-clamp-2">{optLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- CmsTabPanel ---------------------------------------------------------
export function CmsTabPanel({ tab }: { tab: TabConfig }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<CmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CmsItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tourOptions, setTourOptions] = useState<FieldOption[]>([]);
  const [tourImages, setTourImages] = useState<Record<string, string>>({});
  const [countryOptions, setCountryOptions] = useState<{ id: number; name: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ id: number; name: string }[]>([]);
  const [footerSectionOptions, setFooterSectionOptions] = useState<{ id: number; title: string }[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const isDestinationTab = tab.endpoint === "/cms/popular-destinations";
  const isCountryPageTab = tab.endpoint === "/cms/country-pages";
  const isCmsPageTab = tab.endpoint === "/cms/pages";
  const selectedCountryId = formValues.country_id ?? "";

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(tab.endpoint);
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : data.items ?? []);
      setPage(1);
    } catch {
      toast.error(`Could not load ${tab.label}.`);
    } finally {
      setLoading(false);
    }
  }, [tab.endpoint, tab.label, toast]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);
  useEffect(() => {
    if (tab.endpoint !== "/cms/popular-tours" && tab.endpoint !== "/cms/handpicked-tours" && tab.endpoint !== "/cms/tours-on-deals") return;

    let cancelled = false;
    api.get("/tours", { params: { page: 1, limit: 200 } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data?.items ?? res.data ?? [];
        const rows: CmsItem[] = Array.isArray(data) ? data : data.items ?? [];
        // "Trending Tour Packages" and "Handpicked" are both only ever filled
        // with discounted tours (each has its own separate pinned list).
        const filteredRows = tab.endpoint === "/cms/popular-tours" || tab.endpoint === "/cms/handpicked-tours"
          ? rows.filter((tour) => typeof tour.discount_percentage === "number" && tour.discount_percentage > 0)
          : rows;
        setTourOptions(filteredRows.map((tour: CmsItem) => {
          const id = String(tour.id ?? "");
          const title = typeof tour.title === "string" ? tour.title : `Tour #${id}`;
          const code = typeof tour.tour_code === "string" && tour.tour_code ? `${tour.tour_code} - ` : "";
          const discount = typeof tour.discount_percentage === "number" && tour.discount_percentage > 0 ? ` (-${tour.discount_percentage}%)` : "";
          return { value: id, label: `${code}${title}${discount}` };
        }).filter((option: { value: string }) => option.value));
        setTourImages(Object.fromEntries(
          rows
            .filter((tour) => typeof tour.banner_image === "string" && tour.banner_image)
            .map((tour) => [String(tour.id ?? ""), tour.banner_image as string])
        ));
      })
      .catch(() => {
        if (!cancelled) {
          setTourOptions([]);
          setTourImages({});
        }
      });

    return () => { cancelled = true; };
  }, [tab.endpoint]);

  useEffect(() => {
    if (!isDestinationTab && !isCountryPageTab) return;
    let cancelled = false;
    api.get("/geo/countries")
      .then((res) => { if (!cancelled) setCountryOptions(res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setCountryOptions([]); });
    return () => { cancelled = true; };
  }, [isDestinationTab, isCountryPageTab]);

  useEffect(() => {
    if (!isDestinationTab) return;
    if (!selectedCountryId) { setCityOptions([]); return; }
    let cancelled = false;
    api.get("/geo/cities", { params: { country_id: selectedCountryId } })
      .then((res) => { if (!cancelled) setCityOptions(res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setCityOptions([]); });
    return () => { cancelled = true; };
  }, [isDestinationTab, selectedCountryId]);

  useEffect(() => {
    if (!isCmsPageTab) return;
    let cancelled = false;
    api.get("/cms/footer-sections", { params: { limit: 100 } })
      .then((res) => { if (!cancelled) setFooterSectionOptions(res.data?.items ?? []); })
      .catch(() => { if (!cancelled) setFooterSectionOptions([]); });
    return () => { cancelled = true; };
  }, [isCmsPageTab]);

  const openCreate = () => {
    setEditingItem(null);
    setFormValues(Object.fromEntries(tab.formFields.map(f => [f.key, ""])));
    setShowForm(true);
  };

  const openEdit = (item: CmsItem) => {
    setEditingItem(item);
    setFormValues(Object.fromEntries(tab.formFields.map(f => [f.key, item[f.key] != null ? String(item[f.key]) : ""])));
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingItem(null); setFormValues({}); };

  const save = async () => {
    const required = tab.formFields.filter(f => f.required);
    for (const f of required) {
      if (!formValues[f.key]?.trim()) {
        toast.error(`${f.label} is required.`);
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      for (const f of tab.formFields) {
        if (formValues[f.key] !== "") {
          body[f.key] = f.key === "tags"
            ? formValues[f.key].split(",").map((tag) => tag.trim()).filter(Boolean)
            : f.type === "number" || f.key.endsWith("_id") ? Number(formValues[f.key]) : formValues[f.key];
        }
      }
      if (editingItem) {
        const method = tab.updateMethod ?? "put";
        const url = tab.updatePath === "collection" ? tab.endpoint : `${tab.endpoint}/${editingItem.id}`;
        await api[method](url, body);
        toast.success(`${tab.label} updated.`);
      } else {
        const method = tab.createMethod ?? "post";
        await api[method](tab.endpoint, body);
        toast.success(`${tab.label} created.`);
      }
      closeForm();
      void fetchItems();
    } catch (error: unknown) {
      const message = typeof error === "object" && error !== null && "response" in error
        ? String((error as { response?: { data?: { message?: string; detail?: string } } }).response?.data?.message ?? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? `Could not save ${tab.label}.`)
        : `Could not save ${tab.label}.`;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!(await confirm({ title: "Delete item", message: "Delete this item?", confirmLabel: "Delete", danger: true }))) return;
    setDeletingId(id);
    try {
      await api.delete(`${tab.endpoint}/${id}`);
      toast.success("Item deleted.");
      setItems(prev => prev.filter(x => x.id !== id));
    } catch {
      toast.error("Could not delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (item: CmsItem) => {
    const nextState = !item.is_active;
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, is_active: nextState } : x))
    );
    try {
      await api.put(`${tab.endpoint}/${item.id}`, {
        ...item,
        is_active: nextState,
      });
      toast.success(`${getStringValue(item, "title") || tab.label} is now ${nextState ? "Active" : "Inactive"}.`);
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, is_active: item.is_active } : x))
      );
      toast.error("Could not update status.");
    }
  };

  const isTourPickerTab = tab.endpoint === "/cms/popular-tours" || tab.endpoint === "/cms/handpicked-tours" || tab.endpoint === "/cms/tours-on-deals";

  const columns: DataTableColumn<CmsItem>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * pageSize + index + 1,
    },
    ...(isTourPickerTab
      ? [
          {
            key: "tour_image",
            header: "Preview",
            className: "w-32",
            render: (item: CmsItem) => {
              const src = tourImages[String(item.tour_id ?? "")];
              return src ? (
                <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-dash-border bg-dash-bg">
                  <Image src={src} alt={getStringValue(item, "tour_title") || "Tour"} fill unoptimized className="object-cover" sizes="96px" />
                </div>
              ) : (
                <span className="text-xs font-semibold text-dash-subtle">No image</span>
              );
            },
          },
        ]
      : []),
    ...tab.columns.map((col) => ({
      key: col.key,
      header: col.header,
      className: col.className ? `${col.className} text-dash-body` : "text-dash-body",
      render: (item: CmsItem) => {
        if (col.key === "is_active") {
          const isActive = Boolean(item.is_active);
          return (
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={(e) => {
                e.stopPropagation();
                void toggleActive(item);
              }}
              className={`group inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <span
                className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </span>
              <span>{isActive ? "Active" : "Inactive"}</span>
            </button>
          );
        }
        return col.render ? col.render(item) : (
          <span className="line-clamp-2">
            {item[col.key] != null ? String(item[col.key]) : "-"}
          </span>
        );
      },
    })),
  ];

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  const description = TAB_DESCRIPTIONS[tab.key] ?? "Manage this website content section.";
  const visibleFieldCount = tab.formFields.length;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-dash-border bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-dash-text">{tab.label}</h3>
              <span className="rounded-full bg-[#EDF5FF] px-2.5 py-1 text-xs font-bold text-[#0369A1]">
                {loading ? "Loading" : `${items.length} item${items.length === 1 ? "" : "s"}`}
              </span>
            </div>
            <p className="mt-1 text-sm text-dash-muted">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchItems()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1]"
            >
              <Plus size={15} /> Add {tab.label}
            </button>
          </div>
        </div>
      </section>

      <ActionModal
        open={showForm}
        title={editingItem ? `Edit ${tab.label}` : `New ${tab.label}`}
        saving={saving}
        submitLabel={editingItem ? "Update" : "Create"}
        onClose={closeForm}
        onSubmit={() => void save()}
      >
        <div className="-mt-1 mb-4">
          <p className="text-sm text-dash-muted">{visibleFieldCount} fields in this section. Required fields are marked.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {tab.formFields.map(f => (
              <div key={f.key} className={f.type === "textarea" || f.type === "asset" || f.type === "video" ? "sm:col-span-2" : ""}>
                {f.type !== "asset" && f.type !== "video" && (
                  <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                    {f.label}{f.required && " *"}
                  </label>
                )}
                {f.type === "asset" || f.type === "video" ? (
                  <AdminAssetUpload
                    label={`${f.label}${f.required ? " *" : ""}`}
                    kind={f.type}
                    value={formValues[f.key] ?? ""}
                    onChange={(value) => setFormValues(v => ({ ...v, [f.key]: value }))}
                  />
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={5}
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  />
                ) : f.type === "select" && f.key === "tour_id" ? (
                  <TourPickerSelect
                    options={tourOptions}
                    images={tourImages}
                    value={formValues[f.key] ?? ""}
                    onChange={(value) => setFormValues(v => ({ ...v, [f.key]: value }))}
                  />
                ) : f.key === "country_id" && (isDestinationTab || isCountryPageTab) ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, country_id: e.target.value, city_id: "" }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  >
                    <option value="">Select a country...</option>
                    {countryOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : f.key === "city_id" && isDestinationTab ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    disabled={!selectedCountryId}
                    onChange={e => setFormValues(v => ({ ...v, city_id: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 disabled:cursor-not-allowed disabled:bg-dash-bg disabled:text-dash-subtle"
                  >
                    <option value="">{selectedCountryId ? "Select a city..." : "Select a country first"}</option>
                    {cityOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : f.key === "footer_section_id" && isCmsPageTab ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, footer_section_id: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  >
                    <option value="">- None (not shown in footer) -</option>
                    {footerSectionOptions.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                ) : f.type === "select" ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  >
                    <option value="">Select...</option>
                    {f.options?.map(opt => {
                      const value = typeof opt === "string" ? opt : opt.value;
                      const label = typeof opt === "string" ? opt : opt.label;
                      return <option key={value} value={value}>{label}</option>;
                    })}
                  </select>
                ) : (
                  <input
                    type={f.type === "url" ? "url" : f.type === "number" ? "number" : "text"}
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  />
                )}
              </div>
            ))}
        </div>
      </ActionModal>

      <section className="rounded-xl border border-dash-border bg-white p-4">
        <DataTable
          ariaLabel={`${tab.label} table`}
          columns={columns}
          rows={paginatedItems}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={items.length}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle={`No ${tab.label.toLowerCase()} yet`}
          emptyDescription={`Add ${tab.label.toLowerCase()} to publish content into this website section.`}
          actions={(item) => (
            <div className="flex items-center justify-end gap-2">
              {tab.canEdit !== false && (
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  aria-label="Edit"
                  title="Edit"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-sky-50 hover:text-dash-brand-hover"
                >
                  <Pencil size={15} />
                </button>
              )}
              {tab.canDelete !== false && (
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => void deleteItem(item.id)}
                  aria-label="Delete"
                  title="Delete"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        />
      </section>
      {dialog}
    </div>
  );
}

// ---- Section registry -----------------------------------------------------
export const FOOTER_TAB = { key: "footer", label: "Footer" };

export const ALL_TABS: { key: string; label: string }[] = [
  ...TABS.map((t) => ({ key: t.key, label: t.label })),
  ...CONTENT_BLOCK_TABS.map((t) => ({ key: t.key, label: t.label })),
  FOOTER_TAB,
];

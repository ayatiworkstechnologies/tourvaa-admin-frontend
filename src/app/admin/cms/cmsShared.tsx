"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuPlus as Plus, LuTrash2 as Trash2, LuPencil as Pencil, LuCheck as Check, LuRefreshCw as RefreshCw, LuChevronDown as ChevronDown, LuPercent as Percent, LuX as X, LuSearch as Search } from "react-icons/lu";
import api from "@/lib/api/client";
import ActionModal from "@/components/operations/ActionModal";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import PageSectionsBuilder from "@/components/admin/cms/PageSectionsBuilder";
import type { CmsPageBlock } from "@/components/public/CmsPageSections";
import Loader from "@/components/ui/Loader";

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
// ---- country multi-select (feature pills etc.) ---------------------------
// Same interaction pattern as TourFormPage's LanguageMultiSelect (search +
// checkbox list + removable chips) but sourced from the real /countries list
// instead of a static language table, and restricted to real countries only
// (no free-text "add custom" escape hatch) -- replaces a plain comma-
// separated text input for any field where the tags are meant to be countries.
function CountryMultiSelect({
  value,
  onChange,
  placeholder = "Select countries...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/countries", { params: { limit: 300 } })
      .then((res) => {
        if (!active) return;
        const items = (res.data?.items ?? res.data?.data ?? []) as { country_name?: string }[];
        setCountries(items.map((c) => c.country_name).filter((n): n is string => Boolean(n)).sort());
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedList = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleCountry = (name: string) => {
    const isSelected = selectedList.some((s) => s.toLowerCase() === name.toLowerCase());
    const updated = isSelected
      ? selectedList.filter((s) => s.toLowerCase() !== name.toLowerCase())
      : [...selectedList, name];
    onChange(updated.join(", "));
  };

  const removeCountry = (name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(selectedList.filter((s) => s.toLowerCase() !== name.toLowerCase()).join(", "));
  };

  const filtered = countries.filter((name) =>
    name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative block">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className="w-full min-h-[44px] rounded-xl border border-dash-border px-3 py-2 flex items-center justify-between gap-2 cursor-pointer select-none bg-white"
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          {selectedList.length === 0 ? (
            <span className="text-slate-400 text-sm">{placeholder}</span>
          ) : (
            selectedList.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200/90 px-2 py-0.5 text-xs font-semibold text-blue-700 shadow-2xs"
              >
                <span>{name}</span>
                <button
                  type="button"
                  onClick={(e) => removeCountry(name, e)}
                  className="rounded-full p-0.5 hover:bg-blue-200/70 text-blue-500 hover:text-blue-800 transition cursor-pointer"
                  aria-label={`Remove ${name}`}
                >
                  <X size={11} className="stroke-[2.5]" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-[#0284C7]" : ""}`} />
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl space-y-2.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-8 py-2 text-sm outline-none focus:border-[#0284C7] focus:bg-white focus:ring-2 focus:ring-[#0284C7]/10 transition"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <p className="py-4 text-center text-xs text-slate-400">Loading countries...</p>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No countries found.</p>
            ) : (
              filtered.map((name) => {
                const isSelected = selectedList.some((s) => s.toLowerCase() === name.toLowerCase());
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleCountry(name)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition cursor-pointer ${
                      isSelected ? "bg-blue-50/80 text-blue-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded border transition ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                      {isSelected && <Check size={12} className="stroke-[3]" />}
                    </span>
                    <span>{name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
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
  formFields: { key: string; label: string; type: "text" | "textarea" | "select" | "url" | "number" | "asset" | "video"; options?: FieldOption[]; required?: boolean; min?: number; max?: number; step?: number; maxLength?: number }[];
  createMethod?: "post" | "put";
  updateMethod?: "put" | "patch";
  updatePath?: "item" | "collection";
  canEdit?: boolean;
  canDelete?: boolean;
};

// A "block" tab edits a single key/JSON record (GET/PUT /cms/content-blocks/{blockKey})
// instead of a list of rows - used for one-off homepage sections that don't
// need their own table (hero extras, About Tourvaa, blog teaser, transfers banner).
type BlockFieldType = "text" | "textarea" | "url" | "number" | "asset" | "boolean" | "list" | "records" | "countries";
export type ContentBlockTabConfig = {
  key: string;
  label: string;
  blockKey: string;
  fields: {
    key: string;
    label: string;
    type: BlockFieldType;
    hint?: string;
    default?: string;
    // For type "records": the inputs of each repeated entry. "csv" edits an array as comma-separated text.
    // "asset" uploads an image (e.g. a team member photo or gallery image) and stores its URL.
    subfields?: { key: string; label: string; type: "text" | "textarea" | "csv" | "asset" }[];
  }[];
};


export const TAB_DESCRIPTIONS: Record<string, string> = {
  seo: "Meta title and description for each public page (Home, Tours, About, Contact, legal pages and more).",
  "destination-styles": "The travel style cards on the Destinations page (e.g. Alpine & Mountain Expeditions).",
  "destination-seasons": "The best-time-to-travel season cards on the Destinations page.",
  "tours-listing": "The global /tours page hero and results heading. Country-specific /tours/{country} content stays in Country Pages.",
  "trust-bar": "The dark bar at the very top of every page (e.g. Shop 2,500+ handpicked operators). Add, edit or remove highlights.",
  slogans: "The slogan line under the hero search box that rotates one at a time. Add as many slogans as you like.",
  "top-bar": "An optional announcement strip with a link. Leave the text blank to hide it.",
  "handpicked-heading": "The title above the Handpicked Tours carousel.",
  "countries-heading": "The title above the Countries Worth Exploring carousel.",
  "testimonials-heading": "The title and subtitle above the traveller testimonials.",
  "faq-heading": "The title above the homepage FAQ.",
  home: "Edit every homepage section in one place, with the live public homepage shown alongside.",
  banners: "The homepage hero: background banners/video, the trust-rating badge, and the promotional offer strip.",
  "tours-on-deals": "Tours shown in the homepage Top Deals section, with deal labels and sort order. Show/hide the whole section with its switch in the Home Page section list.",
  "popular-tours": "Tours shown in the homepage Trending Tour Packages section. Show/hide the whole section with its switch in the Home Page section list.",
  "handpicked-tours": "Tours shown in the homepage Handpicked Tours for You section - a curated list of tours for the homepage.",
  "popular-destinations": "Countries shown in Countries Worth Exploring - country name, rating, destination link, package count and display order.",
  "favourite-countries": "The editorial country list and snippet copy shown in the homepage Favourite Countries section.",
  "country-pages": "Country pages and destination guides, with a live preview. Override the hero banner, showcase panel, and SEO title/description for each country's dynamic /tours/{country} landing page. Countries without a row here use auto-generated content.",
  "country-destination-guide": "The full destination guide shown at /destinations/{country}: best time to visit, monsoon/season info, temperature, best places to visit, why visit, and travel info, per country.",
  "customer-reviews": "Customer testimonials shown in the homepage Testimonials section.",
  "help-centre": "Questions and answers shown in the homepage FAQ section.",
  "hero-extras": "The offer strip shown over the homepage hero banner.",
  "about-section": "The About Tourvaa banner shown on the homepage.",
  "blog-teaser": "The blog teaser banner shown on the homepage, linking through to the Blog.",
  "airport-transfer": "The Book Your Airport Transfers banner shown on the homepage.",
  "travel-support": "The 24/7 Travel Support banner shown on the homepage.",
  "newsletter-banner": "The newsletter signup banner shown at the bottom of the homepage.",
  footer: "The public site footer's link sections (Support, Our Company, Login) - sections and links, each independently enable/disable-able and orderable.",
  "social-links": "The social media icon links shown in the site footer. Any left blank keep showing a generic placeholder URL.",
  "cms-pages": "Create standalone pages with their own URL and SEO details. Build a modern designed page from Page Sections (hero, text, image + text, card grids, CTA), or fall back to plain HTML Content if you leave sections empty. Published pages become live at /{slug} and automatically appear as a footer link if assigned to a section - draft pages are never shown publicly.",
  about: "Edit every section of the About Us page (hero, story, gallery, stats, values, team, awards, CTA) in one place, with the live public page shown alongside.",
  contact: "Edit every section of the Contact Us page (hero, support cards, contact channels, FAQs, partner cards, offices) in one place, with the live public page shown alongside.",
  "about-page-hero": "The top banner on the About Us page: badge, heading, subtitle and background image.",
  "about-page-story": "The Our Philosophy & Mission narrative and founder quote on the About Us page.",
  "about-page-gallery": "The photo mosaic gallery on the About Us page.",
  "about-page-metrics": "The stat cards (years of excellence, expeditions, travelers, rating) on the About Us page.",
  "about-page-values": "The Why Discerning Travelers Choose Us value cards on the About Us page.",
  "about-page-team": "The Meet the Explorers team member cards on the About Us page.",
  "about-page-awards": "The awards & industry recognition cards on the About Us page.",
  "about-page-cta": "The Ready to Start Your Journey banner at the bottom of the About Us page.",
  "contact-page-hero": "The top banner on the Contact Us page: badge, heading, subtitle and background image.",
  "contact-page-support-cards": "The three support cards (Existing Booking, Live Chat, Help Center) on the Contact Us page.",
  "contact-page-channels": "The direct contact channels panel (phone, hours, guarantee) next to the inquiry form on the Contact Us page.",
  "contact-page-faqs": "The frequently asked questions on the Contact Us page.",
  "contact-page-partners": "The partner solution cards (Operators, Travel Agents, Distribution, Media) on the Contact Us page.",
  "contact-page-offices": "The regional office contact details on the Contact Us page.",
  terms: "Edit the Terms & Conditions page - header, intro, and every numbered clause - with the live public page shown alongside.",
  "privacy-policy": "Edit the Privacy Policy page - header, intro, and every numbered clause - with the live public page shown alongside.",
  "cookie-policy": "Edit the Cookie Policy page - header, intro, and every numbered clause - with the live public page shown alongside.",
  "terms-page-hero": "The Terms & Conditions page title, subtitle, intro note, and publish toggle.",
  "terms-page-sections": "The numbered clauses on the Terms & Conditions page.",
  "privacy-page-hero": "The Privacy Policy page title, subtitle, intro note, and publish toggle.",
  "privacy-page-sections": "The numbered clauses on the Privacy Policy page.",
  "cookie-page-hero": "The Cookie Policy page title, subtitle, intro note, and publish toggle.",
  "cookie-page-sections": "The numbered clauses on the Cookie Policy page.",
  "travel-advice": "Edit every section of the Travel Advice page (hero, categories, articles, checklist) in one place, with the live public page shown alongside.",
  "travel-advice-hero": "The top banner on the Travel Advice page, plus its publish toggle.",
  "travel-advice-categories": "The advice category cards on the Travel Advice page.",
  "travel-advice-articles": "The featured article cards on the Travel Advice page.",
  "travel-advice-essentials": "The pre-flight checklist cards on the Travel Advice page.",
  "supplier-portal": "Edit every section of the Supplier Portal landing page in one place, with the live public page shown alongside. The earnings calculator stays interactive and isn't editable here.",
  "agent-portal": "Edit every section of the Agent Portal landing page in one place, with the live public page shown alongside. The commission calculator stays interactive and isn't editable here.",
  "affiliate-portal": "Edit every section of the Affiliate Portal landing page in one place, with the live public page shown alongside.",
  "supplier-portal-hero": "The Supplier Portal hero banner and publish toggle.",
  "supplier-portal-metrics": "The metrics strip on the Supplier Portal page.",
  "supplier-portal-features": "The capability cards on the Supplier Portal page.",
  "supplier-portal-steps": "The \"From sign-up to payout\" steps on the Supplier Portal page.",
  "supplier-portal-documents": "The verification document cards on the Supplier Portal page.",
  "supplier-portal-expectations": "The \"What we expect from partners\" cards on the Supplier Portal page.",
  "supplier-portal-faqs": "The FAQs on the Supplier Portal page.",
  "supplier-portal-cta": "The bottom call-to-action banner on the Supplier Portal page.",
  "supplier-portal-footer": "The full Supplier Portal footer. Each link uses one line: Link label | /link-url.",
  "agent-portal-hero": "The Agent Portal hero banner and publish toggle.",
  "agent-portal-metrics": "The metrics strip on the Agent Portal page.",
  "agent-portal-features": "The tool cards on the Agent Portal page.",
  "agent-portal-steps": "The \"From registration to bookings\" steps on the Agent Portal page.",
  "agent-portal-documents": "The verification document cards on the Agent Portal page.",
  "agent-portal-expectations": "The \"What we expect from partners\" cards on the Agent Portal page.",
  "agent-portal-faqs": "The FAQs on the Agent Portal page.",
  "agent-portal-cta": "The bottom call-to-action banner on the Agent Portal page.",
  "agent-portal-footer": "The full Agent Portal footer. Each link uses one line: Link label | /link-url.",
  "affiliate-portal-hero": "The Affiliate Portal hero banner and publish toggle.",
  "affiliate-portal-stats": "The stats strip on the Affiliate Portal page.",
  "affiliate-portal-perks": "The \"Why join as an affiliate\" perk cards on the Affiliate Portal page.",
  "affiliate-portal-ideal-for": "The \"Ideal for\" list on the Affiliate Portal page.",
  "affiliate-portal-cta": "The bottom call-to-action banner on the Affiliate Portal page.",
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
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "sort_order", header: "Sort" },
      { key: "is_active", header: "Active" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour", type: "select", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "handpicked-tours",
    label: "Handpicked",
    endpoint: "/cms/handpicked-tours",
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "sort_order", header: "Sort" },
      { key: "is_active", header: "Active" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour", type: "select", required: true },
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
      { key: "title", header: "Country Name" },
      { key: "rating", header: "Rating" },
      { key: "href", header: "Destination Link" },
      { key: "package_count", header: "Package Count" },
      { key: "sort_order", header: "Order" },
    ],
    formFields: [
      { key: "country_id", label: "Country Name", type: "select", required: true },
      { key: "rating", label: "Rating (0-5)", type: "number", min: 0, max: 5, step: 0.1 },
      { key: "href", label: "Destination Link", type: "text" },
      { key: "package_count", label: "Package Count", type: "number", min: 0, step: 1 },
      { key: "sort_order", label: "Order", type: "number", min: 0, step: 1 },
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
      { key: "hero_title", label: "Hero Title (e.g. India Tours)", type: "text", maxLength: 200 },
      { key: "hero_description", label: "Hero Description", type: "textarea" },
      { key: "hero_image", label: "Hero Image", type: "asset" },
      { key: "showcase_title", label: "Showcase Title (e.g. India Group Tours)", type: "text", maxLength: 200 },
      { key: "showcase_description", label: "Showcase Description", type: "textarea" },
      { key: "showcase_image", label: "Showcase Image", type: "asset" },
      { key: "seo_title", label: "SEO Title", type: "text", maxLength: 200 },
      { key: "seo_description", label: "SEO Description", type: "textarea", maxLength: 400 },
    ],
  },
  {
    key: "favourite-countries",
    label: "Favourite Countries",
    endpoint: "/cms/favourite-countries",
    columns: [
      { key: "image", header: "Preview", render: (item) => renderImagePreview(item, "image", "Country image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "snippet", header: "Description" },
      { key: "sort_order", header: "Sort" },
      { key: "is_active", header: "Active" },
    ],
    formFields: [
      { key: "title", label: "Title (e.g. a country name)", type: "text", required: true },
      { key: "country_id", label: "Country", type: "select" },
      { key: "image", label: "Country Image", type: "asset" },
      { key: "snippet", label: "Description", type: "textarea" },
      { key: "href", label: "Destination Link (e.g. /destinations/egypt)", type: "url" },
      { key: "sort_order", label: "Display Order", type: "number" },
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
      { key: "country", label: "Reviewer Location/Country (e.g. Kerala, India)", type: "text" },
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
      { key: "content", label: "Content (HTML) - only used as a fallback when no Page Sections are added below", type: "textarea" },
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
  label: "Hero Offer Strip",
  blockKey: "hero_extras",
  fields: [
    { key: "offer_label", label: "Label (e.g. OFFER)", type: "text", hint: "The small pill on the left of the strip. Defaults to OFFER." },
    { key: "offer_text", label: "Offer Text", type: "text", hint: "Leave blank to hide the offer strip." },
    { key: "offer_cta_text", label: "Link Text (optional)", type: "text" },
    { key: "offer_cta_url", label: "Link URL", type: "url", hint: "Where the strip goes when clicked. Defaults to /deals." },
  ],
};

// Rendered together with the Top Deals / Trending Tour Packages list tabs -
// the section's heading copy. Its on/off `enabled` flag lives in the same
// block but is switched from the Home Page section list (HomePageEditor).
export const TOP_DEALS_VISIBILITY_BLOCK: ContentBlockTabConfig = {
  key: "top-deals-visibility",
  label: "Top Deals Section Heading",
  blockKey: "top_deals_section",
  fields: [
    { key: "badge", label: "Badge (e.g. Offer Ends Soon)", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "cta_text", label: "Button Text (e.g. Explore Deals)", type: "text" },
    { key: "cta_url", label: "Button Link", type: "url", hint: "Defaults to /deals." },
    { key: "view_all_text", label: "\"View all deals\" Link Text", type: "text" },
  ],
};

export const TRENDING_VISIBILITY_BLOCK: ContentBlockTabConfig = {
  key: "trending-visibility",
  label: "Trending Section Heading",
  blockKey: "trending_section",
  fields: [
    { key: "title", label: "Section Title", type: "text" },
  ],
};

// Rendered together with the Favourite Countries list tab - the section's
// own heading/subtitle (shown above the country cards) had no CMS field at
// all until now; FavouriteCountriesSection.tsx falls back to hardcoded
// copy when this block is empty.
export const FAVOURITE_COUNTRIES_HEADING_BLOCK: ContentBlockTabConfig = {
  key: "favourite-countries-heading",
  label: "Favourite Countries Section Heading",
  blockKey: "favourite_countries_section",
  fields: [
    { key: "title", label: "Section Title", type: "text" },
    { key: "subtitle", label: "Section Subtitle", type: "textarea" },
  ],
};

export const CONTENT_BLOCK_TABS: ContentBlockTabConfig[] = [
  {
    key: "tours-listing",
    label: "Tours Listing Page",
    blockKey: "tours_listing",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "text" },
      { key: "hero_description", label: "Hero Description", type: "textarea" },
      { key: "hero_image", label: "Hero Background Image", type: "asset" },
      { key: "hero_rating", label: "Hero Rating", type: "text" },
      { key: "hero_reviews", label: "Hero Review Text", type: "text" },
      { key: "hero_group_tours", label: "Hero Group Tours Text", type: "text" },
      { key: "hero_private_tours", label: "Hero Private Tours Text", type: "text" },
      { key: "hero_destinations", label: "Hero Destinations Text", type: "text" },
      { key: "results_heading", label: "Results Heading", type: "text", hint: "Shown above the live tour count and category filters." },
      { key: "results_context", label: "Results Context", type: "text", hint: "Shown after the live result count." },
      { key: "showcase_title", label: "Showcase Title", type: "text" },
      { key: "showcase_description", label: "Showcase Description", type: "textarea" },
      { key: "showcase_image", label: "Showcase Image", type: "asset" },
    ],
  },
  {
    key: "destination-styles",
    label: "Destinations: Travel Styles",
    blockKey: "destination_styles",
    fields: [
      {
        key: "items",
        label: "Travel style cards",
        type: "records",
        hint: "Shown on the Destinations page. Leave empty to use the built-in cards.",
        subfields: [
          { key: "title", label: "Title", type: "text" },
          { key: "subtitle", label: "Subtitle", type: "textarea" },
          { key: "countries", label: "Popular countries (e.g. Thailand • Greece)", type: "text" },
          { key: "badge", label: "Badge (e.g. Sun & Sea)", type: "text" },
          { key: "image", label: "Image URL", type: "text" },
          { key: "href", label: "Link (e.g. /tours?tag=Beach)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "destination-seasons",
    label: "Destinations: Best Time to Travel",
    blockKey: "destination_seasons",
    fields: [
      {
        key: "items",
        label: "Season cards",
        type: "records",
        hint: "Shown on the Destinations page. Leave empty to use the built-in seasons.",
        subfields: [
          { key: "season", label: "Season (e.g. Spring (March - May))", type: "text" },
          { key: "tagline", label: "Tagline", type: "textarea" },
          { key: "topPicks", label: "Top picks (comma-separated)", type: "csv" },
          { key: "icon", label: "Icon (an emoji, e.g. 🌸)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "trust-bar",
    label: "Top Bar (trust highlights)",
    blockKey: "trust_bar",
    fields: [
      { key: "items", label: "Highlights (shown left to right)", type: "list", hint: "Wrap words in **double asterisks** to make them bold, e.g. **24/7** customer support. Leave empty to use the defaults." },
    ],
  },
  {
    key: "slogans",
    label: "Slogans (under search)",
    blockKey: "slogans",
    fields: [
      { key: "items", label: "Slogans (rotate one at a time)", type: "list", hint: "Use **double asterisks** for bold. Click + Add for another slogan. Leave empty to use the defaults." },
    ],
  },
  {
    key: "top-bar",
    label: "Announcement Bar",
    blockKey: "top_bar",
    fields: [
      { key: "text", label: "Announcement Text", type: "text", hint: "Leave blank to fall back to the active promotional popup, if any." },
      { key: "cta_text", label: "Link Text", type: "text" },
      { key: "cta_url", label: "Link URL", type: "url" },
    ],
  },
  {
    key: "handpicked-heading",
    label: "Handpicked Tours Heading",
    blockKey: "handpicked_section",
    fields: [{ key: "title", label: "Section Title", type: "text" }],
  },
  {
    key: "countries-heading",
    label: "Countries Worth Exploring Heading",
    blockKey: "countries_section",
    fields: [{ key: "title", label: "Section Title", type: "text" }],
  },
  {
    key: "testimonials-heading",
    label: "Testimonials Heading",
    blockKey: "testimonials_section",
    fields: [
      { key: "title", label: "Section Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
    ],
  },
  {
    key: "faq-heading",
    label: "FAQ Heading",
    blockKey: "faq_section",
    fields: [{ key: "title", label: "Section Title", type: "text" }],
  },
  {
    key: "about-section",
    label: "About Tourvaa",
    blockKey: "about_section",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "image", label: "Background Image", type: "asset" },
      { key: "cta_text", label: "CTA Button Text", type: "text", hint: "Defaults to \"Explore About Tourvaa\" if left blank." },
      { key: "cta_url", label: "CTA Button Link", type: "url", hint: "Defaults to /about if left blank." },
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
      { key: "features", label: "Feature pills (countries shown as pills on the banner)", type: "countries" },
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
  {
    key: "social-links",
    label: "Social Media Links",
    blockKey: "social_links",
    fields: [
      { key: "facebook", label: "Facebook URL", type: "url", hint: "Shown in the site footer. Leave blank to keep the generic https://facebook.com placeholder." },
      { key: "instagram", label: "Instagram URL", type: "url" },
      { key: "youtube", label: "YouTube URL", type: "url" },
      { key: "whatsapp", label: "WhatsApp URL", type: "url" },
      { key: "twitter", label: "X (Twitter) URL", type: "url" },
      { key: "linkedin", label: "LinkedIn URL", type: "url" },
    ],
  },

  // ---- About Us page (see AboutPageEditor) ---------------------------------
  {
    key: "about-page-hero",
    label: "Hero Banner",
    blockKey: "about_page_hero",
    fields: [
      { key: "badge_label", label: "Badge Text (e.g. Our Story & Purpose)", type: "text" },
      { key: "badge_year", label: "Badge Year (e.g. Est. 2015)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "background_image", label: "Background Image", type: "asset" },
      { key: "rating_text", label: "Rating Badge (e.g. 4.9/5 Rating (3,200+ Reviews))", type: "text" },
      { key: "vetted_text", label: "Trust Badge (e.g. 100% Vetted Local Operators)", type: "text" },
    ],
  },
  {
    key: "about-page-story",
    label: "Our Story & Quote",
    blockKey: "about_page_story",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. OUR PHILOSOPHY & MISSION)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "quote_text", label: "Founder Quote", type: "textarea" },
      { key: "quote_author", label: "Quote Attribution (e.g. Arjun Mehta, Founder & Chief Explorer at Tourvaa)", type: "text" },
    ],
  },
  {
    key: "about-page-gallery",
    label: "Photo Gallery",
    blockKey: "about_page_gallery",
    fields: [
      {
        key: "items",
        label: "Gallery Photos",
        type: "records",
        hint: "Shown in the mosaic gallery below the story section. Leave empty to use the built-in photos.",
        subfields: [
          { key: "image", label: "Photo", type: "asset" },
          { key: "location", label: "Location Label (e.g. Bavaria, Germany)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "about-page-metrics",
    label: "Stats / Metrics",
    blockKey: "about_page_metrics",
    fields: [
      {
        key: "items",
        label: "Metric Cards",
        type: "records",
        hint: "Leave empty to use the built-in stats.",
        subfields: [
          { key: "value", label: "Value (e.g. 500+)", type: "text" },
          { key: "label", label: "Label (e.g. Curated Expeditions)", type: "text" },
          { key: "sub", label: "Subtext (e.g. Across 80+ countries worldwide)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "about-page-values",
    label: "Why Choose Us",
    blockKey: "about_page_values",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. THE TOURVAA DIFFERENCE)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "items",
        label: "Value Cards",
        type: "records",
        hint: "Leave empty to use the built-in cards.",
        subfields: [
          { key: "badge", label: "Badge (e.g. Direct Pricing)", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "about-page-team",
    label: "Our Team",
    blockKey: "about_page_team",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. OUR TEAM)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "items",
        label: "Team Members",
        type: "records",
        hint: "Leave empty to use the built-in team.",
        subfields: [
          { key: "photo", label: "Photo", type: "asset" },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "specialty", label: "Specialty Tag (e.g. 60+ Countries Explored)", type: "text" },
          { key: "bio", label: "Bio", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "about-page-awards",
    label: "Awards & Recognition",
    blockKey: "about_page_awards",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. CREDENTIALS & TRUST)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "items",
        label: "Awards",
        type: "records",
        hint: "Leave empty to use the built-in awards.",
        subfields: [
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Description", type: "text" },
        ],
      },
    ],
  },
  {
    key: "about-page-cta",
    label: "Bottom CTA",
    blockKey: "about_page_cta",
    fields: [
      { key: "badge_text", label: "Badge (e.g. Your Adventure Awaits)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "background_image", label: "Background Image", type: "asset" },
      { key: "primary_cta_text", label: "Primary Button Text", type: "text" },
      { key: "primary_cta_url", label: "Primary Button Link", type: "url", hint: "Defaults to /tours if left blank." },
      { key: "secondary_cta_text", label: "Secondary Button Text", type: "text" },
      { key: "secondary_cta_url", label: "Secondary Button Link", type: "url", hint: "Defaults to /contact if left blank." },
    ],
  },

  // ---- Contact Us page (see ContactPageEditor) -----------------------------
  {
    key: "contact-page-hero",
    label: "Hero Banner",
    blockKey: "contact_page_hero",
    fields: [
      { key: "badge_label", label: "Badge Text (e.g. 24/7 Global Traveler Concierge)", type: "text" },
      { key: "response_time_text", label: "Response Time Badge (e.g. Response < 2h)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "background_image", label: "Background Image", type: "asset" },
    ],
  },
  {
    key: "contact-page-support-cards",
    label: "Support Cards",
    blockKey: "contact_page_support_cards",
    fields: [
      {
        key: "items",
        label: "Support Cards (Existing Booking, Live Chat, Help Center, in order)",
        type: "records",
        hint: "Leave empty to use the built-in cards. Icons and buttons stay fixed to each card's position.",
        subfields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "contact-page-channels",
    label: "Contact Channels",
    blockKey: "contact_page_channels",
    fields: [
      { key: "badge_text", label: "Badge (e.g. Verified Concierge Support)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "phone_display", label: "Phone Number (displayed)", type: "text" },
      { key: "phone_href", label: "Phone Number (for the tel: link, digits only e.g. +6498879200)", type: "text" },
      { key: "phone_hint", label: "Phone Hint (e.g. Available 24/7 in English, French & Spanish)", type: "text" },
      { key: "hours_value", label: "Operating Hours (e.g. 24 Hours / 7 Days a Week)", type: "text" },
      { key: "hours_hint", label: "Hours Hint (e.g. Dedicated in-trip emergency dispatch line)", type: "text" },
      { key: "guarantee_title", label: "Guarantee Banner Title", type: "text" },
      { key: "guarantee_text", label: "Guarantee Banner Text", type: "text" },
    ],
  },
  {
    key: "contact-page-faqs",
    label: "FAQs",
    blockKey: "contact_page_faqs",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. INSTANT ANSWERS)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "items",
        label: "Questions",
        type: "records",
        hint: "Leave empty to use the built-in FAQs.",
        subfields: [
          { key: "category", label: "Category (e.g. RESERVATIONS)", type: "text" },
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "contact-page-partners",
    label: "Partner Cards",
    blockKey: "contact_page_partners",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. PARTNERSHIP CHANNELS)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "items",
        label: "Partner Cards (Operators, Travel Agents, Distribution, Media, in order)",
        type: "records",
        hint: "Leave empty to use the built-in cards. Images and links stay fixed to each card's position.",
        subfields: [
          { key: "badge", label: "Badge", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "contact-page-offices",
    label: "Our Offices",
    blockKey: "contact_page_offices",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. GLOBAL FOOTPRINT)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "items",
        label: "Office Details (New Zealand, Sri Lanka, India, in order)",
        type: "records",
        hint: "Leave empty to use the built-in office details. City, country and map position stay fixed per office.",
        subfields: [
          { key: "address_line1", label: "Address Line 1", type: "text" },
          { key: "address_line2", label: "Address Line 2", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
          { key: "hours", label: "Hours", type: "text" },
          { key: "timezone", label: "Time Zone", type: "text" },
        ],
      },
    ],
  },

  // ---- Legal pages (Terms / Privacy / Cookie) - see TermsPage / PrivacyPolicyPage / CookiePolicyPage ----
  ...(["terms", "privacy", "cookie"] as const).map((page) => ({
    key: `${page}-page-hero`,
    label: "Page Header",
    blockKey: `${page}_page_hero`,
    fields: [
      { key: "is_active", label: "Show this page on the public site", type: "boolean" as const, default: "true" },
      { key: "title", label: "Page Title", type: "text" as const },
      { key: "subtitle", label: "Subtitle", type: "textarea" as const },
      { key: "intro", label: "Intro Note (shown above the numbered clauses)", type: "textarea" as const },
    ],
  })),
  ...(["terms", "privacy", "cookie"] as const).map((page) => ({
    key: `${page}-page-sections`,
    label: "Clauses / Sections",
    blockKey: `${page}_page_sections`,
    fields: [
      {
        key: "items",
        label: "Numbered Sections",
        type: "records" as const,
        hint: "Leave empty to use the built-in legal text. Editing this list replaces ALL sections below - add a new entry to append a new clause without losing the others.",
        subfields: [
          { key: "title", label: "Section Title", type: "text" as const },
          { key: "body", label: "Body (one paragraph per line)", type: "textarea" as const },
        ],
      },
    ],
  })),

  // ---- Travel Advice page (see TravelAdvicePageEditor) ---------------------
  {
    key: "travel-advice-hero",
    label: "Hero Banner",
    blockKey: "travel_advice_hero",
    fields: [
      { key: "is_active", label: "Show this page on the public site", type: "boolean", default: "true" },
      { key: "badge_label", label: "Badge Text (e.g. Field-Tested Expedition Guidance)", type: "text" },
      { key: "badge_note", label: "Badge Note (e.g. Updated Weekly)", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "background_image", label: "Background Image", type: "asset" },
    ],
  },
  {
    key: "travel-advice-categories",
    label: "Advice Categories",
    blockKey: "travel_advice_categories",
    fields: [
      {
        key: "items",
        label: "Category Cards",
        type: "records",
        hint: "Leave empty to use the built-in categories.",
        subfields: [
          { key: "image", label: "Image", type: "asset" },
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Description", type: "textarea" },
          { key: "href", label: "Link", type: "text" },
        ],
      },
    ],
  },
  {
    key: "travel-advice-articles",
    label: "Featured Articles",
    blockKey: "travel_advice_articles",
    fields: [
      {
        key: "items",
        label: "Article Cards",
        type: "records",
        hint: "Leave empty to use the built-in articles.",
        subfields: [
          { key: "image", label: "Image", type: "asset" },
          { key: "category", label: "Category Label", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Description", type: "textarea" },
          { key: "href", label: "Link", type: "text" },
          { key: "readTime", label: "Read Time (e.g. 6 min read)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "travel-advice-essentials",
    label: "Pre-Flight Checklist",
    blockKey: "travel_advice_essentials",
    fields: [
      {
        key: "items",
        label: "Checklist Cards",
        type: "records",
        hint: "Leave empty to use the built-in checklist. Icons stay fixed to each card's position.",
        subfields: [
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Description", type: "textarea" },
          { key: "tag", label: "Tag (e.g. Rule #1)", type: "text" },
        ],
      },
    ],
  },

  // ---- Supplier Portal / Agent Portal (see SupplierPortalPageEditor / AgentPortalPageEditor) ----
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-hero`,
    label: "Hero Banner",
    blockKey: `${portal}_portal_hero`,
    fields: [
      { key: "is_active", label: "Show this page on the public site", type: "boolean" as const, default: "true" },
      { key: "heading", label: "Heading", type: "text" as const },
      { key: "subtitle", label: "Subtitle", type: "textarea" as const },
      { key: "primary_cta_text", label: "Primary Button Text", type: "text" as const },
      { key: "secondary_cta_text", label: "Secondary Button Text", type: "text" as const },
    ],
  })),
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-metrics`,
    label: "Metrics Strip",
    blockKey: `${portal}_portal_metrics`,
    fields: [
      {
        key: "items",
        label: "Metric Tiles (3, in order)",
        type: "records" as const,
        hint: "Leave empty to use the built-in metrics.",
        subfields: [
          { key: "value", label: "Value (e.g. 80+ Countries)", type: "text" as const },
          { key: "label", label: "Label", type: "text" as const },
          { key: "sub", label: "Subtext", type: "text" as const },
        ],
      },
    ],
  })),
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-features`,
    label: portal === "supplier" ? "Capabilities" : "Tools",
    blockKey: portal === "supplier" ? "supplier_portal_capabilities" : "agent_portal_tools",
    fields: [
      {
        key: "items",
        label: "Feature Cards",
        type: "records" as const,
        hint: "Leave empty to use the built-in cards. Icons stay fixed to each card's position.",
        subfields: [
          { key: "badge", label: "Badge", type: "text" as const },
          { key: "title", label: "Title", type: "text" as const },
          { key: "description", label: "Description", type: "textarea" as const },
        ],
      },
    ],
  })),
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-steps`,
    label: "How It Works",
    blockKey: `${portal}_portal_steps`,
    fields: [
      {
        key: "items",
        label: "Steps (in order)",
        type: "records" as const,
        hint: "Leave empty to use the built-in steps.",
        subfields: [
          { key: "badge", label: "Badge (e.g. STEP 1)", type: "text" as const },
          { key: "title", label: "Title", type: "text" as const },
          { key: "description", label: "Description", type: "textarea" as const },
        ],
      },
    ],
  })),
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-documents`,
    label: "Verification Documents",
    blockKey: `${portal}_portal_documents`,
    fields: [
      {
        key: "items",
        label: "Document Cards",
        type: "records" as const,
        hint: "Leave empty to use the built-in list.",
        subfields: [
          { key: "badge", label: "Badge (e.g. MANDATORY or OPTIONAL)", type: "text" as const },
          { key: "title", label: "Title", type: "text" as const },
          { key: "description", label: "Description", type: "textarea" as const },
          { key: "footer", label: "Footer Note (e.g. Accepted: PDF, JPG, PNG)", type: "text" as const },
        ],
      },
    ],
  })),
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-expectations`,
    label: "What We Expect",
    blockKey: `${portal}_portal_expectations`,
    fields: [
      {
        key: "items",
        label: "Expectation Cards",
        type: "records" as const,
        hint: "Leave empty to use the built-in list.",
        subfields: [
          { key: "title", label: "Title", type: "text" as const },
          { key: "description", label: "Description", type: "textarea" as const },
        ],
      },
    ],
  })),
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-faqs`,
    label: "FAQs",
    blockKey: `${portal}_portal_faqs`,
    fields: [
      {
        key: "items",
        label: "Questions",
        type: "records" as const,
        hint: "Leave empty to use the built-in FAQs.",
        subfields: [
          { key: "q", label: "Question", type: "text" as const },
          { key: "a", label: "Answer", type: "textarea" as const },
        ],
      },
    ],
  })),
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-cta`,
    label: "Bottom CTA",
    blockKey: `${portal}_portal_cta`,
    fields: [
      { key: "heading", label: "Heading", type: "text" as const },
      { key: "subtitle", label: "Subtitle", type: "textarea" as const },
      { key: "cta_text", label: "Button Text", type: "text" as const },
    ],
  })),
  ...(["supplier", "agent"] as const).map((portal) => ({
    key: `${portal}-portal-footer`, label: "Portal Footer", blockKey: `${portal}_portal_footer`,
    fields: [
      { key: "site_name", label: "Brand Heading", type: "text" as const },
      { key: "description", label: "Brand Description", type: "textarea" as const },
      { key: "sections", label: "Footer Link Columns", type: "records" as const, hint: "Each link goes on a separate line as: Link label | /link-url", subfields: [
        { key: "title", label: "Column Heading", type: "text" as const },
        { key: "link_lines", label: "Links", type: "textarea" as const },
      ] },
      { key: "facebook", label: "Facebook URL", type: "url" as const }, { key: "instagram", label: "Instagram URL", type: "url" as const },
      { key: "youtube", label: "YouTube URL", type: "url" as const }, { key: "whatsapp", label: "WhatsApp URL", type: "url" as const },
      { key: "twitter", label: "X URL", type: "url" as const }, { key: "linkedin", label: "LinkedIn URL", type: "url" as const },
    ],
  })),
  // ---- Affiliate Portal (see AffiliatePortalPageEditor) --------------------
  {
    key: "affiliate-portal-hero",
    label: "Hero Banner",
    blockKey: "affiliate_portal_hero",
    fields: [
      { key: "is_active", label: "Show this page on the public site", type: "boolean", default: "true" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "primary_cta_text", label: "Primary Button Text", type: "text" },
    ],
  },
  {
    key: "affiliate-portal-stats",
    label: "Stats Strip",
    blockKey: "affiliate_portal_stats",
    fields: [
      {
        key: "items",
        label: "Stat Tiles",
        type: "records",
        hint: "Leave empty to use the built-in stats.",
        subfields: [
          { key: "title", label: "Value", type: "text" },
          { key: "detail", label: "Label", type: "text" },
        ],
      },
    ],
  },
  {
    key: "affiliate-portal-perks",
    label: "Why Join Perks",
    blockKey: "affiliate_portal_perks",
    fields: [
      {
        key: "items",
        label: "Perk Cards",
        type: "records",
        hint: "Leave empty to use the built-in perks. Icons stay fixed to each card's position.",
        subfields: [
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "affiliate-portal-ideal-for",
    label: "Ideal For",
    blockKey: "affiliate_portal_ideal_for",
    fields: [
      { key: "items", label: "List Items", type: "list", hint: "Leave empty to use the built-in list." },
    ],
  },
  {
    key: "affiliate-portal-cta",
    label: "Bottom CTA",
    blockKey: "affiliate_portal_cta",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "cta_text", label: "Button Text", type: "text" },
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
      setValues(Object.fromEntries(tab.fields.map((f) => [f.key, Array.isArray(data[f.key]) && f.type === "list" ? JSON.stringify(data[f.key]) : Array.isArray(data[f.key]) && f.type === "records" ? JSON.stringify((data[f.key] as Record<string, unknown>[]).map((rec) => Object.fromEntries((f.subfields ?? []).map((sf) => [sf.key, Array.isArray(rec[sf.key]) ? (rec[sf.key] as string[]).join(", ") : String(rec[sf.key] ?? "")])))) : data[f.key] != null ? String(data[f.key]) : (f.default ?? "")])));
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
        data[f.key] = f.type === "records"
          ? (JSON.parse(raw || "[]") as Record<string, string>[])
              .map((rec) => Object.fromEntries((f.subfields ?? []).map((sf) => [sf.key, sf.type === "csv" ? (rec[sf.key] ?? "").split(",").map((v) => v.trim()).filter(Boolean) : (rec[sf.key] ?? "").trim()])))
              .filter((rec) => Object.values(rec).some((v) => (Array.isArray(v) ? v.length : v)))
          : f.type === "list"
          ? (JSON.parse(raw || "[]") as string[]).map((v) => v.trim()).filter(Boolean)
          : f.key === "features"
          ? raw.split(",").map((v) => v.trim()).filter(Boolean)
          : f.type === "number" ? (raw === "" ? "" : Number(raw))
          : f.type === "boolean" ? raw === "true"
          : raw;
      }
      // Keep keys this form doesn't edit (e.g. a section's `enabled` flag,
      // which is switched from the Home Page section list) - re-read the
      // latest block so a switch flipped after this form loaded isn't undone.
      const latest = await api.get(`/cms/content-blocks/${tab.blockKey}`).then((r) => (r.data?.data?.data ?? {}) as Record<string, unknown>).catch(() => ({}));
      await api.put(`/cms/content-blocks/${tab.blockKey}`, { data: { ...latest, ...data } });
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
          <Loader label="Loading content..." compact />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {tab.fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" || f.type === "asset" || f.type === "list" || f.type === "records" || f.type === "countries" ? "sm:col-span-2" : ""}>
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
                  ) : f.type === "records" ? (
                    <div className="space-y-3">
                      {(JSON.parse(values[f.key] || "[]") as Record<string, string>[]).map((rec, idx, all) => {
                        const setAll = (next: Record<string, string>[]) => setValues((v) => ({ ...v, [f.key]: JSON.stringify(next) }));
                        return (
                          <div key={idx} className="space-y-2 rounded-xl border border-dash-border bg-slate-50/60 p-3">
                            {(f.subfields ?? []).map((sf) => (
                              <div key={sf.key}>
                                {sf.type !== "asset" && (
                                  <label className="mb-1 block text-[11px] font-bold uppercase text-dash-muted">{sf.label}</label>
                                )}
                                {sf.type === "asset" ? (
                                  <AdminAssetUpload
                                    label={sf.label}
                                    kind="asset"
                                    value={rec[sf.key] ?? ""}
                                    onChange={(value) => setAll(all.map((r, i) => (i === idx ? { ...r, [sf.key]: value } : r)))}
                                  />
                                ) : sf.type === "textarea" ? (
                                  <textarea
                                    rows={2}
                                    value={rec[sf.key] ?? ""}
                                    onChange={(e) => setAll(all.map((r, i) => (i === idx ? { ...r, [sf.key]: e.target.value } : r)))}
                                    className="w-full resize-none rounded-xl border border-dash-border bg-white px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={rec[sf.key] ?? ""}
                                    onChange={(e) => setAll(all.map((r, i) => (i === idx ? { ...r, [sf.key]: e.target.value } : r)))}
                                    className="w-full rounded-xl border border-dash-border bg-white px-3 py-2 text-sm outline-none focus:border-[#0284C7]"
                                  />
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={() => setAll(all.filter((_, i) => i !== idx))} className="rounded-lg border border-dash-border px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Remove</button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setValues((v) => ({ ...v, [f.key]: JSON.stringify([...(JSON.parse(v[f.key] || "[]") as Record<string, string>[]), {}]) }))}
                        className="rounded-xl border border-dashed border-[#9CCFF0] px-3 py-2 text-xs font-bold text-[#0284C7] hover:bg-[#F7FBFF]"
                      >
                        + Add
                      </button>
                    </div>
                  ) : f.type === "list" ? (
                    <div className="space-y-2">
                      {(JSON.parse(values[f.key] || "[]") as string[]).map((item, idx, all) => {
                        const setAll = (next: string[]) => setValues((v) => ({ ...v, [f.key]: JSON.stringify(next) }));
                        return (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => setAll(all.map((x, i) => (i === idx ? e.target.value : x)))}
                              className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                            />
                            <button type="button" onClick={() => setAll(all.filter((_, i) => i !== idx))} className="rounded-xl border border-dash-border px-3 text-xs font-bold text-red-600 hover:bg-red-50">Remove</button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setValues((v) => ({ ...v, [f.key]: JSON.stringify([...(JSON.parse(v[f.key] || "[]") as string[]), ""]) }))}
                        className="rounded-xl border border-dashed border-[#9CCFF0] px-3 py-2 text-xs font-bold text-[#0284C7] hover:bg-[#F7FBFF]"
                      >
                        + Add
                      </button>
                    </div>
                  ) : f.type === "countries" ? (
                    <CountryMultiSelect
                      value={values[f.key] ?? ""}
                      onChange={(val) => setValues((v) => ({ ...v, [f.key]: val }))}
                    />
                  ) : f.type === "boolean" ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={values[f.key] === "true"}
                      onClick={() => setValues((v) => ({ ...v, [f.key]: v[f.key] === "true" ? "false" : "true" }))}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                        values[f.key] === "true" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${values[f.key] === "true" ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${values[f.key] === "true" ? "translate-x-3" : "translate-x-0"}`} />
                      </span>
                      <span>{values[f.key] === "true" ? "Enabled" : "Disabled"}</span>
                    </button>
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
        <Loader label="Loading footer links..." compact />
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
    { key: "title", header: "Section Title", className: "font-semibold text-dash-text min-w-32" },
    { key: "sort_order", header: "Sort Order", className: "w-24 text-center" },
    { key: "is_active", header: "Status", className: "w-28", render: (s) => <StatusTogglePill active={s.is_active} onToggle={() => void toggleActive(s)} /> },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-dash-border bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-dash-text">Footer</h3>
            <p className="mt-1 text-sm text-dash-muted">Manage the public site footer&apos;s link sections (e.g. Support, Our Company, Login) - add sections, edit titles, add/edit links, enable or disable either, and control display order. Changes reflect on the live site immediately.</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1] transition shadow-xs"
          >
            <Plus size={15} /> Add Section
          </button>
        </div>
      </section>
      <DataTable
          ariaLabel="Footer Sections"
          columns={columns}
          rows={sections}
          loading={loading}
          minWidthClass="min-w-full"
          emptyTitle="No footer sections yet."
          actions={(s) => (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <button
                type="button"
                title="Manage links"
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  expandedId === s.id ? "bg-[#0284C7] text-white" : "text-[#0284C7] hover:bg-[#EDF5FF]"
                }`}
              >
                <span>{expandedId === s.id ? "Hide links" : "Manage links"}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${expandedId === s.id ? "rotate-180" : ""}`} />
              </button>
              <button
                type="button"
                title="Edit"
                onClick={() => { setEditing(s); setShowForm(true); }}
                className="rounded-lg p-1.5 text-dash-brand hover:bg-[#F3F8FC] transition"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => void deleteSection(s.id)}
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
          renderExpandedRow={(section) =>
            expandedId === section.id ? (
              <tr>
                <td colSpan={columns.length + 1} className="bg-dash-bg-muted px-5 py-4">
                  <FooterLinksTable sectionId={section.id} />
                </td>
              </tr>
            ) : null
          }
        />

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
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find((opt) => (typeof opt === "string" ? opt : opt.value) === value);
  const selectedLabel = selected ? (typeof selected === "string" ? selected : selected.label) : "Select a tour...";

  const filteredOptions = searchTerm.trim()
    ? options.filter((opt) => {
        const label = typeof opt === "string" ? opt : opt.label;
        return label.toLowerCase().includes(searchTerm.trim().toLowerCase());
      })
    : options;

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-dash-border px-3 py-2.5 text-left text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
      >
        <span className={value ? "text-dash-text" : "text-dash-subtle"}>{selectedLabel}</span>
        <ChevronDown size={16} className={`shrink-0 text-dash-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 flex max-h-72 w-full flex-col overflow-hidden rounded-xl border border-dash-border bg-white shadow-sm">
          {options.length > 5 && (
            <div className="border-b border-dash-border p-2 bg-dash-bg">
              <input
                type="text"
                placeholder="Search tour..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                className="w-full rounded-lg border border-dash-border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#0284C7]"
                autoFocus
              />
            </div>
          )}
          <div className="overflow-y-auto p-1.5 flex-1 max-h-60">
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-xs text-dash-muted">
                {options.length === 0 ? "No tours available." : "No matching tours found."}
              </p>
            )}
            {filteredOptions.map((opt) => {
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
                    setSearchTerm("");
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
  const [sectionBlocks, setSectionBlocks] = useState<CmsPageBlock[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const isDestinationTab = tab.endpoint === "/cms/popular-destinations";
  const isCountryPageTab = tab.endpoint === "/cms/country-pages";
  const isFavouriteCountriesTab = tab.endpoint === "/cms/favourite-countries";
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
    api.get("/tours", { params: { page: 1, limit: 1000, status: "published" } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data?.items ?? res.data ?? [];
        const rows: CmsItem[] = Array.isArray(data) ? data : data.items ?? [];
        // Show all tours in the dropdown, adding the discount badge if one is active
        setTourOptions(rows.map((tour: CmsItem) => {
          const id = String(tour.id ?? "");
          const title = typeof tour.title === "string" ? tour.title : `Tour #${id}`;
          const code = typeof tour.tour_code === "string" && tour.tour_code ? `${tour.tour_code} - ` : "";
          const activeDisc = tour.active_discount as { discount_percentage?: number } | undefined;
          const discountPct =
            typeof tour.discount_percentage === "number"
              ? tour.discount_percentage
              : activeDisc?.discount_percentage != null
              ? Number(activeDisc.discount_percentage)
              : 0;
          const discount = discountPct > 0 ? ` (-${discountPct}%)` : "";
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
          toast.error("Could not load tours for the dropdown. Check that you have the Tours view permission.");
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.endpoint]);

  useEffect(() => {
    if (!isDestinationTab && !isCountryPageTab && !isFavouriteCountriesTab) return;
    let cancelled = false;
    api.get("/geo/countries")
      .then((res) => { if (!cancelled) setCountryOptions(res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setCountryOptions([]); });
    return () => { cancelled = true; };
  }, [isDestinationTab, isCountryPageTab, isFavouriteCountriesTab]);

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
    setSectionBlocks([]);
    setShowForm(true);
  };

  const openEdit = (item: CmsItem) => {
    setEditingItem(item);
    setFormValues(Object.fromEntries(tab.formFields.map(f => [f.key, item[f.key] != null ? String(item[f.key]) : ""])));
    setSectionBlocks(Array.isArray(item.sections) ? (item.sections as CmsPageBlock[]) : []);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingItem(null); setFormValues({}); setSectionBlocks([]); };

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
        } else if (
          editingItem &&
          !f.required &&
          (f.type === "text" || f.type === "textarea" || f.type === "url" || f.type === "asset" || f.type === "video")
        ) {
          // An empty optional field in edit mode means the administrator chose
          // to clear it. Sending null makes the API persist that intent instead
          // of silently retaining the previous value.
          body[f.key] = null;
        }
      }
      if (isDestinationTab) {
        const selectedCountry = countryOptions.find((country) => country.id === Number(body.country_id));
        if (!selectedCountry) {
          toast.error("Select a valid country name.");
          return;
        }
        body.title = selectedCountry.name;
      }
      if (isCmsPageTab) body.sections = sectionBlocks;
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
  const requiresExistingDiscount = false;

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-dash-text">{tab.label}</h3>
              <span className="rounded-full bg-[#EDF5FF] px-2.5 py-1 text-xs font-bold text-[#0369A1]">
                {loading ? "Loading" : `${items.length} item${items.length === 1 ? "" : "s"}`}
              </span>
            </div>
            <p className="mt-1 text-sm text-dash-muted">{description}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {requiresExistingDiscount && (
              <Link
                href="/admin/discounts"
                className="inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg"
                title="Discounts are created and edited in the Discounts module, not here"
              >
                <Percent size={15} /> Manage Discounts
              </Link>
            )}
            <button
              type="button"
              onClick={() => void fetchItems()}
              disabled={loading}
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1] transition shadow-xs"
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
        size={isCmsPageTab ? "wide" : "lg"}
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
                    maxLength={f.maxLength}
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  />
                ) : f.type === "select" && f.key === "tour_id" ? (
                  <>
                    <TourPickerSelect
                      options={tourOptions.filter((opt) => {
                        const id = typeof opt === "string" ? opt : opt.value;
                        return id === (formValues[f.key] ?? "") || !items.some((it) => String(it.tour_id) === id && it.id !== editingItem?.id);
                      })}
                      images={tourImages}
                      value={formValues[f.key] ?? ""}
                      onChange={(value) => setFormValues(v => ({ ...v, [f.key]: value }))}
                    />
                    {requiresExistingDiscount && tourOptions.length === 0 && (
                      <p className="mt-1.5 text-xs text-amber-700">
                        No tours currently have an active discount, so none are pickable here.{" "}
                        <Link href="/admin/discounts" className="font-bold underline">
                          Add a discount in Discounts
                        </Link>{" "}
                        first, then come back.
                      </p>
                    )}
                  </>
                ) : f.key === "country_id" && (isDestinationTab || isCountryPageTab || isFavouriteCountriesTab) ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, country_id: e.target.value, city_id: "" }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  >
                    <option value="">Select a country...</option>
                    {countryOptions
                      .filter((country) =>
                        !isCountryPageTab ||
                        String(country.id) === (formValues[f.key] ?? "") ||
                        !items.some((item) => Number(item.country_id) === country.id)
                      )
                      .map(c => (
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
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    maxLength={f.maxLength}
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  />
                )}
              </div>
            ))}
        </div>

        {isCmsPageTab && (
          <div className="mt-4">
            <PageSectionsBuilder value={sectionBlocks} onChange={setSectionBlocks} />
          </div>
        )}
      </ActionModal>

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
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            {tab.canEdit !== false && (
              <button
                type="button"
                onClick={() => openEdit(item)}
                aria-label="Edit"
                title="Edit"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-blue-700 transition"
              >
                <Pencil size={14} />
              </button>
            )}
            {tab.canDelete !== false && (
              <button
                type="button"
                disabled={deletingId === item.id}
                onClick={() => void deleteItem(item.id)}
                aria-label="Delete"
                title="Delete"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      />
      {dialog}
    </div>
  );
}

// ---- Section registry -----------------------------------------------------
export const FOOTER_TAB = { key: "footer", label: "Footer" };

// Its own top-level CMS section (rather than nested under "Country Pages") -
// a single country-scoped editor (CountryDestinationInfoPanel), not a list
// of rows, so it's registered here alongside FOOTER_TAB instead of in TABS.
export const COUNTRY_DESTINATION_GUIDE_TAB = { key: "country-destination-guide", label: "Country Destination Guide" };

export const ALL_TABS: { key: string; label: string }[] = [
  { key: "home", label: "Home Page" },
  { key: "about", label: "About Us" },
  { key: "contact", label: "Contact Us" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "privacy-policy", label: "Privacy Policy" },
  { key: "cookie-policy", label: "Cookie Policy" },
  { key: "travel-advice", label: "Travel Advice" },
  { key: "supplier-portal", label: "Supplier Portal" },
  { key: "agent-portal", label: "Agent Portal" },
  ...TABS.map((t) => ({ key: t.key, label: t.label })),
  ...CONTENT_BLOCK_TABS.map((t) => ({ key: t.key, label: t.label })),
  FOOTER_TAB,
  COUNTRY_DESTINATION_GUIDE_TAB,
  { key: "seo", label: "SEO & Meta Tags" },
];

// ---- Dashboard grouping ----------------------------------------------------
// The CMS landing page (/admin/cms) groups the sections above by the real
// site area an editor is working on ("update the Contact page", "update the
// homepage"), instead of the flat A-Z list of ~20 tiles used on every
// section's own page. A group's `tabs` are keys into ALL_TABS; `external`
// entries link out to a different module entirely (e.g. Settings, where
// contact details actually live) rather than a CMS tab.
export type CmsDashboardGroup = {
  key: string;
  label: string;
  description: string;
  tabs: string[];
  external?: { label: string; href: string; description: string }[];
};

export const CMS_DASHBOARD_GROUPS: CmsDashboardGroup[] = [
  {
    key: "home",
    label: "Home Page",
    description: "Every section on the public homepage, top to bottom.",
    tabs: ["home"],
  },
  {
    key: "destinations",
    label: "Country Pages",
    description: "The global tours listing, dynamic per-country tour pages, destination guides, and country-based currency availability.",
    tabs: ["tours-listing", "country-pages"],
    external: [
      {
        label: "Countries & Currencies",
        href: "/admin/settings/countries",
        description: "Manage every country, its currency and phone code. Use the Active switch to show or hide it in the public header and footer.",
      },
    ],
  },
  {
    key: "content",
    label: "Content & Pages",
    description: "Standalone pages (About Us, Contact Us, legal pages, Travel Advice, and one-off pages), plus testimonials and FAQs.",
    tabs: ["cms-pages", "about", "contact", "terms", "privacy-policy", "cookie-policy", "travel-advice", "customer-reviews", "help-centre"],
  },
  {
    key: "portals",
    label: "Partner Portal Pages",
    description: "The public landing pages for suppliers and travel agents - hero, features, steps, documents, FAQs and CTA. Interactive calculators stay code-driven.",
    tabs: ["supplier-portal", "agent-portal"],
  },
  {
    key: "site",
    label: "Header, Footer & Contact",
    description: "The footer's link sections, plus contact details and other site-wide settings.",
    tabs: ["footer"],
    external: [
      { label: "Contact Details", href: "/admin/settings", description: "Support email, phone, and company address (Settings > General)." },
    ],
  },
  {
    key: "seo",
    label: "SEO & Meta Tags",
    description: "The title and description Google and social shares show for each public page.",
    tabs: ["seo"],
  },
];

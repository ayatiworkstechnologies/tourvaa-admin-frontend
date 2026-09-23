"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus } from "react-icons/lu";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import ActionModal from "@/components/operations/ActionModal";
import PageEditor, { type PageEditorSection } from "./PageEditor";
import ExtraSectionEditor, { extraSectionProblem, SectionTypePicker, suggestedCategory, useExtraSectionLookups } from "./HomeExtraSectionsPanel";
import {
  DEFAULT_EXTRA_SECTION_ANCHOR,
  emptyExtraSection,
  EXTRA_SECTION_ANCHORS,
  EXTRA_SECTION_TYPES,
  EXTRA_SECTIONS_BLOCK_KEY,
  type ExtraSectionType,
  type HomeExtraSection,
  type HomeExtraSectionsBlock,
  normalizeExtraSections,
} from "@/components/public/home/extraSectionsTypes";
import { SECTION_VISIBILITY_BLOCK_KEY, type SectionVisibility } from "@/components/public/home/sectionVisibility";

// Where a built-in section's show/hide switch is stored: the shared
// visibility map, or (Top Deals / Trending) the `enabled` flag of the
// section's own block, which those components already read.
type VisibilitySource = { kind: "map" } | { kind: "block"; blockKey: "top_deals_section" | "trending_section" };

type BuiltInSection = Omit<PageEditorSection, "toggle"> & { visibility: VisibilitySource };

const MAP: VisibilitySource = { kind: "map" };

// The homepage top to bottom - one entry per visible block, each stacking
// the CMS editors that feed it. Admin-added sections are slotted in after
// the section they were placed after.
const HOME_SECTIONS: BuiltInSection[] = [
  { key: "top-bar", label: "Top Bar", tabs: ["trust-bar", "top-bar"], visibility: MAP, badge: "All pages" },
  { key: "hero", label: "Hero & Offer Strip", tabs: ["banners"], visibility: MAP },
  { key: "slogan", label: "Slogan under Search", tabs: ["slogans"], visibility: MAP },
  { key: "top-deals", label: "Top Deals", tabs: ["tours-on-deals"], visibility: { kind: "block", blockKey: "top_deals_section" } },
  { key: "favourite", label: "Favourite Countries", tabs: ["favourite-countries"], visibility: MAP },
  { key: "about", label: "About Tourvaa", tabs: ["about-section"], visibility: MAP },
  { key: "trending", label: "Trending Tours", tabs: ["popular-tours"], visibility: { kind: "block", blockKey: "trending_section" } },
  { key: "blog", label: "Blog Card", tabs: ["blog-teaser"], visibility: MAP },
  { key: "handpicked", label: "Handpicked Tours", tabs: ["handpicked-tours", "handpicked-heading"], visibility: MAP },
  { key: "countries", label: "Countries Worth Exploring", tabs: ["popular-destinations", "countries-heading"], visibility: MAP },
  { key: "testimonials", label: "Testimonials", tabs: ["testimonials-heading", "customer-reviews"], visibility: MAP },
  {
    key: "directory",
    label: "Popular Searches",
    visibility: MAP,
    render: () => (
      <section className="rounded-xl border border-dash-border bg-white p-5">
        <h3 className="text-lg font-bold text-dash-text">Popular Searches</h3>
        <p className="mt-1 text-sm text-dash-muted">
          The tabbed directory of popular destination searches. It is built automatically from your published tours, so there is nothing to
          edit here - use the switch in the section list to show or hide it.
        </p>
      </section>
    ),
  },
  { key: "airport", label: "Airport Transfers", tabs: ["airport-transfer"], visibility: MAP },
  { key: "faq", label: "FAQ", tabs: ["faq-heading", "help-centre"], visibility: MAP },
  { key: "support", label: "Support Card", tabs: ["travel-support"], visibility: MAP },
  { key: "offers", label: "Special Offers Card", tabs: ["newsletter-banner"], visibility: MAP },
];

const extraKey = (id: string) => `extra:${id}`;

const getBlock = (key: string) =>
  api.get(`/cms/content-blocks/${key}`).then((r) => (r.data?.data?.data ?? {}) as Record<string, unknown>);

const INPUT = "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand";

export default function HomePageEditor() {
  const toast = useToast();
  const lookups = useExtraSectionLookups();
  const [loaded, setLoaded] = useState(false);
  const [visibility, setVisibility] = useState<SectionVisibility>({});
  const [blockEnabled, setBlockEnabled] = useState<Record<string, boolean>>({});
  const [extras, setExtras] = useState<HomeExtraSectionsBlock>({ enabled: true, sections: [] });
  const [busy, setBusy] = useState<string | null>(null);
  const [active, setActive] = useState(HOME_SECTIONS[0].key);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [adding, setAdding] = useState<{ name: string; after: string; type: ExtraSectionType } | null>(null);

  useEffect(() => {
    let active = true;
    const safe = (key: string) => getBlock(key).catch((): Record<string, unknown> => ({}));
    Promise.all([safe(SECTION_VISIBILITY_BLOCK_KEY), safe("top_deals_section"), safe("trending_section"), safe(EXTRA_SECTIONS_BLOCK_KEY)]).then(
      ([vis, deals, trending, extra]) => {
        if (!active) return;
        setVisibility(vis as SectionVisibility);
        // Same defaults the public components use: shown unless explicitly false.
        setBlockEnabled({ top_deals_section: deals.enabled !== false, trending_section: trending.enabled !== false });
        setExtras(normalizeExtraSections(extra));
        setLoaded(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const isOn = (key: string, source: VisibilitySource) =>
    source.kind === "map" ? visibility[key] !== false : blockEnabled[source.blockKey] !== false;

  const toggleBuiltIn = async (sec: BuiltInSection) => {
    const next = !isOn(sec.key, sec.visibility);
    setBusy(sec.key);
    try {
      if (sec.visibility.kind === "map") {
        const data = { ...visibility, [sec.key]: next };
        await api.put(`/cms/content-blocks/${SECTION_VISIBILITY_BLOCK_KEY}`, { data });
        setVisibility(data);
      } else {
        const { blockKey } = sec.visibility;
        // Merge into the latest block so the section's heading copy is kept.
        const current = await getBlock(blockKey);
        await api.put(`/cms/content-blocks/${blockKey}`, { data: { ...current, enabled: next } });
        setBlockEnabled((b) => ({ ...b, [blockKey]: next }));
      }
      toast.success(`${sec.label} ${next ? "shown on" : "hidden from"} the homepage.`);
      setPreviewVersion((v) => v + 1);
    } catch {
      toast.error(`Could not update ${sec.label}.`);
    } finally {
      setBusy(null);
    }
  };

  // Every change to the added sections (switch, add, delete, edits) saves the
  // whole block straight away. `enabled: true` - there's no longer an
  // all-sections switch, so make sure an old "off" value can't hide them.
  const persistExtras = useCallback(
    async (sections: HomeExtraSection[], busyKey: string) => {
      setBusy(busyKey);
      try {
        const next = { enabled: true, sections };
        await api.put(`/cms/content-blocks/${EXTRA_SECTIONS_BLOCK_KEY}`, { data: next });
        setExtras(next);
        setPreviewVersion((v) => v + 1);
        return true;
      } catch {
        toast.error("Could not save the section.");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );

  const openAdd = () => {
    // Default the position to the section being viewed, when it's a valid spot.
    const current = active.startsWith("extra:") ? extras.sections.find((s) => extraKey(s.id) === active)?.after : active;
    const after = EXTRA_SECTION_ANCHORS.some((a) => a.key === current) ? current! : DEFAULT_EXTRA_SECTION_ANCHOR;
    setAdding({ name: "", after, type: "tours" });
  };

  const createSection = async () => {
    if (!adding) return;
    const name = adding.name.trim();
    if (!name) {
      toast.error("Enter a section name.");
      return;
    }
    const section = { ...emptyExtraSection(name, adding.after, adding.type), category: suggestedCategory(name, lookups.categories) };
    if (await persistExtras([...extras.sections, section], "add")) {
      setAdding(null);
      setActive(extraKey(section.id));
      toast.success(`"${name}" added - now add its content below and save.`);
    }
  };

  const updateSection = (id: string, patch: Partial<HomeExtraSection>, busyKey: string) =>
    persistExtras(extras.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)), busyKey);

  const deleteSection = async (section: HomeExtraSection) => {
    if (await persistExtras(extras.sections.filter((s) => s.id !== section.id), "delete")) {
      setActive(section.after);
      toast.success(`"${section.title}" deleted.`);
    }
  };

  const extraItem = (s: HomeExtraSection): PageEditorSection => {
    const problem = s.enabled ? extraSectionProblem(s, lookups) : null;
    return {
      key: extraKey(s.id),
      label: s.title || "Untitled section",
      custom: true,
      badge: problem
        ? s.type === "tours" ? "Needs tours" : "Needs content"
        : EXTRA_SECTION_TYPES.find((t) => t.type === s.type)?.label ?? "Custom",
      badgeTone: problem ? "warn" : "info",
      toggle: { on: s.enabled, busy: busy !== null, onToggle: () => void updateSection(s.id, { enabled: !s.enabled }, extraKey(s.id)) },
      render: () => (
        <ExtraSectionEditor
          key={s.id}
          section={s}
          lookups={lookups}
          onDelete={() => deleteSection(s)}
          onSave={async (next) => {
            const ok = await updateSection(s.id, next, "save");
            if (ok) toast.success(`"${next.title}" saved.`);
            return ok;
          }}
        />
      ),
    };
  };

  const items: PageEditorSection[] = HOME_SECTIONS.flatMap(({ visibility: source, ...sec }) => [
    { ...sec, toggle: loaded ? { on: isOn(sec.key, source), busy: busy !== null, onToggle: () => void toggleBuiltIn({ ...sec, visibility: source }) } : undefined },
    ...extras.sections.filter((s) => s.after === sec.key).map(extraItem),
  ]);

  return (
    <>
      <PageEditor
        sections={items}
        active={active}
        onActiveChange={setActive}
        previewVersion={previewVersion}
        previewTitle="Live homepage"
        previewSrc={() => "/"}
        headerAction={
          <button
            type="button"
            disabled={!loaded || busy !== null}
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-3 py-2 text-xs font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
          >
            <Plus size={14} /> Add new section
          </button>
        }
      />
      <ActionModal
        open={adding !== null}
        title="Add new section"
        confirmLabel="Create section"
        size="wide"
        saving={busy === "add"}
        onClose={() => setAdding(null)}
        onConfirm={() => void createSection()}
      >
        {adding && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Section name *</span>
              <input
                autoFocus
                value={adding.name}
                onChange={(e) => setAdding({ ...adding, name: e.target.value })}
                placeholder="e.g. Adventures, Cruise Journeys"
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Position - show after</span>
              <select value={adding.after} onChange={(e) => setAdding({ ...adding, after: e.target.value })} className={INPUT}>
                {EXTRA_SECTION_ANCHORS.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">What should it show?</span>
              <SectionTypePicker value={adding.type} onChange={(type) => setAdding({ ...adding, type })} />
            </div>
            <p className="rounded-lg bg-[#F7FBFF] px-3 py-2 text-xs text-dash-muted">
              After creating it, the section editor opens so you can add its content - tours, cards, images, text or buttons.
            </p>
          </div>
        )}
      </ActionModal>
    </>
  );
}

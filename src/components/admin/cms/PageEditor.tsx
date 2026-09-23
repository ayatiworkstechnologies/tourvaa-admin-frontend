"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuExternalLink as ExternalLink, LuRefreshCw as RefreshCw } from "react-icons/lu";
import CmsSectionContent from "@/app/admin/cms/CmsSectionContent";

// Show/hide switch for a section on the live page. `on` is the current saved
// state; `onToggle` persists the change itself.
export type SectionToggle = {
  on: boolean;
  onToggle: () => void;
  busy?: boolean;
};

export type PageEditorSection = {
  key: string;
  label: string;
  // CMS tab editors stacked for this section - or `render` for a custom editor.
  tabs?: string[];
  render?: () => ReactNode;
  // Which live page this section previews (resolved by the caller's `previewSrc`).
  preview?: string;
  toggle?: SectionToggle;
  badge?: string;
  badgeTone?: "info" | "warn";
  // Admin-added section: highlighted in the list.
  custom?: boolean;
};

function SectionSwitch({ on, onToggle, busy, label }: SectionToggle & { label: string }) {
  const track = "h-4 w-7";
  const knob = "h-3 w-3";
  const shift = "translate-x-3";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={on ? "Shown on the page - click to hide" : "Hidden from the page - click to show"}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-colors disabled:cursor-wait disabled:opacity-60 ${track} ${on ? "bg-emerald-500" : "bg-slate-300"}`}
    >
      <span className={`inline-block transform rounded-full bg-white shadow transition ${knob} ${on ? shift : "translate-x-0"}`} />
    </button>
  );
}

function SectionNavButton({ sec, number, active, onSelect }: { sec: PageEditorSection; number: string; active: boolean; onSelect: () => void }) {
  const hidden = sec.toggle && !sec.toggle.on;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition ${
        active
          ? "border-[#0284C7] bg-[#EDF5FF] shadow-[0_0_0_3px_rgba(2,132,199,0.12)]"
          : sec.custom
            ? "border-dashed border-violet-300 bg-violet-50/40 hover:border-violet-400 hover:bg-violet-50"
            : "border-dash-border bg-white hover:border-[#9CCFF0] hover:bg-[#F7FBFF]"
      }`}
    >
      <span
        className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-bold ${
          active ? "bg-[#0284C7] text-white" : sec.custom ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-dash-muted"
        }`}
      >
        {number}
      </span>
      <span className="min-w-0 flex-1">
        <span title={sec.label} className={`block truncate text-xs font-bold ${hidden ? "text-dash-subtle" : active ? "text-[#0284C7]" : "text-dash-text"}`}>
          {sec.label}
        </span>
        {(hidden || sec.badge) && (
          <span className="mt-0.5 flex gap-1">
            {hidden && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold uppercase text-slate-500">Hidden</span>}
            {sec.badge && (
              <span className={`rounded px-1.5 text-[10px] font-bold uppercase ${sec.badgeTone === "warn" ? "bg-amber-50 text-amber-700" : "bg-violet-50 text-violet-600"}`}>
                {sec.badge}
              </span>
            )}
          </span>
        )}
      </span>
      {sec.toggle && <SectionSwitch {...sec.toggle} label={`Show ${sec.label}`} />}
    </div>
  );
}

// The public site is rendered at a real desktop width and scaled down to fit
// the pane, so the preview shows the exact desktop design instead of the
// cramped mobile layout a ~500px-wide iframe would trigger.
const PREVIEW_WIDTH = 1440;
const PREVIEW_HEIGHT_VH = 78;

// Shared "sections + live preview" CMS page (Home Page, Country Pages, Footer):
// numbered section buttons and the selected section's editors on the left, the
// real public page on the right. Saves happen inside each editor panel;
// "Refresh preview" reloads the page to show them.
export default function PageEditor({
  sections,
  previewTitle,
  previewSrc,
  scrollToBottom = false,
  toolbarExtra,
  active: controlledActive,
  onActiveChange,
  previewVersion = 0,
  headerAction,
}: {
  sections: PageEditorSection[];
  previewTitle: string;
  previewSrc: (section: PageEditorSection) => string | null;
  scrollToBottom?: boolean;
  toolbarExtra?: ReactNode;
  // Optional controlled selection (e.g. to jump to a just-added section).
  active?: string;
  onActiveChange?: (key: string) => void;
  // Bump to reload the live preview after a change saved outside the editors (e.g. a visibility toggle).
  previewVersion?: number;
  // Rendered at the top-right of the section list (e.g. an "Add section" button).
  headerAction?: ReactNode;
}) {
  const [uncontrolledActive, setUncontrolledActive] = useState(sections[0]?.key ?? "");
  const active = controlledActive ?? uncontrolledActive;
  const setActive = (key: string) => {
    setUncontrolledActive(key);
    onActiveChange?.(key);
  };
  const [previewKey, setPreviewKey] = useState(0);
  const paneRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / PREVIEW_WIDTH));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const current = sections.find((sec) => sec.key === active) ?? sections[0];
  const src = previewSrc(current);
  const toggles = sections.filter((sec) => sec.toggle);
  const shownCount = toggles.filter((sec) => sec.toggle?.on).length;

  const onFrameLoad = () => {
    if (!scrollToBottom) return;
    try {
      const win = frameRef.current?.contentWindow;
      // Lazy sections load as they scroll into view, so keep nudging to the bottom.
      [300, 1200, 2500].forEach((ms) => setTimeout(() => win?.scrollTo(0, win.document.body.scrollHeight), ms));
    } catch {
      /* cross-origin frame: leave at top */
    }
  };

  return (
    <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-xl border border-dash-border bg-white p-3.5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-0.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-dash-muted">Page sections</span>
              {toggles.length > 0 && (
                <p className="text-xs text-dash-subtle">
                  <strong className="text-emerald-600">{shownCount}</strong> of {toggles.length} shown · use the switch to show/hide a section
                </p>
              )}
            </div>
            {headerAction}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((sec, i) => (
              <SectionNavButton key={sec.key} sec={sec} number={String(i + 1)} active={active === sec.key} onSelect={() => setActive(sec.key)} />
            ))}
          </div>
        </div>
        {current?.render
          ? current.render()
          : (current?.tabs ?? []).map((tab) => <CmsSectionContent key={tab} activeTab={tab} />)}
      </div>

      <div className="min-w-0 2xl:sticky 2xl:top-4">
        <div className="overflow-hidden rounded-xl border border-dash-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dash-border px-4 py-2.5">
            <span className="text-sm font-bold text-dash-text">{previewTitle}</span>
            <div className="flex flex-wrap items-center gap-2">
              {toolbarExtra}
              <button type="button" onClick={() => setPreviewKey((k) => k + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border px-2.5 py-1 text-xs font-bold text-dash-text hover:bg-[#F7FBFF]">
                <RefreshCw size={13} /> Refresh preview
              </button>
              {src && (
                <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border px-2.5 py-1 text-xs font-bold text-dash-text hover:bg-[#F7FBFF]">
                  <ExternalLink size={13} /> Open
                </a>
              )}
            </div>
          </div>
          <div ref={paneRef} className="w-full overflow-hidden bg-white" style={{ height: `${PREVIEW_HEIGHT_VH}vh` }}>
            {src ? (
              <iframe
                ref={frameRef}
                key={`${previewKey}-${previewVersion}-${src}`}
                src={src}
                title={previewTitle}
                onLoad={onFrameLoad}
                className="origin-top-left border-0 bg-white"
                style={{ width: PREVIEW_WIDTH, height: `${PREVIEW_HEIGHT_VH / scale}vh`, transform: `scale(${scale})` }}
              />
            ) : (
              <p className="p-6 text-sm text-dash-muted">Pick a country to preview.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

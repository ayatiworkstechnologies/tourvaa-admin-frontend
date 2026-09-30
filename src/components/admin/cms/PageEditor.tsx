"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LuColumns2 as Columns,
  LuExternalLink as ExternalLink,
  LuEye as Eye,
  LuMonitor as Monitor,
  LuPenTool as PenTool,
  LuRefreshCw as RefreshCw,
  LuSmartphone as Smartphone,
  LuTablet as Tablet,
} from "react-icons/lu";
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
      className={`group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition ${
        active
          ? "border-blue-600/80 bg-blue-50/70 shadow-2xs ring-2 ring-blue-600/15"
          : sec.custom
            ? "border-dashed border-violet-300 bg-violet-50/40 hover:border-violet-400 hover:bg-violet-50"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
      }`}
    >
      <span
        className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
          active ? "bg-blue-600 text-white" : sec.custom ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        {number}
      </span>
      <span className="min-w-0 flex-1">
        <span title={sec.label} className={`block truncate text-xs font-bold ${hidden ? "text-slate-400" : active ? "text-blue-950" : "text-slate-800"}`}>
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

// Device simulation widths for live previews
const DEVICE_WIDTHS = {
  desktop: 1440,
  tablet: 768,
  mobile: 390,
} as const;

type DeviceMode = keyof typeof DEVICE_WIDTHS;
type ViewMode = "split" | "editor" | "preview";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const paneRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.4);

  const targetWidth = DEVICE_WIDTHS[device];

  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    const update = () => {
      const containerWidth = el.clientWidth;
      setScale(Math.min(1, containerWidth / targetWidth));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [targetWidth, viewMode]);

  const current = sections.find((sec) => sec.key === active) ?? sections[0];
  const src = previewSrc(current);
  const toggles = sections.filter((sec) => sec.toggle);
  const shownCount = toggles.filter((sec) => sec.toggle?.on).length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPreviewKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

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

  const showEditor = viewMode === "split" || viewMode === "editor";
  const showPreview = viewMode === "split" || viewMode === "preview";

  return (
    <div className="space-y-4">
      {/* Top View Mode Switcher bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline">
            View Mode
          </span>
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "split"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns size={13} />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "editor"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PenTool size={13} />
              <span>Editor only</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "preview"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye size={13} />
              <span>Preview only</span>
            </button>
          </div>
        </div>

        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Main Content: Editor, Preview, or Split */}
      <div
        className={`grid items-start gap-5 ${
          viewMode === "split"
            ? "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
            : "grid-cols-1"
        }`}
      >
        {/* Editor Column */}
        {showEditor && (
          <div className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-0.5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Page sections</span>
                  {toggles.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      <strong className="text-emerald-600 font-bold">{shownCount}</strong> of {toggles.length} shown · use the switch to show/hide a section
                    </p>
                  )}
                </div>
              </div>
              <div
                className={`grid gap-2.5 grid-cols-1 ${
                  sections.length <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                } ${viewMode === "editor" ? "xl:grid-cols-3 2xl:grid-cols-4" : ""}`}
              >
                {sections.map((sec, i) => (
                  <SectionNavButton key={sec.key} sec={sec} number={String(i + 1)} active={active === sec.key} onSelect={() => setActive(sec.key)} />
                ))}
              </div>
            </div>

            {current?.render
              ? current.render()
              : (current?.tabs ?? []).map((tab) => <CmsSectionContent key={tab} activeTab={tab} />)}
          </div>
        )}

        {/* Live Preview Column */}
        {showPreview && (
          <div className={`min-w-0 ${viewMode === "split" ? "xl:sticky xl:top-4" : ""}`}>
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/90 px-4 py-2.5 bg-slate-50/90">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{previewTitle}</span>
                  <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                    ({targetWidth}px)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {toolbarExtra}

                  {/* Device selector */}
                  <div className="inline-flex items-center rounded-lg border border-dash-border bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      title="Desktop preview (1440px)"
                      onClick={() => setDevice("desktop")}
                      className={`rounded p-1 text-xs transition ${
                        device === "desktop" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      type="button"
                      title="Tablet preview (768px)"
                      onClick={() => setDevice("tablet")}
                      className={`rounded p-1 text-xs transition ${
                        device === "tablet" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Tablet size={14} />
                    </button>
                    <button
                      type="button"
                      title="Mobile preview (390px)"
                      onClick={() => setDevice("mobile")}
                      className={`rounded p-1 text-xs transition ${
                        device === "mobile" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border bg-white px-2.5 py-1 text-xs font-bold text-dash-text hover:bg-slate-50 transition shadow-2xs"
                  >
                    <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[#0284C7]" : ""} />
                    <span>Refresh</span>
                  </button>

                  {src && (
                    <a
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border bg-white px-2.5 py-1 text-xs font-bold text-dash-text hover:bg-slate-50 transition shadow-2xs"
                    >
                      <ExternalLink size={13} />
                      <span>Open</span>
                    </a>
                  )}
                </div>
              </div>

              <div
                ref={paneRef}
                className="w-full overflow-hidden bg-slate-100/70 p-2 flex justify-center items-start"
                style={{ minHeight: `${PREVIEW_HEIGHT_VH}vh`, height: `${PREVIEW_HEIGHT_VH}vh` }}
              >
                {src ? (
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      device !== "desktop"
                        ? "rounded-2xl border-4 border-slate-700/80 shadow-2xl bg-white"
                        : "w-full bg-white shadow-xs rounded-lg"
                    }`}
                    style={{
                      width: device === "desktop" ? "100%" : `${targetWidth * scale}px`,
                      height: `${PREVIEW_HEIGHT_VH}vh`,
                    }}
                  >
                    <iframe
                      ref={frameRef}
                      key={`${previewKey}-${previewVersion}-${src}-${device}`}
                      src={src}
                      title={previewTitle}
                      onLoad={onFrameLoad}
                      className="origin-top-left border-0 bg-white"
                      style={{
                        width: targetWidth,
                        height: `${(PREVIEW_HEIGHT_VH / scale) * 0.95}vh`,
                        transform: `scale(${scale})`,
                      }}
                    />
                  </div>
                ) : (
                  <p className="p-6 text-sm text-dash-muted">Pick a country to preview.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

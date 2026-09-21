"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuExternalLink as ExternalLink, LuRefreshCw as RefreshCw } from "react-icons/lu";
import CmsSectionContent from "@/app/admin/cms/CmsSectionContent";

export type PageEditorSection = {
  key: string;
  label: string;
  tabs: string[];
  // Which live page this section previews (resolved by the caller's `previewSrc`).
  preview?: string;
};

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
}: {
  sections: PageEditorSection[];
  previewTitle: string;
  previewSrc: (section: PageEditorSection) => string | null;
  scrollToBottom?: boolean;
  toolbarExtra?: ReactNode;
}) {
  const [active, setActive] = useState(sections[0].key);
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
        <div className="flex flex-wrap gap-2 rounded-xl border border-dash-border bg-white p-3">
          {sections.map((sec, i) => (
            <button
              key={sec.key}
              type="button"
              onClick={() => setActive(sec.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                active === sec.key ? "border-[#0284C7] bg-[#EDF5FF] text-[#0284C7]" : "border-dash-border text-dash-text hover:bg-[#F7FBFF]"
              }`}
            >
              {i + 1}. {sec.label}
            </button>
          ))}
        </div>
        {current.tabs.map((tab) => (
          <CmsSectionContent key={tab} activeTab={tab} />
        ))}
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
                key={`${previewKey}-${src}`}
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

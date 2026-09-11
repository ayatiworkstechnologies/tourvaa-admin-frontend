"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LuGlobe as Globe } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import {
  ALL_TABS,
  CONTENT_BLOCK_TABS,
  ContentBlockPanel,
  FooterPanel,
  FOOTER_TAB,
  HERO_EXTRAS_BLOCK,
  CmsTabPanel,
  TABS,
  TAB_DESCRIPTIONS,
  TOP_DEALS_VISIBILITY_BLOCK,
  TRENDING_VISIBILITY_BLOCK,
} from "../cmsShared";

export default function CmsSectionPage() {
  const params = useParams<{ section: string }>();
  const activeTab = params.section;

  const currentListTab = TABS.find((t) => t.key === activeTab);
  const currentBlockTab = CONTENT_BLOCK_TABS.find((t) => t.key === activeTab);
  const isFooterTab = activeTab === FOOTER_TAB.key;
  const currentLabel = currentListTab?.label ?? currentBlockTab?.label ?? (isFooterTab ? FOOTER_TAB.label : null);

  return (
    <ModuleWrapper title="CMS Management" requiredPermission="website_cms.view">
      <div className="space-y-5">
        <section className="rounded-xl border border-dash-border bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF5FF] text-[#0284C7]">
                  <Globe size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-dash-text">Website CMS</h2>
                  <p className="mt-1 text-sm text-dash-muted">Manage homepage, content, policies, links, and promotional website sections.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-xl border border-dash-border px-4 py-3">
                <span className="block text-xs font-bold uppercase text-dash-muted">Sections</span>
                <span className="mt-1 block text-lg font-bold text-dash-text">{ALL_TABS.length}</span>
              </div>
              <div className="rounded-xl border border-dash-border px-4 py-3">
                <span className="block text-xs font-bold uppercase text-dash-muted">Active</span>
                <span className="mt-1 block text-lg font-bold text-[#0284C7]">{currentLabel ?? "Unknown"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Each entry is a real link to /admin/cms/{key} - ctrl/cmd-click or
            middle-click opens that section in a new browser tab, and every
            section has its own bookmarkable, shareable URL. */}
        <section className="rounded-xl border border-dash-border bg-white p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={`/admin/cms/${tab.key}`}
                  className={`block min-h-20 rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-[#0284C7] bg-[#EDF5FF] shadow-sm"
                      : "border-dash-border bg-white hover:border-[#9CCFF0] hover:bg-[#F7FBFF]"
                  }`}
                >
                  <span className={`block text-sm font-bold ${active ? "text-[#0369A1]" : "text-dash-text"}`}>{tab.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-dash-muted">{TAB_DESCRIPTIONS[tab.key]}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {currentListTab ? (
          <div className="space-y-5">
            <CmsTabPanel key={currentListTab.key} tab={currentListTab} />
            {currentListTab.key === "banners" && (
              <ContentBlockPanel key={HERO_EXTRAS_BLOCK.key} tab={HERO_EXTRAS_BLOCK} />
            )}
            {currentListTab.key === "tours-on-deals" && (
              <ContentBlockPanel key={TOP_DEALS_VISIBILITY_BLOCK.key} tab={TOP_DEALS_VISIBILITY_BLOCK} />
            )}
            {currentListTab.key === "popular-tours" && (
              <ContentBlockPanel key={TRENDING_VISIBILITY_BLOCK.key} tab={TRENDING_VISIBILITY_BLOCK} />
            )}
          </div>
        ) : currentBlockTab ? (
          <ContentBlockPanel key={currentBlockTab.key} tab={currentBlockTab} />
        ) : isFooterTab ? (
          <FooterPanel />
        ) : (
          <section className="rounded-xl border border-dash-border bg-white p-6 text-center">
            <p className="text-sm font-bold text-dash-text">Unknown CMS section &ldquo;{activeTab}&rdquo;.</p>
            <p className="mt-1 text-sm text-dash-muted">Pick a section above.</p>
          </section>
        )}
      </div>
    </ModuleWrapper>
  );
}

"use client";

import {
  CONTENT_BLOCK_TABS,
  ContentBlockPanel,
  COUNTRY_DESTINATION_GUIDE_TAB,
  FAVOURITE_COUNTRIES_HEADING_BLOCK,
  FooterPanel,
  FOOTER_TAB,
  HERO_EXTRAS_BLOCK,
  CmsTabPanel,
  TABS,
  TOP_DEALS_VISIBILITY_BLOCK,
  TRENDING_VISIBILITY_BLOCK,
} from "./cmsShared";
import CountryDestinationInfoPanel from "@/components/admin/cms/CountryDestinationInfoPanel";

// The editor for one CMS section key. Shared by /admin/cms/[section] and the
// Home Page builder (/admin/cms/home), which embeds it next to a live preview.
export default function CmsSectionContent({ activeTab, withExtras = true }: { activeTab: string; withExtras?: boolean }) {
  const currentListTab = TABS.find((t) => t.key === activeTab);
  const currentBlockTab = CONTENT_BLOCK_TABS.find((t) => t.key === activeTab);
  const isFooterTab = activeTab === FOOTER_TAB.key;
  const isCountryGuideTab = activeTab === COUNTRY_DESTINATION_GUIDE_TAB.key;

  return (
    <div className="space-y-5">
      {currentListTab ? (
        <div className="space-y-5">
          <CmsTabPanel key={currentListTab.key} tab={currentListTab} />
          {withExtras && currentListTab.key === "banners" && (
            <ContentBlockPanel key={HERO_EXTRAS_BLOCK.key} tab={HERO_EXTRAS_BLOCK} />
          )}
          {withExtras && currentListTab.key === "tours-on-deals" && (
            <ContentBlockPanel key={TOP_DEALS_VISIBILITY_BLOCK.key} tab={TOP_DEALS_VISIBILITY_BLOCK} />
          )}
          {withExtras && currentListTab.key === "popular-tours" && (
            <ContentBlockPanel key={TRENDING_VISIBILITY_BLOCK.key} tab={TRENDING_VISIBILITY_BLOCK} />
          )}
          {withExtras && currentListTab.key === "favourite-countries" && (
            <ContentBlockPanel key={FAVOURITE_COUNTRIES_HEADING_BLOCK.key} tab={FAVOURITE_COUNTRIES_HEADING_BLOCK} />
          )}
        </div>
      ) : currentBlockTab ? (
        <ContentBlockPanel key={currentBlockTab.key} tab={currentBlockTab} />
      ) : isFooterTab ? (
        <FooterPanel />
      ) : isCountryGuideTab ? (
        <CountryDestinationInfoPanel />
      ) : (
        <section className="rounded-xl border border-dash-border bg-white p-6 text-center">
          <p className="text-sm font-bold text-dash-text">Unknown CMS section &ldquo;{activeTab}&rdquo;.</p>
          <p className="mt-1 text-sm text-dash-muted">Pick a section from the sidebar.</p>
        </section>
      )}
    </div>
  );
}

"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";
import { CONTENT_BLOCK_TABS, ContentBlockPanel } from "@/app/admin/cms/cmsShared";

const AFFILIATE_PORTAL_FOOTER = CONTENT_BLOCK_TABS.find((tab) => tab.key === "affiliate-portal-footer");

const AFFILIATE_PORTAL_SECTIONS: PageEditorSection[] = [
  { key: "hero", label: "Hero Banner", tabs: ["affiliate-portal-hero"] },
  { key: "stats", label: "Stats Strip", tabs: ["affiliate-portal-stats"] },
  { key: "perks", label: "Why Join Perks", tabs: ["affiliate-portal-perks"] },
  { key: "ideal", label: "Ideal For", tabs: ["affiliate-portal-ideal-for"] },
  { key: "cta", label: "Bottom CTA", tabs: ["affiliate-portal-cta"] },
  { key: "footer", label: "Footer", render: () => AFFILIATE_PORTAL_FOOTER ? <ContentBlockPanel tab={AFFILIATE_PORTAL_FOOTER} /> : null },
];

export default function AffiliatePortalPageEditor() {
  return <PageEditor sections={AFFILIATE_PORTAL_SECTIONS} previewTitle="Live Affiliate Portal page" previewSrc={() => "/affiliate-portal"} />;
}

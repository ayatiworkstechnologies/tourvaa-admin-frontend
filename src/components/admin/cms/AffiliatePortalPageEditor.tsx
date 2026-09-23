"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

const AFFILIATE_PORTAL_SECTIONS: PageEditorSection[] = [
  { key: "hero", label: "Hero Banner", tabs: ["affiliate-portal-hero"] },
  { key: "stats", label: "Stats Strip", tabs: ["affiliate-portal-stats"] },
  { key: "perks", label: "Why Join Perks", tabs: ["affiliate-portal-perks"] },
  { key: "ideal", label: "Ideal For", tabs: ["affiliate-portal-ideal-for"] },
  { key: "cta", label: "Bottom CTA", tabs: ["affiliate-portal-cta"] },
];

export default function AffiliatePortalPageEditor() {
  return <PageEditor sections={AFFILIATE_PORTAL_SECTIONS} previewTitle="Live Affiliate Portal page" previewSrc={() => "/affiliate-portal"} />;
}

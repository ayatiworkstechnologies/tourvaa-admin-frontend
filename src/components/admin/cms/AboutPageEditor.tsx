"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

// The About Us page top to bottom - one entry per visible section.
const ABOUT_SECTIONS: PageEditorSection[] = [
  { key: "hero", label: "Hero Banner", tabs: ["about-page-hero"] },
  { key: "story", label: "Our Story & Gallery", tabs: ["about-page-story", "about-page-gallery"] },
  { key: "metrics", label: "Stats / Metrics", tabs: ["about-page-metrics"] },
  { key: "values", label: "Why Choose Us", tabs: ["about-page-values"] },
  { key: "team", label: "Our Team", tabs: ["about-page-team"] },
  { key: "awards", label: "Awards & Recognition", tabs: ["about-page-awards"] },
  { key: "cta", label: "Bottom CTA", tabs: ["about-page-cta"] },
];

export default function AboutPageEditor() {
  return <PageEditor sections={ABOUT_SECTIONS} previewTitle="Live About page" previewSrc={() => "/about"} />;
}

"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

const TRAVEL_ADVICE_SECTIONS: PageEditorSection[] = [
  { key: "hero", label: "Hero Banner", tabs: ["travel-advice-hero"] },
  { key: "categories", label: "Advice Categories", tabs: ["travel-advice-categories"] },
  { key: "articles", label: "Featured Articles", tabs: ["travel-advice-articles"] },
  { key: "essentials", label: "Pre-Flight Checklist", tabs: ["travel-advice-essentials"] },
];

export default function TravelAdvicePageEditor() {
  return <PageEditor sections={TRAVEL_ADVICE_SECTIONS} previewTitle="Live Travel Advice page" previewSrc={() => "/travel-advice"} />;
}

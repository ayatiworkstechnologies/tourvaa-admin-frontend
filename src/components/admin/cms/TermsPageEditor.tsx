"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

const TERMS_SECTIONS: PageEditorSection[] = [
  { key: "header", label: "Page Header", tabs: ["terms-page-hero"] },
  { key: "clauses", label: "Clauses / Sections", tabs: ["terms-page-sections"] },
];

export default function TermsPageEditor() {
  return <PageEditor sections={TERMS_SECTIONS} previewTitle="Live Terms & Conditions page" previewSrc={() => "/terms"} />;
}

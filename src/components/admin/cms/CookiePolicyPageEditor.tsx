"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

const COOKIE_SECTIONS: PageEditorSection[] = [
  { key: "header", label: "Page Header", tabs: ["cookie-page-hero"] },
  { key: "clauses", label: "Clauses / Sections", tabs: ["cookie-page-sections"] },
];

export default function CookiePolicyPageEditor() {
  return <PageEditor sections={COOKIE_SECTIONS} previewTitle="Live Cookie Policy page" previewSrc={() => "/cookie-policy"} />;
}

"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

const PRIVACY_SECTIONS: PageEditorSection[] = [
  { key: "header", label: "Page Header", tabs: ["privacy-page-hero"] },
  { key: "clauses", label: "Clauses / Sections", tabs: ["privacy-page-sections"] },
];

export default function PrivacyPolicyPageEditor() {
  return <PageEditor sections={PRIVACY_SECTIONS} previewTitle="Live Privacy Policy page" previewSrc={() => "/privacy-policy"} />;
}

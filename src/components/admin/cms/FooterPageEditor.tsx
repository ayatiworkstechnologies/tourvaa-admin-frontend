"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

const SECTIONS: PageEditorSection[] = [
  { key: "links", label: "Footer Links", tabs: ["footer"] },
  { key: "social", label: "Social Media Links", tabs: ["social-links"] },
];

// The site footer, previewed live (the homepage scrolled to its bottom).
export default function FooterPageEditor() {
  return <PageEditor sections={SECTIONS} previewTitle="Live footer" previewSrc={() => "/"} scrollToBottom />;
}

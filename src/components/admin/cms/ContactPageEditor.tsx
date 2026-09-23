"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";

// The Contact Us page top to bottom - one entry per visible section.
const CONTACT_SECTIONS: PageEditorSection[] = [
  { key: "hero", label: "Hero Banner", tabs: ["contact-page-hero"] },
  { key: "support", label: "Support Cards", tabs: ["contact-page-support-cards"] },
  { key: "channels", label: "Contact Channels", tabs: ["contact-page-channels"] },
  { key: "faqs", label: "FAQs", tabs: ["contact-page-faqs"] },
  { key: "partners", label: "Partner Cards", tabs: ["contact-page-partners"] },
  { key: "offices", label: "Our Offices", tabs: ["contact-page-offices"] },
];

export default function ContactPageEditor() {
  return <PageEditor sections={CONTACT_SECTIONS} previewTitle="Live Contact page" previewSrc={() => "/contact"} />;
}

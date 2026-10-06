"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";
import { FooterPanel } from "@/app/admin/cms/cmsShared";

const SUPPLIER_PORTAL_SECTIONS: PageEditorSection[] = [
  { key: "hero", label: "Hero Banner", tabs: ["supplier-portal-hero"] },
  { key: "metrics", label: "Metrics Strip", tabs: ["supplier-portal-metrics"] },
  { key: "features", label: "Capabilities", tabs: ["supplier-portal-features"] },
  { key: "steps", label: "How It Works", tabs: ["supplier-portal-steps"] },
  { key: "documents", label: "Verification Documents", tabs: ["supplier-portal-documents"] },
  { key: "expectations", label: "What We Expect", tabs: ["supplier-portal-expectations"] },
  { key: "faqs", label: "FAQs", tabs: ["supplier-portal-faqs"] },
  { key: "cta", label: "Bottom CTA", tabs: ["supplier-portal-cta"] },
  { key: "footer", label: "Footer", render: () => <FooterPanel /> },
];

export default function SupplierPortalPageEditor() {
  return <PageEditor sections={SUPPLIER_PORTAL_SECTIONS} previewTitle="Live Supplier Portal page" previewSrc={() => "/supplier-portal"} />;
}

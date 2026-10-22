"use client";

import PageEditor, { type PageEditorSection } from "./PageEditor";
import { CONTENT_BLOCK_TABS, ContentBlockPanel } from "@/app/admin/cms/cmsShared";

const AGENT_PORTAL_FOOTER = CONTENT_BLOCK_TABS.find((tab) => tab.key === "agent-portal-footer");

const AGENT_PORTAL_SECTIONS: PageEditorSection[] = [
  { key: "hero", label: "Hero Banner", tabs: ["agent-portal-hero"] },
  { key: "metrics", label: "Metrics Strip", tabs: ["agent-portal-metrics"] },
  { key: "features", label: "Tools", tabs: ["agent-portal-features"] },
  { key: "steps", label: "How It Works", tabs: ["agent-portal-steps"] },
  { key: "documents", label: "Verification Documents", tabs: ["agent-portal-documents"] },
  { key: "expectations", label: "What We Expect", tabs: ["agent-portal-expectations"] },
  { key: "faqs", label: "FAQs", tabs: ["agent-portal-faqs"] },
  { key: "cta", label: "Bottom CTA", tabs: ["agent-portal-cta"] },
  { key: "footer", label: "Footer", render: () => AGENT_PORTAL_FOOTER ? <ContentBlockPanel tab={AGENT_PORTAL_FOOTER} /> : null },
];

export default function AgentPortalPageEditor() {
  return <PageEditor sections={AGENT_PORTAL_SECTIONS} previewTitle="Live Agent Portal page" previewSrc={() => "/agent-portal"} />;
}

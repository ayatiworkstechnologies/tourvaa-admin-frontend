"use client";
import PageEditor from "./PageEditor";
export default function PartnerLegalPageEditor({ page }: { page: string }) {
  return <PageEditor sections={[{ key: "header", label: "Page Header", tabs: [`${page}-hero`] }, { key: "clauses", label: "Clauses / Sections", tabs: [`${page}-sections`] }]} previewTitle="Legal page preview" previewSrc={() => `/${page}`} />;
}

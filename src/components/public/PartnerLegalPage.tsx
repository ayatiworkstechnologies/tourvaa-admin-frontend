"use client";
import LegalPageLayout, { type LegalSection } from "@/components/public/LegalPageLayout";
import { useContentBlock } from "@/hooks/useContentBlock";
import TermsPage from "@/app/(public)/terms/page";
import PrivacyPage from "@/app/(public)/privacy-policy/page";

type Hero = { title?: string; subtitle?: string; intro?: string };
type Item = { title?: string; body?: string };
export default function PartnerLegalPage({ page, title }: { page: string; title: string }) {
  const key = page.replaceAll("-", "_");
  const hero = useContentBlock<Hero>(`${key}_hero`, {});
  const block = useContentBlock<{ items?: Item[] }>(`${key}_sections`, {});
  if (!block.items?.length) return <><div className="bg-blue-50 px-4 py-3 text-center text-sm text-blue-900">The general Tourvaa policy is shown while the {title} is being prepared.</div>{page.endsWith("terms") ? <TermsPage /> : <PrivacyPage />}</>;
  const sections: LegalSection[] = block.items.map((item, index) => ({ id: `section-${index + 1}`, number: index + 1, label: item.title || `Section ${index + 1}`, body: (item.body || "").split("\n").filter(Boolean).map((line, i) => <p key={i}>{line}</p>) }));
  return <LegalPageLayout showMetadata={false} title={hero.title || title} subtitle={hero.subtitle || ""} intro={hero.intro} sections={sections} />;
}

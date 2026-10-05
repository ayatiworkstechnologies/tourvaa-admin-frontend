"use client";

import { useParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import CmsSectionContent from "../CmsSectionContent";
import HomePageEditor from "@/components/admin/cms/HomePageEditor";
import CountryPagesEditor from "@/components/admin/cms/CountryPagesEditor";
import FooterPageEditor from "@/components/admin/cms/FooterPageEditor";
import AboutPageEditor from "@/components/admin/cms/AboutPageEditor";
import ContactPageEditor from "@/components/admin/cms/ContactPageEditor";
import TermsPageEditor from "@/components/admin/cms/TermsPageEditor";
import PrivacyPolicyPageEditor from "@/components/admin/cms/PrivacyPolicyPageEditor";
import CookiePolicyPageEditor from "@/components/admin/cms/CookiePolicyPageEditor";
import TravelAdvicePageEditor from "@/components/admin/cms/TravelAdvicePageEditor";
import SupplierPortalPageEditor from "@/components/admin/cms/SupplierPortalPageEditor";
import AgentPortalPageEditor from "@/components/admin/cms/AgentPortalPageEditor";
import AffiliatePortalPageEditor from "@/components/admin/cms/AffiliatePortalPageEditor";
import ToursListingPageEditor from "@/components/admin/cms/ToursListingPageEditor";
import PageSeoEditor from "@/components/admin/cms/PageSeoEditor";

// Sections rendered by their own dedicated "sections + live preview" editor
// rather than the generic single-tab CmsSectionContent fallback below.
const PAGE_EDITORS: Record<string, React.ComponentType> = {
  home: HomePageEditor,
  "country-pages": CountryPagesEditor,
  footer: FooterPageEditor,
  about: AboutPageEditor,
  contact: ContactPageEditor,
  terms: TermsPageEditor,
  "privacy-policy": PrivacyPolicyPageEditor,
  "cookie-policy": CookiePolicyPageEditor,
  "travel-advice": TravelAdvicePageEditor,
  "supplier-portal": SupplierPortalPageEditor,
  "agent-portal": AgentPortalPageEditor,
  "affiliate-portal": AffiliatePortalPageEditor,
  "tours-listing": ToursListingPageEditor,
  seo: PageSeoEditor,
};

// Navigation between CMS sections lives in the dedicated CMS sidebar
// (see CmsSidebar), so this page is just the active section's editor.
export default function CmsSectionPage() {
  const params = useParams<{ section: string }>();
  const activeTab = params.section;
  const PageEditorComponent = PAGE_EDITORS[activeTab];

  return (
    <ModuleWrapper title="CMS Management" requiredPermission={["website_cms.view", "settings.view"]}>
      {PageEditorComponent ? <PageEditorComponent /> : <CmsSectionContent activeTab={activeTab} />}
    </ModuleWrapper>
  );
}

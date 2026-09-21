"use client";

import { useParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import CmsSectionContent from "../CmsSectionContent";
import HomePageEditor from "@/components/admin/cms/HomePageEditor";
import CountryPagesEditor from "@/components/admin/cms/CountryPagesEditor";
import FooterPageEditor from "@/components/admin/cms/FooterPageEditor";

// Navigation between CMS sections lives in the dedicated CMS sidebar
// (see CmsSidebar), so this page is just the active section's editor.
// "home" is the exception: the whole-homepage builder with a live preview.
export default function CmsSectionPage() {
  const params = useParams<{ section: string }>();
  const activeTab = params.section;

  return (
    <ModuleWrapper title="CMS Management" requiredPermission={["website_cms.view", "settings.view"]}>
      {activeTab === "home" ? <HomePageEditor />
        : activeTab === "country-pages" ? <CountryPagesEditor />
        : activeTab === "footer" ? <FooterPageEditor />
        : <CmsSectionContent activeTab={activeTab} />}
    </ModuleWrapper>
  );
}

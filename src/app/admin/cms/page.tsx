"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ALL_TABS } from "./cmsShared";

// /admin/cms has no content of its own - each section now lives at its own
// bookmarkable URL (/admin/cms/hero, /admin/cms/country-pages, ...), see
// [section]/page.tsx. Landing here (e.g. from the sidebar link) sends you
// straight to the first section.
export default function CmsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/cms/${ALL_TABS[0].key}`);
  }, [router]);

  return null;
}

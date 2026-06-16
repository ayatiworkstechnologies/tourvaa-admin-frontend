"use client";

import ReviewListPage from "@/components/operations/ReviewListPage";

export default function AffiliatesPage() {
  return <ReviewListPage module="affiliates" title="Affiliates" requiredPermission="affiliates.view" />;
}

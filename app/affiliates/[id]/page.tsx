"use client";

import { useParams } from "next/navigation";
import ReviewDetailPage from "@/components/operations/ReviewDetailPage";

export default function AffiliateDetailPage() {
  const params = useParams<{ id: string }>();
  return <ReviewDetailPage module="affiliates" id={params.id} title="Affiliate Detail" requiredPermission="affiliates.view" />;
}

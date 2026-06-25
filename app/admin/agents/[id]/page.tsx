"use client";

import { useParams } from "next/navigation";
import ReviewDetailPage from "@/components/operations/ReviewDetailPage";

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  return <ReviewDetailPage module="agents" id={params.id} title="Agent Detail" requiredPermission="agents.view" />;
}

"use client";

import ReviewListPage from "@/components/operations/ReviewListPage";

export default function AgentsPage() {
  return <ReviewListPage module="agents" title="Agents" requiredPermission="agents.view" />;
}

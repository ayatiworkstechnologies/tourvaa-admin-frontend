"use client";

import ReviewListPage from "@/components/operations/ReviewListPage";

export default function SuppliersPage() {
  return <ReviewListPage module="suppliers" title="Suppliers" requiredPermission="suppliers.view" />;
}

"use client";

import { useParams } from "next/navigation";
import ReviewDetailPage from "@/components/operations/ReviewDetailPage";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  return <ReviewDetailPage module="suppliers" id={params.id} title="Supplier Detail" requiredPermission="suppliers.view" />;
}

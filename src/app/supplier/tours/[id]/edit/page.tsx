"use client";

import { useParams } from "next/navigation";
import { SupplierPageShell } from "@/components/supplier/SupplierPage";
import TourWizard from "@/components/tours/TourWizard";

export default function TourEditPage() {
  const params = useParams<{ id: string }>();
  return (
    <SupplierPageShell>
      <TourWizard tourId={params.id} role="supplier" />
    </SupplierPageShell>
  );
}

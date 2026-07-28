"use client";

import TourWizard from "@/components/tours/TourWizard";
import { SupplierPageShell } from "@/components/supplier/SupplierPage";

export default function CreateTourPage() {
  return (
    <SupplierPageShell>
      <TourWizard role="supplier" />
    </SupplierPageShell>
  );
}

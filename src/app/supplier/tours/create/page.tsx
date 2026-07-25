"use client";

import { useRouter } from "next/navigation";
import TourFormPage from "@/components/cms/TourFormPage";
import { SupplierPageShell } from "@/components/supplier/SupplierPage";

export default function CreateTourPage() {
  const router = useRouter();

  return (
    <SupplierPageShell>
      <TourFormPage
        role="supplier"
        onSaved={(saved) => {
          const id = (saved as { id?: number } | undefined)?.id;
          router.push(id ? `/supplier/tours/${id}/edit` : "/supplier/tours");
        }}
      />
    </SupplierPageShell>
  );
}

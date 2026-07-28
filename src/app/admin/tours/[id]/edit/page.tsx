"use client";

import { useParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import TourWizard from "@/components/tours/TourWizard";

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  return (
    <ModuleWrapper title="Edit Tour" requiredPermission="tours.edit">
      <TourWizard tourId={params.id} role="admin" />
    </ModuleWrapper>
  );
}

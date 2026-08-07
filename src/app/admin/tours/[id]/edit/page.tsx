"use client";

import { useParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import TourEditPage from "@/components/tours/TourEditPage";

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  return (
    <ModuleWrapper title="Edit Tour" requiredPermission="tours.edit">
      <TourEditPage tourId={params.id} />
    </ModuleWrapper>
  );
}

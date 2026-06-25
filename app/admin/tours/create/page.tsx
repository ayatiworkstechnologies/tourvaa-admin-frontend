"use client";

import TourFormPage from "@/components/cms/TourFormPage";
import ModuleWrapper from "@/components/common/ModuleWrapper";

export default function CreateTourPage() {
  return (
    <ModuleWrapper title="Create Tour" requiredPermission="tours.create">
      <TourFormPage />
    </ModuleWrapper>
  );
}
